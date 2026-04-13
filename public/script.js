const feedbackForm    = document.getElementById("feedbackForm");
const nameInput       = document.getElementById("name");
const messageInput    = document.getElementById("message");
const charCounter     = document.getElementById("charCounter");
const submitBtn       = document.getElementById("submitBtn");
const errorBox        = document.getElementById("errorBox");
const successMessage  = document.getElementById("successMessage");
const feedList        = document.getElementById("feedList");
const feedCount       = document.getElementById("feedCount");
const feedPlaceholder = document.getElementById("feedPlaceholder");



const API_BASE = ""; // Empty = same origin (relative URLs)

function formatTimestamp(isoString) {
  const date  = new Date(isoString);
  const now   = new Date();
  const diffMs = now - date;             // difference in milliseconds
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);

  if (diffSec < 10)  return "Just now";
  if (diffSec < 60)  return `${diffSec} seconds ago`;
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60)  return `${diffMin} minutes ago`;
  if (diffHr  === 1) return "1 hour ago";
  if (diffHr  < 24)  return `${diffHr} hours ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return `${diffDay} days ago`;

  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}



function renderStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}



function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}



function getSelectedRating() {
  const checked = document.querySelector('input[name="rating"]:checked');
  return checked ? parseInt(checked.value, 10) : null;
}



function validateForm() {
  const errors = [];

  if (!nameInput.value.trim()) {
    errors.push("Please enter your name.");
    nameInput.classList.add("is-error");
  } else {
    nameInput.classList.remove("is-error");
  }

  if (!getSelectedRating()) {
    errors.push("Please select a star rating.");
  }

  if (!messageInput.value.trim()) {
    errors.push("Please write a message.");
    messageInput.classList.add("is-error");
  } else if (messageInput.value.trim().length < 5) {
    errors.push("Message must be at least 5 characters.");
    messageInput.classList.add("is-error");
  } else {
    messageInput.classList.remove("is-error");
  }

  return errors;
}




function showErrors(errors) {
  if (errors.length === 0) {
    errorBox.classList.remove("is-visible");
    errorBox.innerHTML = "";
    return;
  }

  const listItems = errors.map(e => `<li>${escapeHtml(e)}</li>`).join("");
  errorBox.innerHTML = `<ul>${listItems}</ul>`;
  errorBox.classList.add("is-visible");
}


function setLoading(isLoading) {
  submitBtn.disabled = isLoading;

  if (isLoading) {
    submitBtn.classList.add("is-loading");
  } else {
    submitBtn.classList.remove("is-loading");
  }
}


function showSuccess() {
  successMessage.classList.add("is-visible");

  setTimeout(() => {
    successMessage.classList.remove("is-visible");
  }, 4000);
}


function resetForm() {
  feedbackForm.reset();  // Clears all native inputs

  document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);

  charCounter.textContent = "0 / 1000";
  charCounter.classList.remove("is-warning");

  nameInput.classList.remove("is-error");
  messageInput.classList.remove("is-error");
}



function createFeedbackCard(entry) {
  const card = document.createElement("article");
  card.className = "feedback-card";
  card.dataset.id = entry.id;  // Store ID for potential future use

  card.innerHTML = `
    <div class="feedback-card__header">
      <span class="feedback-card__name">${escapeHtml(entry.name)}</span>
      <span class="feedback-card__rating rating-${entry.rating}">
        ${renderStars(entry.rating)} ${entry.rating}/5
      </span>
    </div>
    <p class="feedback-card__message">${escapeHtml(entry.message)}</p>
    <time class="feedback-card__time" datetime="${entry.timestamp}">
      ${formatTimestamp(entry.timestamp)}
    </time>
  `;

  return card;
}



function renderFeed(entries) {
  feedList.innerHTML = "";

  feedCount.textContent = entries.length;

  if (entries.length === 0) {
    feedList.innerHTML = `
      <div class="feed-empty">
        <div class="feed-empty__icon"></div>
        <p class="feed-empty__text">No feedback yet. Be the first!</p>
      </div>
    `;
    return;
  }

  
  const fragment = document.createDocumentFragment();
  entries.forEach(entry => {
    fragment.appendChild(createFeedbackCard(entry));
  });

  feedList.appendChild(fragment);
}



async function fetchFeedback() {
  
  const response = await fetch(`${API_BASE}/feedback`);

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const result = await response.json();
  return result.data;  // Array of feedback entries
}


async function submitFeedback(payload) {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!response.ok) {
    const errorMsg = result.errors ? result.errors.join(", ") : "Submission failed.";
    throw new Error(errorMsg);
  }

  return result.data;  // The newly created entry
}



feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  showErrors([]);
  successMessage.classList.remove("is-visible");

  const errors = validateForm();
  if (errors.length > 0) {
    showErrors(errors);
    return;  // Stop here — don't make an API call with invalid data
  }

  const payload = {
    name:    nameInput.value.trim(),
    rating:  getSelectedRating(),
    message: messageInput.value.trim()
  };

  setLoading(true);

  try {
    const newEntry = await submitFeedback(payload);

    resetForm();
    showSuccess();

    const allEntries = await fetchFeedback();
    renderFeed(allEntries);

    feedList.scrollTop = 0;

  } catch (error) {
    showErrors([error.message || "Something went wrong. Please try again."]);
  } finally {
    setLoading(false);
  }
});



messageInput.addEventListener("input", () => {
  const length = messageInput.value.length;
  charCounter.textContent = `${length} / 1000`;

  if (length > 900) {
    charCounter.classList.add("is-warning");
  } else {
    charCounter.classList.remove("is-warning");
  }
});



nameInput.addEventListener("input", () => {
  nameInput.classList.remove("is-error");
  showErrors([]);
});

messageInput.addEventListener("input", () => {
  messageInput.classList.remove("is-error");
});



async function init() {
  try {
    const entries = await fetchFeedback();
    renderFeed(entries);
  } catch (error) {
    feedList.innerHTML = `
      <div class="feed-empty">
        <div class="feed-empty__icon"></div>
        <p class="feed-empty__text">Could not load feedback. Is the server running?</p>
      </div>
    `;
    feedCount.textContent = "0";
    console.error("Failed to load feedback:", error);
  }
}

// Kick everything off
init();

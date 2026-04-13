const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());


app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));



let feedbackData = [
  {
    id: 1,
    name: "Sarah K.",
    rating: 5,
    message: "Absolutely love the service! The team was responsive and solved my issue within minutes.",
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 2,
    name: "Marcus T.",
    rating: 4,
    message: "Great experience overall. Would appreciate faster response times, but very satisfied.",
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

let nextId = 3;



function validateFeedback(body) {
  const errors = [];

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    errors.push("Name is required.");
  } else if (body.name.trim().length > 100) {
    errors.push("Name must be 100 characters or fewer.");
  }

  const rating = Number(body.rating);
  if (!body.rating || isNaN(rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.push("Rating must be a whole number between 1 and 5.");
  }

  if (!body.message || typeof body.message !== "string" || body.message.trim().length === 0) {
    errors.push("Message is required.");
  } else if (body.message.trim().length > 1000) {
    errors.push("Message must be 1000 characters or fewer.");
  }

  return errors; 
}



app.get("/feedback", (req, res) => {
  const sorted = [...feedbackData].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  res.status(200).json({
    success: true,
    count: sorted.length,
    data: sorted
  });
});



app.post("/feedback", (req, res) => {
  const errors = validateFeedback(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const newEntry = {
    id: nextId++,
    name: req.body.name.trim(),
    rating: Number(req.body.rating),
    message: req.body.message.trim(),
    timestamp: new Date().toISOString() // ISO 8601 format: "2024-01-15T10:30:00.000Z"
  };

  feedbackData.push(newEntry);

  res.status(201).json({ success: true, data: newEntry });
});



app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.listen(PORT, () => {
  console.log(`\n Server running at http://localhost:${PORT}`);
  console.log(` GET  /feedback  → Retrieve all feedback`);
  console.log(` POST /feedback  → Submit new feedback\n`);
});

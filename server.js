// server.js
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Use an environment variable for MongoDB URL if available (set this in Render)
const mongoURL =
  process.env.MONGO_URL ||
  "mongodb+srv://sena:%40Senaatim2005@cluster0.gyks1.mongodb.net/webstore";
const dbName = "webstore";

let lessonsCollection, ordersCollection;

// Enable CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the "public" folder,
// and additionally serve files from "images" and "data" folders.
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/data", express.static(path.join(__dirname, "data")));

app.use(express.json());

// Connect to MongoDB
MongoClient.connect(mongoURL, { useUnifiedTopology: true })
  .then((client) => {
    const db = client.db(dbName);
    lessonsCollection = db.collection("products");
    ordersCollection = db.collection("orders");

    console.log("✅ Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// GET endpoint to fetch lessons (products)
app.get("/lessons", async (req, res) => {
  try {
    const lessons = await lessonsCollection.find().toArray();
    res.status(200).json(lessons);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lessons." });
  }
});

// POST endpoint to create orders
app.post("/orders", async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    address,
    city,
    state,
    zip,
    method,
    gift,
    items,
  } = req.body;

  if (!firstName || !lastName || !phone || !address || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newOrder = {
    firstName,
    lastName,
    phone,
    address,
    city,
    state,
    zip,
    method,
    gift,
    items,
    timestamp: new Date(),
  };

  try {
    const result = await ordersCollection.insertOne(newOrder);
    res.status(201).json({
      message: "Order placed successfully",
      orderId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
});

// PUT endpoint to update a lesson (product)
app.put("/lessons/:id", async (req, res) => {
  const lessonId = req.params.id;
  const updatedLesson = req.body;

  try {
    const result = await lessonsCollection.updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updatedLesson }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Lesson not found or unchanged" });
    }

    res.status(200).json({
      message: "Lesson updated successfully",
      lessonId,
      updated: updatedLesson,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lesson" });
  }
});

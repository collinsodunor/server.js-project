// ------------------------
// server.js
// ------------------------
const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');

const app = express();

// ------------------------
// Middleware
// ------------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ------------------------
// MongoDB Configuration
// ------------------------
const mongoUrl = process.env.MONGO_URI; // must be set in Docker Compose
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
const databaseName = "my-db"; // must match your Compose file

let dbClient;
let db;

// Retry logic: wait for MongoDB to be ready
async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await MongoClient.connect(mongoUrl, mongoClientOptions);
      dbClient = client;
      db = client.db(databaseName);
      console.log("✅ Connected to MongoDB");
      return;
    } catch (err) {
      console.log(`MongoDB connection attempt ${i} failed. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error("❌ Could not connect to MongoDB. Exiting...");
  process.exit(1);
}

// ------------------------
// Routes
// ------------------------

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve profile picture
app.get('/profile-picture', (req, res) => {
  const imgPath = path.join(__dirname, "images/profile-1.jpg");
  if (fs.existsSync(imgPath)) {
    const img = fs.readFileSync(imgPath);
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  } else {
    res.status(404).send("Profile picture not found");
  }
});

// Update profile
app.post('/update-profile', async (req, res) => {
  try {
    const userObj = req.body;
    userObj.userid = 1; // fixed user ID for demo

    const myquery = { userid: 1 };
    const newvalues = { $set: userObj };

    await db.collection("users").updateOne(myquery, newvalues, { upsert: true });
    res.send({ success: true, data: userObj });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send({ error: "Database error" });
  }
});

// Get profile
app.get('/get-profile', async (req, res) => {
  try {
    const result = await db.collection("users").findOne({ userid: 1 });
    res.send(result || {});
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).send({ error: "Database error" });
  }
});

// ------------------------
// Start server after MongoDB is ready
// ------------------------
const PORT = 3000;
connectWithRetry().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 App listening on port ${PORT}`);
  });
});

// ------------------------
// Graceful shutdown
// ------------------------
process.on('SIGINT', async () => {
  console.log("Shutting down...");
  if (dbClient) await dbClient.close();
  process.exit(0);
});

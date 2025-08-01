const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors());

app.get("/leaderboard/points", async (req, res) => {
  try {
    const snapshot = await db.collection("pointsLevelProgress")
        .orderBy("points", "desc").limit(10).get();

    const results = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const userId = data.userId;
      let username = "unknown";

      if (userId) {
        try {
          const userRecord = await admin.auth().getUserByEmail(userId);
          username = userRecord.displayName || userRecord.email || username;
        } catch (error){
          console.error ("error fetching user", error)
        }        
      }

      return {
        username,
        value: data.points || 0
      };
    }));

    res.json(results);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).send("Error");
  }
});

exports.api = functions.https.onRequest(app);



/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors());

// Top 10 users by points(note points and levels used here are interchangable)
app.get("/leaderboard/points", async (req, res) => {
  try {
    const snapshot = await db.collection("pointsLevelProgress")
        .orderBy("points", "desc").limit(10).get();
    const results = snapshot.docs.map(doc => ({
      username: doc.data().userId || "unkonwn",
      value: doc.data().points || 0
    }));
    res.json(results);
  } catch (err) {
    console.error("Level error:", err);
    res.status(500).send("Error");
  }
});

// Top 10 users by streak
app.get("/leaderboard/streaks", async (req, res) => {
  try {
    const snapshot = await db.collection("userStreak")
        .orderBy("maxStreak", "desc").limit(10).get();
    const results = snapshot.docs.map(doc => ({
      username: doc.data().userId || doc.id,
      //TODO:may need to modify database to store the userId instead of the random id genrated by firebase.
      value: doc.data().maxStreak || 0
    }));
    res.json(results);
  } catch (err) {
    console.error("Streak error:", err);
    res.status(500).send("Error");
  }
});

exports.api = functions.https.onRequest(app);

// from deployment
// https://api-n72gsjbtpa-uc.a.run.app/leaderboard/points
// https://api-n72gsjbtpa-uc.a.run.app/leaderboard/streaks

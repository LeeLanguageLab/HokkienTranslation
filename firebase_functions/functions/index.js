/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
/* eslint-disable max-len */
// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");
require("firebase-functions/logger/compat");
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Expo} = require("expo-server-sdk");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");

admin.initializeApp();
const expo = new Expo();

// Function to send flashcard quiz notifications
// Note these are not currently being used due to issues with sending data through push notifications but can
// be revamped for normal notifications.
exports.sendFlashcardQuiz = functions.https.onCall(
    async (data, context) => {
      const {userId, flashcardId} = data;

      // Get user token
      const userDoc = await admin.firestore()
          .collection("userTokens").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https
            .HttpsError("not-found", "User token not found");
      }

      const {expoPushToken} = userDoc.data();

      // Get flashcard data
      const flashcardDoc = await admin.firestore()
          .collection("flashcard").doc(flashcardId).get();
      if (!flashcardDoc.exists) {
        throw new functions.https
            .HttpsError("not-found", "Flashcard not found");
      }

      const flashcard = flashcardDoc.data();

      // Combine destination with otherOptions and shuffle
      const allOptions = [flashcard.destination, ...flashcard.otherOptions]
          .sort(() => Math.random() - 0.5);

      // Track the position of the correct answer
      const correctAnswerIndex = allOptions.indexOf(flashcard.destination);

      // Send notification with the Expo SDK
      const message = {
        to: expoPushToken,
        sound: "default",
        title: "Flashcard Quiz",
        body: `What does "${flashcard.origin}" mean?`,
        data: {
          flashcardId,
          correctAnswerIndex,
          options: allOptions,
          origin: flashcard.origin,
          destination: flashcard.destination,
          contextSentence: flashcard.contextSentence,
        },
        categoryId: "flashcard_quiz",
      };

      try {
        const ticket = await expo.sendPushNotificationsAsync([message]);
        return {success: true, ticket};
      } catch (error) {
        console.error("Error sending notification:", error);
        throw new functions.https.HttpsError("internal", "Failed to send notification");
      }
    });

// Function to trigger notifications after 60 seconds of inactivity
exports.sendFlashcardOnUserTokenUpdate = onDocumentUpdated("userTokens/{userId}",
    async (event) => {
      const userId = event.params.userId;
      const afterData = event.data.after.data();
      const beforeData = event.data.before.data();

      // Check if lastActive field was updated
      if (beforeData.lastActive?.toMillis() !== afterData.lastActive?.toMillis()) {
        console.log(`User ${userId} was active, waiting 60 seconds before sending notification`);

        // Wait for 60 seconds of inactivity
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Check if user is still inactive by getting the latest data
        const latestDoc = await admin.firestore()
            .collection("userTokens").doc(userId).get();
        const latestData = latestDoc.data();

        // If lastActive hasn't changed in the last 60 seconds, send notification
        if (latestData.lastActive?.toMillis() === afterData.lastActive?.toMillis()) {
          // Get a random flashcard
          const flashcardsSnapshot = await admin.firestore()
              .collection("flashcard")
              .limit(1)
              .get();

          if (flashcardsSnapshot.empty) {
            console.log("No flashcards found");
            return null;
          }

          const flashcardDoc = flashcardsSnapshot.docs[0];
          const flashcardId = flashcardDoc.id;
          const flashcard = flashcardDoc.data();

          const {expoPushToken} = latestData;

          // Ensure we have a valid Expo push token
          if (!Expo.isExpoPushToken(expoPushToken)) {
            console.log(`Invalid Expo push token: ${expoPushToken}`);
            return null;
          }

          // Combine destination with otherOptions and shuffle
          const allOptions = [flashcard.destination, ...flashcard.otherOptions].sort(
              () => Math.random() - 0.5);

          // Track the position of the correct answer
          const correctAnswerIndex = allOptions.indexOf(flashcard.destination);

          // Send notification with the Expo SDK
          const message = {
            to: expoPushToken,
            sound: "default",
            title: "Flashcard Quiz",
            body: `What does "${flashcard.origin}" mean?`,
            data: {
              flashcardId,
              correctAnswerIndex,
              options: allOptions,
              origin: flashcard.origin,
              destination: flashcard.destination,
              contextSentence: flashcard.contextSentence,
            },
            categoryId: "flashcard_quiz",
          };

          try {
            const ticket = await expo.sendPushNotificationsAsync([message]);
            console.log(`Notification sent to user ${userId} after 60 seconds of inactivity`);
            return {success: true, ticket};
          } catch (error) {
            console.error("Error sending notification:", error);
            return null;
          }
        } else {
          console.log(`User ${userId} became active again, not sending notification`);
          return null;
        }
      }

      return null;
    });

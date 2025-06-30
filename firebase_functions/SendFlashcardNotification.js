// Cloud function to send interactive flashcard notification
exports.sendFlashcardQuiz = functions.https.onCall(async (data, context) => {
  const { userId, flashcardId } = data;

  // Get user token
  const userDoc = await admin.firestore().collection('userTokens').doc(userId).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User token not found');
  }

  const { expoPushToken } = userDoc.data();

  // Get flashcard data
  const flashcardDoc = await admin.firestore().collection('flashcard').doc(flashcardId).get();
  if (!flashcardDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Flashcard not found');
  }

  const flashcard = flashcardDoc.data();

  const allOptions = [
    flashcard.destination,
    ...flashcard.otherOptions
  ].sort(() => Math.random() - 0.5);
  // TODO There might be a glitch here because there are 3 options so we might not have a destination.

  // Track the position of the correct answer
  const correctAnswerIndex = allOptions.indexOf(flashcard.destination);

  // Send notification with the Expo SDK
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Flashcard Quiz',
    body: `What does "${flashcard.origin}" mean?`,
    data: {
      flashcardId,
      correctAnswerIndex, // Store the index of the correct answer
      options: allOptions,
      origin: flashcard.origin,
      destination: flashcard.destination
    },
    categoryId: 'flashcard_quiz', // This links to our interactive notification category
  };

  try {
    const expo = new Expo();
    const ticket = await expo.sendPushNotificationsAsync([message]);
    return { success: true, ticket };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

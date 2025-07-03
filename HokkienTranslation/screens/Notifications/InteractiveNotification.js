import * as Notifications from 'expo-notifications';

// Function to set up notification categories for flashcards
// Note this function is not being currently used due to issues with sending data through push notifications.
export async function setupFlashcardCategories(options) {
  // Create a category for flashcard quiz notifications
  await Notifications.setNotificationCategoryAsync('flashcard_quiz', [
    {
      identifier: 'option_1',
      buttonTitle: options[0], // This will be dynamically replaced when sending
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      }
    },
    {
      identifier: 'option_2',
      buttonTitle: options[1], // This will be dynamically replaced when sending
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      }
    },
    {
      identifier: 'option_3',
      buttonTitle: options[2], // This will be dynamically replaced when sending
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      }
    },
  ]);

  console.log('Flashcard notification categories set up successfully');
}

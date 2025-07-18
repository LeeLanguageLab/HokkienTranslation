import { updateUserStats, getUserStats } from './BadgesFunctions';
import { checkAndUpdateStreak } from '../streaks/CheckAndUpdateStreak';
import { evaluateAndAwardBadges } from './BadgeEvaluator';
import {serverTimestamp} from "firebase/firestore";
import  MixpanelService  from '../API/Mixpanel';

export const recordEvent = async (userId, eventType, eventData = {}, toast = null) => {
  await MixpanelService.initialize();

  try {
    // Get current stats
    const currentStats = await getUserStats(userId) || {};

    let statsUpdate = {
      last_activity: serverTimestamp()
    };

    // Handle different event types (same as before)
    switch (eventType) {
      case 'QUIZ_COMPLETED':
        statsUpdate = {
          ...statsUpdate,
          total_quiz_attempts: (currentStats.total_quiz_attempts || 0) + 1,
          total_quiz_completions: (currentStats.total_quiz_completions || 0) + 1
        };
        break;

      case 'QUIZ_ATTEMPTED':
        statsUpdate = {
          ...statsUpdate,
          total_quiz_attempts: (currentStats.total_quiz_attempts || 0) + 1
        };
        break;

      case 'LEVEL_COMPLETED':
        statsUpdate = {
          ...statsUpdate,
          total_level_completions: (currentStats.total_level_completions || 0) + 1
        };
        break;

      case 'DECK_COMPLETED':
        statsUpdate = {
          ...statsUpdate,
          total_deck_completions: (currentStats.total_deck_completions || 0) + 1
        };
        break;

      case 'HIGH_SCORE':
        statsUpdate = {
          ...statsUpdate,
          highest_quiz_score: Math.max(eventData.score || 0, currentStats.highest_quiz_score || 0)
        };
        break;

      default:
        console.warn(`Unknown event type: ${eventType}`);
        return currentStats;
    }

    // Update stats using your existing function
    await updateUserStats(userId, statsUpdate);

    // Update streak using your existing function
    const streakResult = await checkAndUpdateStreak();

    // Add streak data to updated stats for badge evaluation
    const updatedStats = {
      ...(await getUserStats(userId)),
      daily_streak: streakResult.streakCount || 0,
      max_daily_streak: streakResult.maxStreak || 0,
      is_new_streak: streakResult.isNewStreak || false
    };

    const newBadges = await evaluateAndAwardBadges(userId, updatedStats, eventType, eventData, toast);

    console.log(`Event ${eventType} recorded for user ${userId}`);
    return { updatedStats, newBadges, streakResult };

  } catch (error) {
    console.error('Error recording event:', error);
    throw error;
  }
};

// Convenience functions
export const recordQuizCompletion = async (userId, quizData, toast = null) => {
  const result = await recordEvent(userId, 'QUIZ_COMPLETED', quizData, toast);

  // Record high score if applicable
  if (quizData.score) {
    await recordEvent(userId, 'HIGH_SCORE', { score: quizData.score }, toast);
  }

  return result;
};

export const recordLevelCompletion = async (userId, levelData, toast = null) => {
  return recordEvent(userId, 'LEVEL_COMPLETED', levelData, toast);
};

export const recordDeckCompletion = async (userId, deckData, toast = null) => {
  return recordEvent(userId, 'DECK_COMPLETED', deckData, toast);
};

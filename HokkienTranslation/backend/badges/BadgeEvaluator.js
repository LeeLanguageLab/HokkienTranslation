// backend/badges/BadgeEvaluator.js
import {
    getAllAchievements,
    getUserAchievements,
    awardAchievement,
    updateAchievementProgress
} from './BadgesFunctions';
import {showBadgeNotification} from './BadgeNotifications';

export const evaluateAndAwardBadges = async (userId, userStats, eventType, eventData, toast = null) => {
    try {
        // Get all achievements and user's current achievements
        const [allAchievements, userAchievements] = await Promise.all([
            getAllAchievements(),
            getUserAchievements(userId)
        ]);

        // Create a set of earned achievement IDs for quick lookup
        const earnedAchievementIds = new Set(
            userAchievements
                .filter(achievement => achievement.is_completed)
                .map(achievement => achievement.achievement_id)
        );

        const newlyEarnedBadges = [];

        // Check each achievement
        for (const achievement of allAchievements) {
            // Skip if already earned
            if (earnedAchievementIds.has(achievement.achievement_id)) {
                continue;
            }

            const {isEarned, progress} = evaluateAchievement(achievement, userStats, eventData);

            if (isEarned) {
                // Award the badge using your existing function
                await awardAchievement(userId, achievement.achievement_id, progress);
                newlyEarnedBadges.push(achievement);
                console.log(`🏆 Badge earned: ${achievement.name} (${achievement.rarity})`);
            } else if (progress > 0) {
                // Update progress using your existing function
                await updateAchievementProgress(userId, achievement.achievement_id, progress);
            }
        }

        // Show notifications for newly earned badges (pass toast instance)
        if (newlyEarnedBadges.length > 0 && toast) {
            showBadgeNotification(newlyEarnedBadges, toast);
        }

        return newlyEarnedBadges;

    } catch (error) {
        console.error('Error evaluating badges:', error);
        throw error;
    }
};

const evaluateAchievement = (achievement, userStats, eventData) => {
    const criteria = achievement.required_criteria;
    let progress = 0;
    let isEarned = false;

    switch (criteria.type) {
        case 'quiz_attempts':
            progress = userStats.total_quiz_attempts || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'level_completion':
            progress = userStats.total_level_completions || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'deck_completion':
            progress = userStats.total_deck_completions || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'daily_streak':
            // Use the streak data from your streak system
            progress = userStats.daily_streak || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'max_daily_streak':
            // For achievements based on maximum streak achieved
            progress = userStats.max_daily_streak || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'single_quiz_score':
            // This is immediate - either earned this event or not
            progress = eventData.score || 0;
            isEarned = progress >= criteria.target_value;
            break;

        case 'quiz_percentage':
            // Perfect score achievement
            progress = eventData.percentage || 0;
            isEarned = progress === criteria.target_value;
            break;

        default:
            console.warn(`Unknown criteria type: ${criteria.type}`);
            return {isEarned: false, progress: 0};
    }

    return {isEarned, progress: Math.min(progress, criteria.target_value)};
};

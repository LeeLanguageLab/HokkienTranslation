import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy, serverTimestamp
} from 'firebase/firestore';
import {db} from '../database/Firebase';

// Get all available achievements
export const getAllAchievements = async () => {
    try {
        const achievementsRef = collection(db, 'achievements');
        const snapshot = await getDocs(achievementsRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching achievements:', error);
        throw error;
    }
};

export const getUserAchievements = async (userId) => {
    try {
        const userAchievementsRef = collection(db, 'users', userId, 'achievements');
        const snapshot = await getDocs(userAchievementsRef);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching user achievements:', error);
        throw error;
    }
};

// Get user stats
export const getUserStats = async (userId) => {
    try {
        const userStatsRef = doc(db, 'users', userId);
        const snapshot = await getDoc(userStatsRef);

        return snapshot.exists() ? snapshot.data().stats : null;
    } catch (error) {
        console.error('Error fetching user stats:', error);
        throw error;
    }
};

// Award achievement to user
export const awardAchievement = async (userId, achievementId, progress = 0) => {
    try {
        const userAchievementRef = doc(db, 'users', userId, 'achievements', achievementId);

        await setDoc(userAchievementRef, {
            achievement_id: achievementId,
            earned_at: serverTimestamp(),
            progress: progress,
            is_completed: true
        });

        console.log(`Achievement ${achievementId} awarded to user ${userId}`);
    } catch (error) {
        console.error('Error awarding achievement:', error);
        throw error;
    }
};

// Update user progress toward achievement
export const updateAchievementProgress = async (userId, achievementId, progress) => {
    try {
        const userAchievementRef = doc(db, 'users', userId, 'achievements', achievementId);

        await setDoc(userAchievementRef, {
            achievement_id: achievementId,
            progress: progress,
            is_completed: false,
            updatedated_at: serverTimestamp()
        }, {merge: true});

    } catch (error) {
        console.error('Error updating achievement progress:', error);
        throw error;
    }
};

// Update user stats
export const updateUserStats = async (userId, statsUpdate) => {
    try {
        const userStatsRef = doc(db, 'users', userId);

        await setDoc(userStatsRef, {
            stats: statsUpdate,
        }, {merge: true});

    } catch (error) {
        console.error('Error updating user stats:', error);
        throw error;
    }
};

// Get badge data for BadgeScreen
export const getBadgeScreenData = async (userId) => {
    try {
        const [allAchievements, userAchievements] = await Promise.all([
            getAllAchievements(),
            getUserAchievements(userId)
        ]);

        return {
            allBadges: allAchievements,
            userEarnedBadges: userAchievements.filter(achievement => achievement.is_completed),
            userProgress: userAchievements.reduce((acc, achievement) => {
                acc[achievement.achievement_id] = achievement.progress || 0;
                return acc;
            }, {})
        };
    } catch (error) {
        console.error('Error fetching badge screen data:', error);
        throw error;
    }
};

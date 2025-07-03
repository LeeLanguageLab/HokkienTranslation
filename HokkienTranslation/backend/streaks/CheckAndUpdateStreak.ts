import {doc, runTransaction, serverTimestamp, Timestamp} from 'firebase/firestore';
import {db, auth} from '../database/Firebase';
import {updateUserPoints} from "../database/LeitnerSystemHelpers";


// Define return type for the function
interface StreakResult {
    streakCount?: number;
    maxStreak?: number;
    isNewStreak?: boolean;
    error?: string;
}

const checkAndUpdateStreak = async (): Promise<StreakResult> => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            return {error: "No authenticated user"};
        }

        const userRef = doc(db, 'userStreak', userId);

        return await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);

            // Initialize streak values
            let streakCount = 1;
            let maxStreak = 1;
            let isNewStreak = true;

            if (!userDoc.exists()) {
                // Document doesn't exist, create it with initial streak values
                transaction.set(userRef, {
                    streakCount,
                    maxStreak,
                    lastActive: serverTimestamp(),
                    createdAt: serverTimestamp()
                }, {merge: true});

                console.log("Creating new user document with streak data");
                return {streakCount, maxStreak, isNewStreak};
            }

            // If document exists, process streak logic
            const userData = userDoc.data();
            console.log("User Data:", userData);
            const currentTime = new Date();

            // Get lastActive from existing document
            let lastActive: Date | null = null;
            console.log("User lastActive:", userData.lastActive);

            if (userData.lastActive) {
                // Handle both string and Timestamp types
                if (typeof userData.lastActive === 'string') {
                    lastActive = new Date(userData.lastActive);
                } else {
                    lastActive = userData.lastActive.toDate();
                }
            }

            // Get existing streak data or initialize if not present
            streakCount = userData.streakCount || 0;
            maxStreak = userData.maxStreak || 0;
            isNewStreak = false;

            console.log("Last Active Value:", lastActive);
            if (lastActive) {
                // Calculate time difference in minutes (for testing)
                // const diffInMinutes: number = (currentTime.getTime() - lastActive.getTime()) / (1000 * 60);
                // console.log(`Time difference in minutes: ${diffInMinutes}`);
                //     const diffInDays: number = (currentTime.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
                //
                //     if (diffInMinutes >= 1 && diffInMinutes < 20) {
                //         streakCount += 1;
                //         isNewStreak = true;
                //
                //         if (streakCount > maxStreak) {
                //             maxStreak = streakCount;
                //         }
                //     } else if (diffInMinutes >= 20) {
                //         streakCount = 1;
                //         isNewStreak = true;
                //     }
                // } else {
                //     streakCount = 1;
                //     isNewStreak = true;
                //     maxStreak = 1;
                // }

                const currentDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
                const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

                // Calculate difference using UTC to avoid timezone issues
                const currentUTC = Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                const lastActiveUTC = Date.UTC(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());

                const diffInDays = Math.round((currentUTC - lastActiveUTC) / (1000 * 60 * 60 * 24));
                console.log(`Time difference in days: ${diffInDays}`);

                if (diffInDays === 0) {
                    // Same day - no streak update needed
                    isNewStreak = false;
                } else if (diffInDays === 1) {
                    // Consecutive day - increment streak
                    streakCount += 1;
                    isNewStreak = true;
                    const userEmail = auth.currentUser?.email;
                    await updateUserPoints(userEmail, 1)
                    if (streakCount > maxStreak) {
                        maxStreak = streakCount;
                    }
                } else if (diffInDays > 1) {
                    // Gap in days - reset streak
                    streakCount = 1;
                    isNewStreak = true;
                } else {
                    streakCount = 1;
                    isNewStreak = true;
                    maxStreak = 1;
                }

                transaction.update(userRef, {
                    streakCount,
                    maxStreak,
                    lastActive: serverTimestamp()
                });

                console.log("Streak updated successfully:", {streakCount, maxStreak, isNewStreak});
                return {streakCount, maxStreak, isNewStreak};
            }
        })
    }
    catch(error)
        {
            console.error("Error in streak transaction:", error instanceof Error ? error.message : String(error));
            return {error: String(error)};
        }
    }
    ;

    export {checkAndUpdateStreak};

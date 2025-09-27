import {doc, runTransaction, serverTimestamp, getDoc} from 'firebase/firestore';
import {db, auth} from '../database/Firebase';
import {updateUserPoints} from "../database/LeitnerSystemHelpers";

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

            const userRef = doc(db, 'userStats', userId);
            const userDocSnap = await getDoc(userRef);

            let streakCount = 1;
            let maxStreak = 1;
            let isNewStreak = true;

            const currentTime = new Date();

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log("User Data:", userData);

                let lastActive: Date | null = null;
                if (userData.lastActive) {
                    if (typeof userData.lastActive === 'string') {
                        lastActive = new Date(userData.lastActive);
                    } else if (userData.lastActive.toDate) {
                        lastActive = userData.lastActive.toDate();
                    }
                }

                streakCount = userData.streakCount || 1;
                maxStreak = userData.maxStreak || 1;


                if (lastActive) {

                    // Use this function for testing purposes
                    //     const diffInMinutes = (currentTime.getTime() - lastActive.getTime()) / (1000 * 60);
                    //     console.log(`Time difference in minutes: ${diffInMinutes}`);
                    //
                    //     if (diffInMinutes >= 0.1 && diffInMinutes < 20) {
                    //         streakCount += 1;
                    //         isNewStreak = true;
                    //         if (streakCount > maxStreak) {
                    //             maxStreak = streakCount;
                    //         }
                    //     } else if (diffInMinutes >= 20) {
                    //         streakCount = 1;
                    //         isNewStreak = true;
                    //     } else {
                    //         // Same session/day, no streak update
                    //         isNewStreak = false;
                    //     }

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
                } else {
                    // No lastActive — first activity
                    streakCount = 1;
                    maxStreak = 1;
                    isNewStreak = true;
                }


            } else {
                // New User
                console.log("Creating new user document with streak data");
            }


            await runTransaction(db, async (transaction) => {
                transaction.set(userRef, {
                    streakCount,
                    maxStreak,
                    lastActive: serverTimestamp(),
                    createdAt: serverTimestamp()  // Only sets if not existing
                }, {merge: true});
            });

            console.log("Streak updated successfully:", {streakCount, maxStreak, isNewStreak});
            return {streakCount, maxStreak, isNewStreak};
            // }
        } catch
            (error) {
            console.error("Error in streak transaction:", error instanceof Error ? error.message : String(error));
            return {error: String(error)};
        }
    }
;

export {checkAndUpdateStreak};

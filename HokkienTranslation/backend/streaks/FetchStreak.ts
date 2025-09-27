// import {doc, getDoc, Timestamp} from 'firebase/firestore';
// import {db, auth} from '../database/Firebase';
//
// // Define interfaces for your Firestore data structure
// interface UserDocument {
//     createdAt?: Timestamp;
//     lastActive?: Timestamp;
//     streakCount?: number;
//     maxStreak?: number;
// }
//
// // Define return type for the function
// interface StreakData {
//     streakCount: number;
//     maxStreak: number;
//     lastActive?: Date | null;
//     error?: string;
// }
//
// const fetchStreak = async (): Promise<StreakData> => {
//     try {
//         const userId = auth.currentUser?.uid;
//         if (!userId) {
//             return {
//                 streakCount: 0,
//                 maxStreak: 0,
//                 error: "No authenticated user"
//             };
//         }
//
//         const userRef = doc(db, 'userStreak', userId);
//         const userSnap = await getDoc(userRef);
//
//         if (!userSnap.exists()) {
//             console.log("User streak document doesn't exist");
//             return {
//                 streakCount: 0,
//                 maxStreak: 0,
//                 lastActive: null
//             };
//         }
//
//         const userData = userSnap.data() as UserDocument;
//
//         // Get lastActive from existing document
//         let lastActive: Date | null = null;
//         if (userData.lastActive) {
//             // Handle both string and Timestamp types
//             if (typeof userData.lastActive === 'string') {
//                 lastActive = new Date(userData.lastActive);
//             } else {
//                 lastActive = userData.lastActive.toDate();
//             }
//         }
//
//         return {
//             streakCount: userData.streakCount || 0,
//             maxStreak: userData.maxStreak || 0,
//             lastActive
//         };
//     } catch (error) {
//         console.error("Error fetching streak:", error instanceof Error ? error.message : String(error));
//         return {
//             streakCount: 0,
//             maxStreak: 0,
//             error: String(error)
//         };
//     }
// };
//
// export {fetchStreak};

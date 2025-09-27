import {useState, useRef, useEffect} from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {Platform} from "react-native";
import {navigate} from "../../screens/Navigation/RootNavigation";
import {db, auth} from "../database/Firebase"
import {doc, updateDoc, serverTimestamp, setDoc,} from 'firebase/firestore';
import {getRandomFlashcard} from "./GetRandomFlashcard";


interface FlashcardData {
    origin: string;
    destination: string;
    options: string[];
    selectedIndex: number;
    correctAnswerIndex: number;
    flashcardId: string;
    contextSentence?: string;
}

export interface LocalNotificationState {
    notification?: Notifications.Notification;
    isCorrectAnswer?: boolean;
    flashcardData?: FlashcardData;
    scheduleFlashcardQuiz: (flashcardId?: string, delaySeconds?: number) => Promise<string>;
    scheduleInactivityReminder: (inactivitySeconds?: number) => void;
    cancelScheduledNotification: (notificationId: string) => Promise<void>;
}

export const useLocalNotifications = (): LocalNotificationState => {
    // Configure notification handler
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldShowAlert: true,
            shouldSetBadge: false,
        })
    });

    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | undefined>();
    const [flashcardData, setFlashcardData] = useState<FlashcardData | undefined>();
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();
    const inactivityTimerRef = useRef(null);
    const scheduledNotificationsRef = useRef<string[]>([]);

    // Request notification permissions
    useEffect(() => {
        const requestPermissions = async () => {
            if (Device.isDevice) {
                const {status: existingStatus} = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== "granted") {
                    const {status} = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== "granted") {
                    alert("Failed to get permission for notifications!");
                    return false;
                }

                // Set up notification channel for Android
                if (Platform.OS === 'android') {
                    await Notifications.setNotificationChannelAsync('flashcard-quiz', {
                        name: 'Flashcard Quiz',
                        importance: Notifications.AndroidImportance.MAX,
                        vibrationPattern: [0, 250, 250, 250],
                        lightColor: '#FF231F7C',
                    });
                }

                return true;
            }
            return false;
        };

        requestPermissions();
    }, []);

    // Set up notification listeners
    useEffect(() => {
        // Listen for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
            console.log("Notification received:", notification);
            setNotification(notification);
            const data = notification.request.content.data;

            // If this is a flashcard notification with options, set up a category
            if (data.options && Array.isArray(data.options)) {
                console.log("Category should already be set up with options:", data.options);

                // Set up the category with the dynamic options

            }
        });

        // Listen for user interaction with notifications
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("User responded to notification:", response);

            // Extract data from the notification response
            const {actionIdentifier} = response;
            const data = response.notification.request.content.data;

            // Check if this is a flashcard quiz notification
            if (data.correctAnswerIndex !== undefined && data.options) {
                // Get the selected option index based on the action button pressed
                let selectedIndex;
                if (actionIdentifier === 'option_1') selectedIndex = 0;
                else if (actionIdentifier === 'option_2') selectedIndex = 1;
                else if (actionIdentifier === 'option_3') selectedIndex = 2;
                else selectedIndex = -1; // Default action (e.g., tapping the notification)

                // Check if the selected option is correct
                const isCorrect = selectedIndex === data.correctAnswerIndex;

                // Store the result and flashcard data for the component to use
                setIsCorrectAnswer(isCorrect);
                setFlashcardData({
                    origin: data.origin,
                    destination: data.destination,
                    options: data.options,
                    selectedIndex,
                    correctAnswerIndex: data.correctAnswerIndex,
                    flashcardId: data.flashcardId,
                    contextSentence: data.contextSentence
                });

                // Navigate to feedback screen
                navigate('FlashcardFeedback', {
                    isCorrect,
                    origin: data.origin,
                    destination: data.destination,
                    contextSentence: data.contextSentence
                });
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
            clearTimeout(inactivityTimerRef.current);
        };
    }, []);

    // Function to schedule a flashcard quiz notification
    const scheduleFlashcardQuiz = async (flashcardId?: string, delaySeconds = 1) => {
        try {
            const flashcard = await getRandomFlashcard(flashcardId);
            if (!flashcard) {
                console.error("Failed to get flashcard");
                return "";
            }

            // Combine destination with otherOptions and shuffle
            const allOptions = [flashcard.destination, flashcard.otherOptions[0], flashcard.otherOptions[1]]
                .sort(() => Math.random() - 0.5);

            // Track the position of the correct answer
            const correctAnswerIndex = allOptions.indexOf(flashcard.destination);

            // Create a unique category ID for this flashcard
            const categoryId = `flashcard_quiz_${flashcard.id}`;

            // Set up the category with the dynamic options BEFORE scheduling
            console.log("Setting up notification category with options:", allOptions);
            await Notifications.setNotificationCategoryAsync(categoryId, [
                {
                    identifier: 'option_1',
                    buttonTitle: allOptions[0],
                    options: {
                        isDestructive: false,
                        isAuthenticationRequired: false,
                    }
                },
                {
                    identifier: 'option_2',
                    buttonTitle: allOptions[1],
                    options: {
                        isDestructive: false,
                        isAuthenticationRequired: false,
                    }
                },
                {
                    identifier: 'option_3',
                    buttonTitle: allOptions[2],
                    options: {
                        isDestructive: false,
                        isAuthenticationRequired: false,
                    }
                }
            ]);

            // Schedule the notification with the specific categoryIdentifier
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Flashcard Quiz",
                    body: `What does "${flashcard.origin}" mean?`,
                    data: {
                        flashcardId: flashcard.id,
                        correctAnswerIndex,
                        options: allOptions,
                        origin: flashcard.origin,
                        destination: flashcard.destination,
                        contextSentence: flashcard.contextSentence,
                    },
                    categoryIdentifier: categoryId, // Use the same categoryId we just set up
                },
                trigger: {
                    seconds: delaySeconds,
                },
            });

            console.log(`Scheduled notification: ${notificationId}`);
            scheduledNotificationsRef.current.push(notificationId);
            return notificationId;
        } catch (error) {
            console.error("Error scheduling notification:", error);
            return "";
        }
    };

    // Function to cancel a scheduled notification
    const cancelScheduledNotification = async (notificationId: string) => {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            scheduledNotificationsRef.current = scheduledNotificationsRef.current.filter(
                id => id !== notificationId
            );
            console.log(`Cancelled notification: ${notificationId}`);
        } catch (error) {
            console.error("Error cancelling notification:", error);
        }
    };

    // Function to set up inactivity detection and schedule a notification
    const scheduleInactivityReminder = (inactivitySeconds = 60) => {
        // Clear any existing inactivity timer
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }

        // Set up a new inactivity timer
        inactivityTimerRef.current = setTimeout(async () => {
            console.log(`User inactive for ${inactivitySeconds} seconds, scheduling notification`);
            await scheduleFlashcardQuiz();
        }, inactivitySeconds * 1000);

        // Update user's last active timestamp in Firestore
        const updateUserActivity = async () => {
            try {
                const userId = auth.currentUser?.uid;
                if (userId) {
                    const userDocRef = doc(db, "userTokens", userId);
                    await setDoc(userDocRef, {
                        lastActive: serverTimestamp(),
                    }, {merge: true});
                }
            } catch (error) {
                console.error("Error updating user activity:", error);
            }
        };

        updateUserActivity();
    };

    // TODO Maybe add something to clean up notification categories

    return {
        notification,
        isCorrectAnswer,
        flashcardData,
        scheduleFlashcardQuiz,
        scheduleInactivityReminder,
        cancelScheduledNotification,
    };
};

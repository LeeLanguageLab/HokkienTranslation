import {useState, useRef, useEffect} from "react";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {navigate} from "../../screens/Navigation/RootNavigation";

interface FlashcardData {
    origin: string;
    destination: string;
    options: string[];
    selectedIndex: number;
    correctAnswerIndex: number;
    flashcardId: string;
}

export interface PushNotificationState {
    notification?: Notifications.Notification;
    expoPushToken?: Notifications.ExpoPushToken;
    isCorrectAnswer?: boolean;
    flashcardData?: any;
}

export const usePushNotifications = (): PushNotificationState => {
    Notifications.setNotificationHandler({
        handleNotification: async () => (
            {
                shouldPlaySound: false,
                shouldShowAlert: true,
                shouldSetBadge: false,
            })
    })

    const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | undefined>();
    const [flashcardData, setFlashcardData] = useState<FlashcardData | undefined>();

    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    async function registerForPushNotificationsAsync() {
        console.log("Starting push notification registration");
        let token;

        if (Device.isDevice) {
            console.log("Running on physical device");
            const {status: existingStatus} = await Notifications.getPermissionsAsync();
            console.log("Existing permission status:", existingStatus);

            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                console.log("Requesting permissions...");
                const {status} = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log("New permission status:", finalStatus);
            }

            if (finalStatus !== "granted") {
                console.log("Permission denied");
                alert("Failed to get push token for push notification!");
                return undefined;
            }

            console.log("Permissions granted, getting token...");
            console.log("Project ID:", Constants.expoConfig?.extra?.eas?.projectId);

            try {
                token = await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas?.projectId,
                });
                console.log("Token successfully generated:", token);
                return token;
            } catch (error) {
                console.error("Error getting push token:", error);
                return undefined;
            }
        } else {
            console.log("Not a physical device");
            return undefined;
        }
    }


    useEffect(() => {

        // setupFlashcardCategories(flashcardData.options);
        // Promise returned from flashcard categories is ignored but flashcard categories
        // does not return anything?
        console.log("Notification Categories set up in usePushNotifications");

        registerForPushNotificationsAsync().then((token) => {
            setExpoPushToken(token);
        })

        // Listen for incoming notifications
        notificationListener.current = Notifications.addNotificationReceivedListener( async(notification) => {
            console.log("Notification received:", notification);
            setNotification(notification);

            const data = notification.request.content.data;

            // If this is a flashcard notification with options, set up a category
            if (data.options && Array.isArray(data.options)) {
                console.log("Setting up notification category with options:", data.options);
                const categoryId = `flashcard_quiz_${data.flashcardId}`;

                console.log("Setting up notification category and options before invoking it:", categoryId, data.options)

                // Set up the category with the dynamic options
                await Notifications.setNotificationCategoryAsync(categoryId, [
                    {
                        identifier: 'option_1',
                        buttonTitle: data.options[0],
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        }
                    },
                    {
                        identifier: 'option_2',
                        buttonTitle: data.options[1],
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        }
                    },
                    {
                        identifier: 'option_3',
                        buttonTitle: data.options[2],
                        options: {
                            isDestructive: false,
                            isAuthenticationRequired: false,
                        }
                    }
                ]);
            }
        });

        // Listen for user interaction with notifications
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("User responded to notification(foreground):", response);

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
                    flashcardId: data.flashcardId
                });
                // Navigate to feedback screen
                navigate('FlashcardFeedback', {
                    isCorrect,
                    origin: data.origin,
                    destination: data.destination,
                    contextSentence: data.contextSentence
                });

                // Handle the response
                if (isCorrect) {
                    console.log('Correct answer!');
                    // You could call a function here to award points to the user
                } else {
                    console.log('Incorrect answer');
                }
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(
                notificationListener.current!
            )
            Notifications.removeNotificationSubscription(responseListener.current!);
        }
    }, []);

    return {expoPushToken, notification, isCorrectAnswer, flashcardData};
}

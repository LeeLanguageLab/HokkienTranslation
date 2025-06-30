import React, {useCallback, useEffect, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {Ionicons} from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import {Box, HStack, IconButton, Input, ScrollView, Text, VStack,} from "native-base";
import {useTheme} from "./context/ThemeProvider";
import {collection, getDocs} from "firebase/firestore";
import {auth, db} from "../backend/database/Firebase";
import QuickInputWords from "./components/QuickInputWords";
import getCurrentUser from "../backend/database/GetCurrentUser";
import {getUserLevel, getUserPoints} from "../backend/database/LeitnerSystemHelpers.js";
import {useRegisterAndStoreToken} from "../backend/notifications/RegisterAndStoreToken";
import {useLocalNotifications} from "../backend/notifications/useLocalNotifications";
import {checkAndUpdateStreak} from "../backend/streaks/CheckAndUpdateStreak";
import FeedbackButton from "./components/FeedbackButton";
import {LevelProgress} from "./StreaksAndLevelProgress/LevelProgress";
import {StreakDisplay} from "./StreaksAndLevelProgress/StreakDisplay";

export default function HomeScreen({navigation}) {
    const [queryText, setQueryText] = useState("");
    const [randomInputs, setRandomInputs] = useState([]);
    const [userLevel, setUserLevel] = useState(null);
    const [userPoints, setUserPoints] = useState(null);
    const [levelProgress, setLevelProgress] = useState(null);
    const {theme, themes} = useTheme();
    const colors = themes[theme];
    const pointsPerLevel = 100;
    const [userCred, setUserCred] = useState(null);

    const {
        scheduleInactivityReminder,
    } = useLocalNotifications();

    const [streakData, setStreakData] = useState({isNewStreak: false, streakCount: 0});

    useEffect(() => {
        const updateStreak = async () => {
            try {
                const result = await checkAndUpdateStreak();
                setStreakData(result);
                console.log("isNewStreak: ", streakData.isNewStreak);
            } catch (error) {
                console.error("Error updating streak:", error);
            }
        };

        updateStreak();
    }, []);

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            // Create a structure similar to UserCredential
            setUserCred({
                user: currentUser
            });
            console.log("Current user set in HomeScreen:", currentUser.uid);
        }
    }, []);

    // Register push token when user is available
    const token = useRegisterAndStoreToken(userCred);

    // Log when token is successfully registered
    useEffect(() => {
        if (token && userCred) {
            console.log("Token registered in HomeScreen:", token.data);
        }
    }, [token, userCred]);

    useFocusEffect(
        React.useCallback(() => {
            console.log("HomeScreen is focused, setting up inactivity reminder");

            scheduleInactivityReminder(3600); // 1 hour

            return () => {
                console.log("HomeScreen is unfocused, cleaning up");
                // TODO Maybe remove pending notifications
            };
        }, [])
    );

    useEffect(() => {
        return auth.onAuthStateChanged((user) => {
            if (user) {
                // User is authenticated, set up custom header
                navigation.setOptions({
                    headerLeft: () => <StreakDisplay/>,
                    headerTitle: () => <LevelProgress/>,
                    headerRight: () => <FeedbackButton iconOnly={true}/>
                });
            } else {
                // User not authenticated, use simple header
                navigation.setOptions({
                    headerLeft: () => null,
                    headerTitle: () => null,
                    headerRight: () => <FeedbackButton iconOnly={true}/>
                });
            }
        }); // Cleanup subscription
    }, [navigation]);

    const handleTextChange = (text) => {
        // Reset inactivity timer when user types
        scheduleInactivityReminder(3600);
        const cleanedText = text.replace(/\n/, "");
        setQueryText(cleanedText);
    };

    const fetchRandomInputs = async () => {
        try {
            const translationCollection = collection(db, "translation");
            const querySnapshot = await getDocs(translationCollection);
            const inputs = querySnapshot.docs.map((doc) => doc.data().englishInput);
            setRandomInputs(inputs.sort(() => 0.5 - Math.random()).slice(0, 5));
        } catch (error) {
            console.error("Error fetching random inputs: ", error);
        }
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    const fetchUserLevelPointsProgress = async () => {
        const user = await getCurrentUser();
        const userEmail = user;
        const level = await getUserLevel(userEmail, pointsPerLevel);
        const points = await getUserPoints(userEmail);
        console.log("user level: ", userLevel);
        console.log("user points", userPoints);
        setUserLevel(level);
        setUserPoints(points);
        setLevelProgress((points - ((level - 1) * 100)) / 100);
    };

    const fetchUserFlashcardProgress = async () => {
        const user = await getCurrentUser();
        const userEmail = user;
    };

    useEffect(() => {
        fetchRandomInputs();
    }, [])

    useFocusEffect(
        useCallback(() => {
            fetchUserLevelPointsProgress();
        }, [])
    );

    return (
        <ScrollView
            bg={colors.surface}
            flex={1}
            contentContainerStyle={{alignItems: "center"}}
        >
            <VStack space={4} alignItems="center" w="100%" mt={5}>
                {/* Header */}
                <Box
                    w="80%"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                >
                </Box>

                {/* Random Words and Input Box */}
                <Box w="80%">
                    <QuickInputWords
                        label="Try:"
                        words={randomInputs}
                        onWordPress={setQueryText}
                    />
                    {/* Input */}
                    <Box position="relative" mt={3}>
                        <Input
                            variant="outline"
                            placeholder="Type English or Chinese..."
                            onChangeText={handleTextChange}
                            value={queryText}
                            multiline={true}
                            h={40}
                            paddingX={1}
                            paddingY={2}
                            style={{
                                fontSize: 20,
                                color: colors.onSurface,
                            }}
                        />
                        {queryText.length > 0 && (
                            <IconButton
                                icon={
                                    <Ionicons
                                        name="close-outline"
                                        size={30}
                                        color={colors.onSurfaceVariant}
                                    />
                                }
                                position="absolute"
                                top={0}
                                right={0}
                                _hover={{bg: "transparent"}}
                                _pressed={{bg: "transparent"}}
                                onPress={() => setQueryText("")}
                            />
                        )}
                    </Box>
                </Box>

                {/* Submit Button */}
                {queryText.length > 0 && (
                    <Box w="80%" flexDirection="row" justifyContent="flex-end">
                        <IconButton
                            icon={
                                <Ionicons
                                    name="checkbox"
                                    size={40}
                                    color={colors.onPrimaryContainer}
                                />
                            }
                            onPress={() =>
                                navigation.navigate("Result", {query: queryText})
                            }
                            _hover={{bg: "transparent"}}
                            _pressed={{bg: "transparent"}}
                        />
                    </Box>
                )}
            </VStack>
        </ScrollView>
    );
}

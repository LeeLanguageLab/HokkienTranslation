import React, {useState, useEffect, useCallback} from "react";
import {useFocusEffect, useNavigation} from "@react-navigation/native";
import {Pressable, ScrollView} from "react-native";
import {Switch, HStack, VStack, Text, Button, Box} from "native-base";
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "./context/ThemeProvider";
import {useLanguage} from "./context/LanguageProvider";
import {useComponentVisibility} from "./context/ComponentVisibilityContext";
import SignOut from "./components/Signout"; // Adjust the path if necessary
import {SelectList} from "react-native-dropdown-select-list";
import {
    countBox1Flashcards,
    countBox2Flashcards,
    countBox3Flashcards
} from "../backend/database/LeitnerSystemHelpers.js";
import getCurrentUser from "../backend/database/GetCurrentUser";
import {count} from "firebase/firestore";
import {useBreakpointValue} from "native-base";
import getCurrentUserActual from "../backend/database/GetCurrentUserActual";

const AnalyticsScreen = () => {
    const {theme, toggleTheme, themes} = useTheme();
    const colors = themes[theme];
    const {
        visibilityStates,
        toggleVisibility,
        flashcardVisibilityStates,
        toggleFlashcardVisibility
    } = useComponentVisibility();
    const {languages, setLanguages, toggleLanguages} = useLanguage();
    const navigation = useNavigation();
    const [errorMessage, setErrorMessage] = useState("");
    const [box1Flashcards, setBox1Flashcards] = useState(null);
    const [box2Flashcards, setBox2Flashcards] = useState(null);
    const [box3Flashcards, setBox3Flashcards] = useState(null);
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {

        async function fetchCurrentUser() {
            return await getCurrentUserActual();
        }

        setCurrentUser(fetchCurrentUser());
    }, [])

    const fetchBoxesFlashcards = async () => {
        try {
            const user = await getCurrentUser();
            const userEmail = user;
            const box1 = await countBox1Flashcards(userEmail);
            const box2 = await countBox2Flashcards(userEmail);
            const box3 = await countBox3Flashcards(userEmail);
            setBox1Flashcards(box1);
            setBox2Flashcards(box2);
            setBox3Flashcards(box3);
        } catch (error) {
            console.log("error fetching boxes flashcards: ", error);
        }
    };

    useEffect(() => {
        if (languages[0] === languages[1]) {
            setErrorMessage("The selected languages must be different.");
        } else {
            setErrorMessage("");
        }
    }, [languages]);

    useFocusEffect(
        useCallback(() => {
            fetchBoxesFlashcards();
        }, [])
    );



    return (
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <VStack
                style={{
                    flex: 1,
                    width: "100%",
                    minWidth: 300,
                    alignItems: "flex-start",
                    backgroundColor: colors.surface,
                    padding: 20,
                }}
            >

                {/* Badges Navigation Header */}
                <Pressable
                    onPress={() => {
                        if (currentUser) {
                            navigation.navigate('BadgeScreen', {userId: currentUser.uid})
                        } else {
                            console.warn("User not loaded yet")
                        }
                    }}

                    style={{
                        width: '90%',
                        backgroundColor: colors.primaryContainer,
                        paddingVertical: 16,
                        paddingHorizontal: 20,
                        marginBottom: 20,
                        alignSelf: "center"
                    }}
                >
                    <HStack alignItems="center" justifyContent="space-between" space={3}>
                        <HStack alignItems="center" space={3}>
                            <Ionicons
                                name="medal"
                                size={24}
                                color={colors.onPrimaryContainer}
                            />
                            <VStack>
                                <Text
                                    fontSize="lg"
                                    fontWeight="semibold"
                                    color={colors.onPrimaryContainer}
                                >
                                    View Your Badges
                                </Text>
                                <Text
                                    fontSize="sm"
                                    color={colors.onPrimaryContainer}
                                    opacity={0.8}
                                >
                                    Check your achievements and progress
                                </Text>
                            </VStack>
                        </HStack>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.onPrimaryContainer}
                        />
                    </HStack>
                </Pressable>


                <Pressable
                    onPress={() => {

                        navigation.navigate('Leaderboard')

                    }}

                    style={{
                        width: '90%',
                        backgroundColor: colors.primaryContainer,
                        paddingVertical: 16,
                        paddingHorizontal: 20,
                        marginBottom: 20,
                        alignSelf: "center"
                    }}
                >
                    <HStack alignItems="center" justifyContent="space-between" space={3}>
                        <HStack alignItems="center" space={3}>
                            <Ionicons
                                name="trophy"
                                size={24}
                                color={colors.onPrimaryContainer}
                            />
                            <VStack>
                                <Text
                                    fontSize="lg"
                                    fontWeight="semibold"
                                    color={colors.onPrimaryContainer}
                                >
                                    Leaderboard
                                </Text>
                                <Text
                                    fontSize="sm"
                                    color={colors.onPrimaryContainer}
                                    opacity={0.8}
                                >
                                    Compare your score with others
                                </Text>
                            </VStack>
                        </HStack>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.onPrimaryContainer}
                        />
                    </HStack>
                </Pressable>

                {/* Leitner Box Flashcards Info */}
                <VStack space={2} w="90%" alignSelf="center" mb={4} p={3} bg={colors.primaryContainer}
                        borderRadius="lg">
                    <Text fontSize="lg" fontWeight="bold" color={colors.onSurface}>Your Flashcard Learning
                        Progress</Text>

                    <Pressable onPress={() => navigation.navigate("FlashcardBox", {boxNum: 1})}>
                        <Text fontSize="lg" color={colors.onSurface}> Box 1
                            (Unfamiliar): {box1Flashcards ?? "Loading..."}</Text>
                    </Pressable>

                    <Pressable onPress={() => navigation.navigate("FlashcardBox", {boxNum: 2})}>
                        <Text fontSize="lg" color={colors.onSurface}> Box 2
                            (Familiar): {box2Flashcards ?? "Loading..."}</Text>
                    </Pressable>

                    <Pressable onPress={() => navigation.navigate("FlashcardBox", {boxNum: 3})}>
                        <Text fontSize="lg" color={colors.onSurface}> Box 3
                            (Mastered): {box3Flashcards ?? "Loading..."}</Text>
                    </Pressable>
                </VStack>

            </VStack>
        </ScrollView>
    );
};

export default AnalyticsScreen;

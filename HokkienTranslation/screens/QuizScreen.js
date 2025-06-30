import React, {useState, useRef, useEffect} from "react";
import {
    Box,
    Button,
    Center,
    VStack,
    HStack,
    Text,
    Progress,
    ScrollView,
    Select,
} from "native-base";
import {useTheme} from "./context/ThemeProvider";
import {Animated, Easing, TouchableOpacity} from "react-native";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    arrayUnion,
    serverTimestamp,
    where,
    query,
} from "firebase/firestore";
import {Audio} from "expo-av";
import {db} from "../backend/database/Firebase";
import getCurrentUser from "../backend/database/GetCurrentUser";
import {useLanguage} from "./context/LanguageProvider";
import {callOpenAIChat} from "../backend/API/OpenAIChatService";
import {fetchTranslation} from "../backend/API/HokkienTranslationToolService";
import {fetchNumericTones, fetchAudioUrl} from "../backend/API/TextToSpeechService";
import TextToSpeech from "./components/TextToSpeech";
import {fetchRomanizer} from "../backend/API/HokkienHanziRomanizerService";
import {getStoredHokkienFlashcard} from "../backend/database/DatabaseUtils.js";
import {
    countPointsByFlashcard,
    updateLeitnerBox,
    appendToLearnedDecks,
    updateUserPoints,
    isFirstTimeQuiz
} from "../backend/database/LeitnerSystemHelpers.js";

const QuizScreen = ({route}) => {
    const {theme, themes} = useTheme();
    const colors = themes[theme];
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [isDisabled, setIsDisabled] = useState(false);
    const [flashcards, setFlashcards] = useState([]);
    const [flashcardScores, setFlashcardScores] = useState({});
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [userScores, setUserScores] = useState([]);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const {languages} = useLanguage();
    const [lang1, setLang1] = useState(languages[0]); // choices
    const [lang2, setLang2] = useState(languages[1]); // question
    const [quizStarted, setQuizStarted] = useState(false);
    const [answerWith, setAnswerWith] = useState(lang1);
    const [choiceIndex, setChoice] = useState(null);
    const [hokkienOption, setHokkienOption] = useState("Romanization");
    const [optionType, setOptionType] = useState("English");
    const [beFirstTimeQuiz, setBeFirstTimeQuiz] = useState(false);
    const [totalPoints, setTotalPoints] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);

    const flashcardListName = route.params.flashcardListName;
    console.log("QuizScreen: flashcardListName", flashcardListName);

    const translateText = async (text, language) => {
        try {
            const response = await callOpenAIChat(
                `Translate ${text} to ${language}. You must respond with only the translation.`
            );
            console.log("OpenAI Response:", response);
            return response;
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage("Error with translation. Please try again later.");
            return "Error with translation.";
        }
    };

    const handleAnswerWithChange = (value) => {
        if (value === lang2) {
            setLang1(lang2);
            setLang2(lang1);
        } else {
            setLang1(lang1);
            setLang2(lang2);
        }
        setAnswerWith(value);
    };

    const handleStartQuiz = () => {
        setQuizStarted(true);
    }

    useEffect(() => {
        const fetchFlashcards = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, "flashcardList"));
                let flashcardListDoc;

                querySnapshot.forEach((doc) => {
                    if (doc.data().name === flashcardListName) {
                        flashcardListDoc = doc;
                    }
                });

                if (!flashcardListDoc) {
                    console.error("No flashcard list found with the given name");
                    setLoading(false);
                    return;
                }

                const user = await getCurrentUser();
                const userEmail = user;
                const firstTime = await isFirstTimeQuiz(userEmail, flashcardListName);
                console.log("First time quiz: ", firstTime);
                setBeFirstTimeQuiz(firstTime);
                const flashcardListData = flashcardListDoc.data();
                const flashcardIds = flashcardListData.cardList;
                let flashcards = [];

                for (const flashcardId of flashcardIds) {
                    const flashcardDocRef = doc(db, "flashcard", flashcardId);
                    const flashcardDoc = await getDoc(flashcardDocRef);

                    if (flashcardDoc.exists()) {
                        const data = flashcardDoc.data();

                        let translation = data.origin; // question (Hokkien)
                        let word = data.destination; // answer (English)

                        // const [lang1, lang2] = languages; // replaced by answer with selection
                        // question (translation) is lang2, answer (word) / choices is lang1

                        if (lang1 === "Hokkien") {
                            word = data.origin;
                            if (hokkienOption === "Romanization") {
                                try {
                                    const flashcard = await getStoredHokkienFlashcard(word, "Hokkien");
                                    if (flashcard) {
                                        word = flashcard.romanization;
                                    } else {
                                        word = await fetchRomanizer(word);
                                    }
                                } catch (error) {
                                    word = "Error with romanization.";
                                    console.error(error);
                                }
                            }
                        }
                        if (lang2 === "English") {
                            translation = data.destination;
                        }

                        if (lang1 !== "English" && lang1 !== "Hokkien") {
                            word = await translateText(data.destination, lang1);
                        }
                        if (lang2 !== "English" && lang2 !== "Hokkien") {
                            translation = await translateText(data.destination, lang2);
                        }

                        const translatedOptions = await Promise.all(
                            data.otherOptions.map(async (option) => {
                                if (lang1 === "Hokkien") {
                                    setOptionType("Hokkien");
                                    let display;
                                    const flashcard = await getStoredHokkienFlashcard(option, "English");
                                    if (flashcard) {
                                        display = flashcard.origin;
                                        if (hokkienOption === "Romanization") {
                                            setOptionType("Romanization");
                                            display = flashcard.romanization;
                                        }
                                    } else {
                                        display = await fetchTranslation(option);
                                        if (hokkienOption === "Romanization") {
                                            setOptionType("Romanization");
                                            display = await fetchRomanizer(display);
                                        }
                                    }
                                    return display;
                                }
                                if (lang1 !== "English" && lang1 !== "Hokkien") {
                                    return await translateText(option, lang1);
                                }
                                return option;
                            })
                        );

                        const choices = shuffleArray([word, ...translatedOptions]);

                        flashcards.push({
                            id: flashcardDoc.id,
                            origin: translation,
                            destination: word,
                            choices: choices,
                        });
                    }
                }

                flashcards = shuffleArray(flashcards);

                setFlashcards(flashcards);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching flashcards: ", error);
                setErrorMessage("Error fetching flashcards. Please try again later.");
                setLoading(false);
            }
        };

        fetchFlashcards();
    }, [flashcardListName, quizStarted]);

    const shuffleArray = (array) => {
        return array.sort(() => Math.random() - 0.5);
    };

    const handleChoice = async (index) => {
        setChoice(index);
        if (lang1 === "Hokkien") {
            try {
                const option = flashcards[currentCardIndex].choices[index];
                const flashcard = await getStoredHokkienFlashcard(option, optionType);
                let audioUrl;
                if (flashcard) {
                    audioUrl = flashcard.audioUrl;
                } else {
                    const numeric_tones = await fetchNumericTones(option);
                    audioUrl = await fetchAudioUrl(numeric_tones);
                }
                if (audioUrl) {
                    const {sound} = await Audio.Sound.createAsync({uri: audioUrl});
                    await sound.playAsync();
                }
            } catch (error) {
                console.error("Error fetching audio URL:", error);
                setErrorMessage("Error fetching audio URL. Please try again later.");
            }
        }
    };

    const handleSubmit = async (index) => {
        setSelectedAnswer(index);
        setIsDisabled(true);

        const user = await getCurrentUser();
        const userEmail = user;

        const isCorrect =
            flashcards[currentCardIndex].choices[index] ===
            flashcards[currentCardIndex].destination;

        if (isCorrect) {
            setScore((prevScore) => prevScore + 1);
            var addPoints = await countPointsByFlashcard(userEmail, flashcards[currentCardIndex].id, true);
            const updatedTotalPoints = totalPoints + addPoints;
            console.log("Updated totalPoints (expected):", updatedTotalPoints);
            setTotalPoints(updatedTotalPoints);
            await updateLeitnerBox(userEmail, flashcards[currentCardIndex].id, true);

        } else {
            await updateLeitnerBox(userEmail, flashcards[currentCardIndex].id, false);
        }

        setFlashcardScores({
            ...flashcardScores,
            [flashcards[currentCardIndex].id]: isCorrect ? 1 : 0,
        });

        if (currentCardIndex === flashcards.length - 1) {
            const finalPoints = totalPoints + addPoints;
            console.log("Quiz ended. Final points before firebase update: ", finalPoints);
            // Last flashcard, update quiz scores and show history
            try {
                const user = await getCurrentUser();
                const userEmail = user;
                console.log("user: ", user);

                // Query for the flashcardQuiz document where flashcardListId equals flashcardListName
                console.log(
                    "QuizScreen before getDocs flashcardListName: ",
                    flashcardListName
                );
                const quizQuery = query(
                    collection(db, "flashcardQuiz"),
                    where("flashcardListId", "==", flashcardListName)
                );

                if (finalPoints) {
                    await updateUserPoints(userEmail, finalPoints);
                }
                if (beFirstTimeQuiz) {
                    await updateUserPoints(userEmail, 30);
                    await appendToLearnedDecks(userEmail, flashcardListName);
                };

                const quizQuerySnapshot = await getDocs(quizQuery);
                const scores = quizQuerySnapshot.docs[0].data().scores[userEmail];
                setUserScores(scores);
                console.log("scores: ", scores);
                console.log("userScores: ", userScores);

                if (!quizQuerySnapshot.empty) {
                    // Assuming only one document matches the query
                    const quizDocRef = quizQuerySnapshot.docs[0].ref;
                    console.log("quizDocRef: ", quizDocRef);

                    // Generate the server timestamp first
                    const timestamp = new Date().toISOString();

                    console.log("timestamp: ", timestamp);
                    console.log(
                        "totalScore: ",
                        (score + (isCorrect ? 1 : 0)) / flashcards.length
                    );
                    console.log("flashcardScores: ", {
                        ...flashcardScores,
                        [flashcards[currentCardIndex].id]: isCorrect ? 1 : 0,
                    });

                    // Fetch existing data
                    const quizDoc = await getDoc(quizDocRef);
                    let existingScores = {};

                    if (quizDoc.exists()) {
                        existingScores = quizDoc.data().scores || {};
                        // Prepare new score entry
                        const newScoreEntry = {
                            time: timestamp,
                            totalScore: (score + (isCorrect ? 1 : 0)) / flashcards.length,
                            flashcardScores: {
                                ...flashcardScores,
                                [flashcards[currentCardIndex].id]: isCorrect ? 1 : 0,
                            },
                        };

                        // Append or create a new entry for the user
                        if (existingScores[userEmail]) {
                            existingScores[userEmail].push(newScoreEntry);
                        } else {
                            existingScores[userEmail] = [newScoreEntry];
                        }

                        // Update the document
                        await updateDoc(quizDocRef, {
                            scores: existingScores,
                        });
                        setUserScores(existingScores[userEmail]);
                    } else {
                        // If the document does not exist, create it
                        const newScoreDoc = {
                            [userEmail]: [
                                {
                                    time: timestamp,
                                    totalScore:
                                        (score + (isCorrect ? 1 : 0)) / flashcards.length,
                                    flashcardScores: {
                                        ...flashcardScores,
                                        [flashcards[currentCardIndex].id]: isCorrect ? 1 : 0,
                                    },
                                },
                            ],
                        };

                        await setDoc(quizDocRef, {
                            scores: newScoreDoc
                        });
                        setUserScores(newScoreDoc[userEmail]);
                    }
                } else {
                    console.error(
                        "No flashcardQuiz document found with the given flashcardListName."
                    );
                }
                showScoreHistory(userEmail, flashcardListName);
            } catch (error) {
                console.error("Error updating quiz scores: ", error);
                setErrorMessage("Error updating quiz scores. Please try again later.");
            }
        } else {
            setTimeout(() => {
                slideOut();
                setTimeout(() => {
                    setSelectedAnswer(null);
                    setIsDisabled(false);
                    setCurrentCardIndex((prevIndex) => prevIndex + 1);
                    slideIn();
                }, 300);
            }, 1000);
        }
        setChoice(null);
    };

    const showScoreHistory = async (user, flashcardListName) => {
        try {
            setShowHistory(true);
        } catch (error) {
            console.error("Error fetching score history: ", error);
            setErrorMessage("Error fetching score history. Please try again later.");
        }
    };

    const showFlashcardScores = (flashcardScores) => {
        return (
            <VStack space={4} alignItems="center">
                {Object.entries(flashcardScores).map(([flashcardId, score]) => (
                    <Text key={flashcardId}>{`Flashcard ${flashcardId}: ${score ? "Correct" : "Incorrect"
                    }`}</Text>
                ))}
            </VStack>
        );
    };

    const formatTimeDifference = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} days ago`;
    };

    const slideOut = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -20,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.linear,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.linear,
            }),
        ]).start();
    };

    const slideIn = () => {
        slideAnim.setValue(20);
        opacityAnim.setValue(0);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.linear,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
                easing: Easing.linear,
            }),
        ]).start();
    };

    const getButtonStyle = (index) => {
        const correctAnswer = flashcards[currentCardIndex].destination;
        const choice = flashcards[currentCardIndex].choices[index];

        if (selectedAnswer === null) {
            return index === choiceIndex
                ? {bg: colors.darkerPrimaryContainer, borderColor: colors.buttonBorder}
                : {bg: colors.primaryContainer, borderColor: colors.buttonBorder};
        } else if (choice === correctAnswer) {
            return index === selectedAnswer
                ? {bg: "rgba(39, 201, 36, 0.6)", borderColor: "#27c924"}
                : {bg: "rgba(39, 201, 36, 0.6)", borderColor: "#27c924"};
        } else {
            return index === selectedAnswer
                ? {bg: "rgba(186, 34, 39, 0.6)", borderColor: "#ba2227"}
                : {bg: colors.primaryContainer, borderColor: colors.buttonBorder};
        }
    };

    if (loading) {
        return (
            <Center flex={1} px="3" background={colors.surface}>
                <Text color={colors.onSurface}>Loading...</Text>
            </Center>
        );
    }

    if (!quizStarted) {
        return (
            <Center flex={1} px="3" background={colors.surface}>
                <VStack space={4} alignItems="center">

                    {errorMessage && (
                        <Box
                            backgroundColor="red.100"
                            borderColor="red.500"
                            borderWidth={1}
                            p={3}
                            mb={3}
                            borderRadius="8"
                            w="100%"
                            alignItems="center"
                        >
                            <Text color="red.600" fontWeight="bold">
                                {errorMessage}
                            </Text>
                            <Button
                                mt={2}
                                variant="outline"
                                borderColor="red.500"
                                _text={{color: "red.500"}}
                                onPress={() => setErrorMessage(null)} // Clear error message
                            >
                                Dismiss
                            </Button>
                        </Box>
                    )}

                    <Text
                        style={{
                            fontSize: 24,
                            fontWeight: "bold",
                            color: colors.onSurface,
                        }}>Answer with:
                    </Text>
                    <Select
                        selectedValue={answerWith}
                        minWidth={200}
                        onValueChange={handleAnswerWithChange}
                        accessibilityLabel="Choose Answer Language"
                        placeholder="Choose Answer Language"
                        _selectedItem={{
                            _text: {fontSize: 24},
                        }}
                    >
                        <Select.Item label={lang1} value={lang1}/>
                    </Select>

                    {answerWith === "Hokkien" && (
                        <Select
                            selectedValue={hokkienOption}
                            minWidth={200}
                            onValueChange={(value) => setHokkienOption(value)}
                            accessibilityLabel="Choose Hokkien Answer Type"
                            placeholder="Choose Hokkien Answer Type"
                            _selectedItem={{
                                _text: {fontSize: 24},
                            }}
                        >
                            <Select.Item label="Characters" value="Characters"/>
                            <Select.Item label="Romanization" value="Romanization"/>
                        </Select>
                    )}
                    <Button onPress={handleStartQuiz} color={colors.primaryContainer}>Start Quiz</Button>
                </VStack>
            </Center>
        );
    }

    if (!flashcards.length) {
        return (
            <Center flex={1} px="3" background={colors.surface}>
                <Text color={colors.onSurface}>No flashcards available</Text>
            </Center>
        );
    }

    if (showHistory) {
        return (
            <Center flex={1} px="3" py="2" background={colors.surface}>
                <Box width="100%" height="100%">
                    <ScrollView contentContainerStyle={{paddingBottom: 20}}>
                        <VStack space={4} alignItems="stretch" width="90%" mx="auto">

                            {errorMessage && (
                                <Box
                                    backgroundColor="red.100"
                                    borderColor="red.500"
                                    borderWidth={1}
                                    p={3}
                                    mb={3}
                                    borderRadius="8"
                                    w="100%"
                                    alignItems="center"
                                >
                                    <Text color="red.600" fontWeight="bold">
                                        {errorMessage}
                                    </Text>
                                    <Button
                                        mt={2}
                                        variant="outline"
                                        borderColor="red.500"
                                        _text={{color: "red.500"}}
                                        onPress={() => setErrorMessage(null)} // Clear error message
                                    >
                                        Dismiss
                                    </Button>
                                </Box>
                            )}


                            {/* Show total points earned in the quiz */}
                            <Text fontSize="lg" color={colors.onSurface} bold textAlign="center">
                                You earned {totalPoints} points in this quiz!
                            </Text>
                            {beFirstTimeQuiz && (
                                <Text fontSize="md" color={colors.onSurface} textAlign="center" mt={2}>
                                    This is the first time you completed this quiz so you earned 30 points extra!
                                </Text>
                            )}

                            {userScores && userScores.length > 0 ? (
                                userScores.slice().reverse().map((scoreEntry, index) => (
                                    <Box
                                        key={index}
                                        bg={colors.primaryContainer}
                                        p={4}
                                        borderRadius="10px"
                                        shadow={2}
                                        mb={4}
                                    >
                                        <Text fontSize="md" color={colors.onSurface} bold mb={2}>
                                            {`${formatTimeDifference(scoreEntry.time)} - Score: ${(
                                                scoreEntry.totalScore * 100
                                            ).toFixed(2)}%`}
                                        </Text>
                                        <VStack space={2}>
                                            {Object.entries(scoreEntry.flashcardScores).map(
                                                ([flashcardId, score], idx) => {
                                                    const flashcard = flashcards.find(
                                                        (card) => card.id === flashcardId
                                                    );
                                                    return (
                                                        <HStack
                                                            key={idx}
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Text color={colors.onSurface} fontSize="sm">
                                                                {flashcard?.origin} → {flashcard?.destination}
                                                            </Text>
                                                            <Text
                                                                fontSize="sm"
                                                                color={score ? "green.500" : "red.500"}
                                                            >
                                                                {score ? "Correct" : "Incorrect"}
                                                            </Text>
                                                        </HStack>
                                                    );
                                                }
                                            )}
                                        </VStack>
                                    </Box>
                                ))
                            ) : (
                                <Text color={colors.onSurface} fontSize="md" textAlign="center">
                                    No quiz history available.
                                </Text>
                            )}
                        </VStack>
                    </ScrollView>
                </Box>
            </Center>
        );
    }

    return (
        <Center flex={1} px="3" background={colors.surface}>
            <VStack space={4} alignItems="center">
                {errorMessage && (
                    <Box
                        backgroundColor="red.100"
                        borderColor="red.500"
                        borderWidth={1}
                        p={3}
                        mb={3}
                        borderRadius="8"
                        w="100%"
                        alignItems="center"
                    >
                        <Text color="red.600" fontWeight="bold">
                            {errorMessage}
                        </Text>
                        <Button
                            mt={2}
                            variant="outline"
                            borderColor="red.500"
                            _text={{color: "red.500"}}
                            onPress={() => setErrorMessage(null)} // Clear error message
                        >
                            Dismiss
                        </Button>
                    </Box>
                )}
                <Text fontSize="lg" color={colors.onSurface}>
                    Question {currentCardIndex + 1} of {flashcards.length}
                </Text>
                <Progress
                    value={((currentCardIndex + 1) / flashcards.length) * 100}
                    width="90%"
                    colorScheme="green"
                    mb={4}
                />
                <Animated.View
                    style={{
                        transform: [{translateY: slideAnim}],
                        opacity: opacityAnim,
                    }}
                >
                    <Box
                        width="350px"
                        height="250px"
                        bg={colors.primaryContainer}
                        borderRadius="10px"
                        shadow={2}
                        p={6}
                        justifyContent="center"
                    >
                        <VStack
                            space={10}
                            alignItems="center"
                            flex={1}
                            justifyContent="center"
                        >
                            <Text fontSize="2xl" alignItems={"center"} color={colors.onSurface} mb={0}>
                                {flashcards[currentCardIndex].origin}
                                {"\u00A0\u00A0"}
                                {lang2 === "Hokkien" && (
                                    <TextToSpeech
                                        prompt={flashcards[currentCardIndex].origin}
                                        type={'flashcard'}
                                    />
                                )}
                            </Text>
                            <VStack space={5} width="100%">
                                <HStack space={9} width="100%">
                                    <Button
                                        size="lg"
                                        colorScheme={colors.onSurface}
                                        variant="outline"
                                        {...getButtonStyle(0)}
                                        _hover={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _pressed={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _disabled={{
                                            opacity: 1,
                                        }}
                                        flex={1}
                                        onPress={() => handleChoice(0)}
                                        isDisabled={isDisabled}
                                    >
                                        <Text color={colors.onSurface}>
                                            {flashcards[currentCardIndex].choices[0]}
                                        </Text>
                                    </Button>
                                    <Button
                                        size="lg"
                                        colorScheme={colors.onSurface}
                                        variant="outline"
                                        {...getButtonStyle(1)}
                                        _hover={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _pressed={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _disabled={{
                                            opacity: 1,
                                        }}
                                        flex={1}
                                        onPress={() => handleChoice(1)}
                                        isDisabled={isDisabled}
                                    >
                                        <Text color={colors.onSurface}>
                                            {flashcards[currentCardIndex].choices[1]}
                                        </Text>
                                    </Button>
                                </HStack>
                                <HStack space={9} width="100%">
                                    <Button
                                        size="lg"
                                        colorScheme={colors.onSurface}
                                        variant="outline"
                                        {...getButtonStyle(2)}
                                        _hover={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _pressed={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _disabled={{
                                            opacity: 1,
                                        }}
                                        flex={1}
                                        onPress={() => handleChoice(2)}
                                        isDisabled={isDisabled}
                                    >
                                        <Text color={colors.onSurface}>
                                            {flashcards[currentCardIndex].choices[2]}
                                        </Text>
                                    </Button>
                                    <Button
                                        size="lg"
                                        colorScheme={colors.onSurface}
                                        variant="outline"
                                        {...getButtonStyle(3)}
                                        _hover={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _pressed={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _disabled={{
                                            opacity: 1,
                                        }}
                                        flex={1}
                                        onPress={() => handleChoice(3)}
                                        isDisabled={isDisabled}
                                    >
                                        <Text color={colors.onSurface}>
                                            {flashcards[currentCardIndex].choices[3]}
                                        </Text>
                                    </Button>
                                </HStack>
                            </VStack>
                        </VStack>
                    </Box>
                </Animated.View>
            </VStack>
            <TouchableOpacity
                onPress={() => handleSubmit(choiceIndex)}
                disabled={choiceIndex === null}
                style={{
                    backgroundColor: choiceIndex === null ? "#CCCCCC" : colors.onPrimaryContainer,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    alignItems: "center",
                    marginTop: 20,
                }}
            >
                <Text style={{color: "#FFFFFF", fontSize: 16, fontWeight: "bold"}}>
                    Submit
                </Text>
            </TouchableOpacity>
            <Text fontSize="lg" color={colors.onSurface} mt={4}>
                Score: {score}
            </Text>
        </Center>
    );
};

export default QuizScreen;

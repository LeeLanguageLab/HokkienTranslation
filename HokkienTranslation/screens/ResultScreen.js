import React, {useState, useEffect} from "react";
import {Ionicons} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import {
    ScrollView,
    VStack,
    HStack,
    Text,
    Box,
    Image,
    IconButton,
    View,
    Divider,
    Input,
    Button,
} from "native-base";
import {fetchRomanizer} from "../backend/API/HokkienHanziRomanizerService";
import {generateImage} from "../backend/API/TextToImageService";
import TextToSpeech from "./components/TextToSpeech";
import LoadingScreen from "./LoadingScreen";
import {CheckDatabase} from "../backend/CheckDatabase";
import {useTheme} from "./context/ThemeProvider";
import {useComponentVisibility} from "./context/ComponentVisibilityContext";
import {addDoc, collection, doc, serverTimestamp, setDoc, Timestamp} from "firebase/firestore";
import {db} from "../backend/database/Firebase";
import QuickInputWords from "./components/QuickInputWords";
import DictToFlashcardModal from "./CRUD flashcard modals/DictToFlashcard";
import getCurrentUser from "../backend/database/GetCurrentUser";

const TextToImage = ({imageUrl}) => {
    if (!imageUrl) {
        return <Text>Loading...</Text>;
    }
    return (
        <Box alignItems="center" justifyContent="center" mb={2}>
            <Image
                source={{uri: `data:image/jpeg;base64,${imageUrl}`}}
                size="2xl"
                resizeMode="contain"
            />
        </Box>
    );
};

const ResultScreen = ({route}) => {
    const {theme, themes} = useTheme();
    const colors = themes[theme];
    const {query} = route.params;
    const [hokkienTranslation, setHokkienTranslation] = useState("");
    const [hokkienRomanized, setHokkienRomanized] = useState("");
    const [hokkienSentence, setHokkienSentence] = useState("");
    const [hokkienSentenceRomanized, setHokkienSentenceRomanized] = useState("");
    const [dataFromDatabase, setDataFromDatabase] = useState(null);
    const {visibilityStates} = useComponentVisibility();
    const [progress, setProgress] = useState(0);
    const [imageUrl, setImageUrl] = useState(null);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [rate, setRate] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [romanizerErrorMessage, setRomanizerErrorMessage] = useState(null);
    const [imageErrorMessage, setImageErrorMessage] = useState(null);
    const [databaseErrorMessage, setDatabaseErrorMessage] = useState(null);
    const [feedbackErrorMessage, setFeedbackErrorMessage] = useState(null);
    const [dismissedError, setDismissedError] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    const feedbackWords = {
        thumbsUp: [
            "Natural translation",
            "Correct context/image",
            "Polite",
            "Appropriate language",
            "Good pronunciation",
        ],
        thumbsDown: [
            "Translation too literal",
            "Wrong context/image",
            "Rude",
            "Bad words",
            "Bad pronunciation",
        ],
    };

    // not used right now
    // const fetchAndSetRomanization = async (hokkienText, type) => {
    //   try {
    //     const romanizedText = await fetchRomanizer(hokkienText);
    //     if (romanizedText) {
    //       if (type === 1) setHokkienRomanized(romanizedText);
    //       else if (type === 2) setHokkienSentenceRomanized(romanizedText);
    //     }
    //   } catch (error) {
    //     console.error("Error in fetchRomanizer:", error);
    //     setRomanizerErrorMessage("Failed to fetch Romanization. Please try again later.");
    //   }
    // };

    const BoldWordInSentence = ({sentence, wordToBold}) => {
        if (!wordToBold) return <Text>{sentence}</Text>;

        const parts = sentence.split(new RegExp(`(${wordToBold})`, "gi"));
        return (
            <Text fontSize="lg" color={colors.onSurface}>
                {parts.map((part, index) =>
                    part.toLowerCase() === wordToBold.toLowerCase() ? (
                        <Text key={index} bold>
                            {part}
                        </Text>
                    ) : (
                        part
                    )
                )}
            </Text>
        );
    };

    const copyToClipboard = (text) => Clipboard.setString(text);

    const updateProgress = (amount) => {
        setProgress((currentProgress) => {
            const updatedProgress = Math.min(currentProgress + amount, 1.0);
            // console.log("Current: " + currentProgress + " New: " + updatedProgress);
            return updatedProgress;
        });
    };

    const handleFeedbackSubmit = async () => {
        if (feedback && rate !== null) {
            try {
                const userId = await getCurrentUser();

                const now = Timestamp.now();
                const docId = now.toMillis().toString();
                await setDoc(doc(db, "feedback", docId), {
                    rate,
                    feedback,
                    userId,
                    timeStamp: serverTimestamp(),
                    query
                });
                setShowFeedbackForm(false);
                setFeedback("");
                setRate(null);
                setSubmitted(true);
            } catch (error) {
                console.error("Error submitting feedback: ", error);
                setFeedbackErrorMessage("Failed to submit feedback. Please try again later.");
            }
        }
    };

    useEffect(() => {
        const checkData = async () => {
            setProgress(0);
            try {
                updateProgress(0.2);
                const result = await CheckDatabase(query);
                updateProgress(0.2);
                if (!result) {
                    updateProgress(0.6);
                    throw new Error("Failed to get translation.");
                } else if (result.translation && result.sentence) {
                    setDataFromDatabase(result);
                    setHokkienTranslation(result.translation.hokkienTranslation);
                    setHokkienSentence(result.sentence.sentences[0]);
                    // await fetchAndSetRomanization(result.translation.hokkienTranslation, 1);
                    updateProgress(0.4);
                    // await fetchAndSetRomanization(result.sentence.sentences[0], 2);
                    // updateProgress(0.2);
                } else {
                    setHokkienTranslation(result.threeTranslations.hokkienTranslation);
                    // await fetchAndSetRomanization(hokkienTranslation, 1);
                    updateProgress(0.4);
                }
            } catch (error) {
                console.error("Error checking database/getting translation: ", error);
                setDatabaseErrorMessage("Failed to get translation. Please try again later.");
            }
        };
        checkData();
    }, [hokkienTranslation]);

    useEffect(() => {
        const loadImage = async () => {
            try {
                const {imgBase64, error} = await generateImage(query);
                if (error) {
                    throw new Error(error); // Throw an error if one exists
                }
                setImageUrl(imgBase64);
                updateProgress(0.2);
            } catch (error) {
                console.error("Error in generateImage:", error);
                setImageErrorMessage("Failed to generate image. Please try again later.");
            }
        };

        if (hokkienTranslation && !dataFromDatabase?.sentence?.imageURL) {
            loadImage(); // wait for database before loading image
        } else if (hokkienTranslation) {
            updateProgress(0.2);
        }
    }, [hokkienTranslation, dataFromDatabase]);

    if (progress < 1.0 && !romanizerErrorMessage && !imageErrorMessage && !feedbackErrorMessage && !databaseErrorMessage && !dismissedError) {
        return <LoadingScreen progress={progress}/>;
    }

    return (
        <ScrollView
            flex={1}
            bg={colors.surface}
            _contentContainerStyle={{
                px: "4",
                my: "4",
                minW: "72",
                alignItems: "center",
                justifyContent: "flex-start",
            }}
        >
            <VStack width="90%" maxWidth="400px">

                {(romanizerErrorMessage || imageErrorMessage || feedbackErrorMessage || databaseErrorMessage) && (
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
                            {romanizerErrorMessage}
                        </Text>
                        <Text color="red.600" fontWeight="bold">
                            {imageErrorMessage}
                        </Text>
                        <Text color="red.600" fontWeight="bold">
                            {feedbackErrorMessage}
                        </Text>
                        <Text color="red.600" fontWeight="bold">
                            {databaseErrorMessage}
                        </Text>
                        <Button
                            mt={2}
                            variant="outline"
                            borderColor="red.500"
                            _text={{color: "red.500"}}
                            onPress={() => {
                                setRomanizerErrorMessage(null);
                                setImageErrorMessage(null);
                                setFeedbackErrorMessage(null);
                                setDatabaseErrorMessage(null);
                                setDismissedError("Dismissed");
                            }} // Clear the error message
                        >
                            Dismiss
                        </Button>
                    </Box>
                )}

                <DictToFlashcardModal
                    isOpen={openModal}
                    onClose={() => (setOpenModal(false))}
                    hokkien={hokkienTranslation}
                    english={query}
                    romanization={dataFromDatabase?.translation?.romanization}
                    audioUrl={dataFromDatabase?.translation?.audioUrl}
                    contextSentence={dataFromDatabase?.translation?.sentence}
                    downloadUrl={dataFromDatabase?.sentence?.imageURL}
                />

                {/* Query */}
                <HStack justifyContent="space-between" alignItems="flex-start" mb={4} space={4}>
                    <Box flex={1} mr={2}>
                        <VStack>
                            <Text fontSize="lg" fontWeight="bold" color={colors.onSurface}>
                                Query
                            </Text>
                            <HStack alignItems="center">
                                <Text fontSize="2xl" bold color={colors.onSurfaceVariant} flex={1} flexWrap="wrap">
                                    {query}
                                </Text>
                                <IconButton
                                    icon={
                                        <Ionicons
                                            name="copy-outline"
                                            size={20}
                                            color={colors.onPrimaryContainer}
                                        />
                                    }
                                    onPress={() => copyToClipboard(query)}
                                />
                            </HStack>
                        </VStack>
                    </Box>
                    <Button
                        onPress={() => {
                            setOpenModal(true);
                        }}
                        leftIcon={<Ionicons name="add" size={20} color={colors.onPrimaryContainer}/>}
                        bg={colors.primaryContainer}
                        _text={{color: colors.onPrimaryContainer, fontWeight: "bold", fontSize: "sm"}}
                        _hover={{bg: colors.onPrimaryContainer, opacity: 0.8}}
                        _pressed={{bg: colors.onPrimaryContainer, opacity: 0.6}}
                        borderRadius="full"
                        alignSelf="center"
                    >
                        Add to Flashcards
                    </Button>
                </HStack>
                <Divider my={2}/>
                {/* Translation */}
                <Text fontSize="lg" fontWeight="bold" color={colors.onSurface}>
                    Hokkien Translation
                </Text>
                {/* Result */}
                {dataFromDatabase &&
                dataFromDatabase.translation &&
                dataFromDatabase.sentence ? (
                    <View justifyContent="center" width="100%">
                        {/* Hokkien Translation */}
                        <HStack>
                            <Text fontSize="2xl" bold color={colors.onSurfaceVariant}>
                                {hokkienTranslation}
                            </Text>
                            <IconButton
                                icon={
                                    <Ionicons
                                        name="copy-outline"
                                        size={20}
                                        color={colors.onPrimaryContainer}
                                    />
                                }
                                onPress={() =>
                                    copyToClipboard(
                                        dataFromDatabase.translation.hokkienTranslation
                                    )
                                }
                            />
                        </HStack>
                        {visibilityStates.textToSpeech && (
                            <TextToSpeech prompt={hokkienTranslation} type={'translation'}/>
                        )}
                        {/* Definition */}
                        {(visibilityStates.definition ||
                            visibilityStates.englishDefinition) && (
                            <Box
                                backgroundColor={colors.primaryContainer}
                                p={3}
                                mb={5}
                                borderRadius="10"
                                w="100%"
                                alignSelf="center"
                            >
                                {visibilityStates.definition && (
                                    <VStack>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="bold"
                                            color={colors.onSurface}
                                        >
                                            Definition
                                        </Text>
                                        <Text fontSize="md" my={2} color={colors.onSurface}>
                                            {dataFromDatabase.translation.definitions}
                                        </Text>
                                    </VStack>
                                )}
                                {visibilityStates.englishDefinition && (
                                    <VStack>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="bold"
                                            color={colors.onSurface}
                                        >
                                            English Definition
                                        </Text>
                                        <Text fontSize="md" my={2} color={colors.onSurface}>
                                            {dataFromDatabase.translation.englishDefinitions}
                                        </Text>
                                    </VStack>
                                )}
                            </Box>
                        )}
                        {/* Image */}
                        {visibilityStates.image && (
                            <Box
                                backgroundColor={colors.primaryContainer}
                                p={3}
                                mb={5}
                                borderRadius="10"
                                w="100%"
                                alignSelf="center"
                            >
                                <Text
                                    mb={2}
                                    fontSize="lg"
                                    fontWeight="bold"
                                    color={colors.onSurface}
                                >
                                    Context
                                </Text>
                                <Box alignItems="center" justifyContent="center" mb={2}>
                                    <Image
                                        source={{uri: dataFromDatabase.sentence.imageURL}}
                                        size="2xl"
                                        resizeMode="contain"
                                    />
                                </Box>
                            </Box>
                        )}
                        {/* Example Sentence */}
                        {(visibilityStates.hokkienSentence ||
                            visibilityStates.chineseSentence ||
                            visibilityStates.englishSentence) && (
                            <Box
                                backgroundColor={colors.primaryContainer}
                                p={3}
                                borderRadius="10"
                                w="100%"
                                alignSelf="center"
                            >
                                {/* Hokkien Sentence */}
                                {visibilityStates.hokkienSentence && (
                                    <VStack>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="bold"
                                            color={colors.onSurface}
                                        >
                                            Hokkien Example Sentence
                                        </Text>
                                        <HStack alignItems={"center"}>
                                            <BoldWordInSentence
                                                sentence={dataFromDatabase.sentence.sentences[0]}
                                                wordToBold={
                                                    dataFromDatabase.translation.hokkienTranslation
                                                }
                                            />
                                            <IconButton
                                                icon={
                                                    <Ionicons
                                                        name="copy-outline"
                                                        size={20}
                                                        color={colors.onPrimaryContainer}
                                                    />
                                                }
                                                onPress={() =>
                                                    copyToClipboard(
                                                        dataFromDatabase.sentence.sentences[0]
                                                    )
                                                }
                                            />
                                        </HStack>
                                        {visibilityStates.textToSpeech && (
                                            <TextToSpeech prompt={hokkienSentence} type={'sentence'}/>
                                        )}
                                    </VStack>
                                )}
                                {/* Chinese Sentence */}
                                {visibilityStates.chineseSentence && (
                                    <VStack>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="bold"
                                            color={colors.onSurface}
                                        >
                                            Chinese Example Sentence
                                        </Text>
                                        <HStack alignItems={"center"}>
                                            <Text fontSize="lg" color={colors.onSurface}>
                                                {dataFromDatabase.sentence.sentences[2]}
                                            </Text>
                                            <IconButton
                                                icon={
                                                    <Ionicons
                                                        name="copy-outline"
                                                        size={20}
                                                        color={colors.onPrimaryContainer}
                                                    />
                                                }
                                                onPress={() =>
                                                    copyToClipboard(
                                                        dataFromDatabase.sentence.sentences[2]
                                                    )
                                                }
                                            />
                                        </HStack>
                                    </VStack>
                                )}
                                {/* English Sentence */}
                                {visibilityStates.englishSentence && (
                                    <VStack>
                                        <Text
                                            fontSize="lg"
                                            fontWeight="bold"
                                            color={colors.onSurface}
                                        >
                                            English Example Sentence
                                        </Text>
                                        <HStack alignItems={"center"}>
                                            <Text fontSize="lg" color={colors.onSurface}>
                                                {dataFromDatabase.sentence.sentences[1]}
                                            </Text>
                                            <IconButton
                                                icon={
                                                    <Ionicons
                                                        name="copy-outline"
                                                        size={20}
                                                        color={colors.onPrimaryContainer}
                                                    />
                                                }
                                                onPress={() =>
                                                    copyToClipboard(
                                                        dataFromDatabase.sentence.sentences[1]
                                                    )
                                                }
                                            />
                                        </HStack>
                                    </VStack>
                                )}
                            </Box>
                        )}
                    </View>
                ) : (
                    <View justifyContent="center" width="100%">
                        <HStack>
                            <Text fontSize="2xl" bold color={colors.onSurfaceVariant}>
                                {hokkienTranslation}
                            </Text>
                            <IconButton
                                icon={
                                    <Ionicons
                                        name="copy-outline"
                                        size={20}
                                        color={colors.onPrimaryContainer}
                                    />
                                }
                                onPress={() => copyToClipboard(hokkienTranslation)}
                            />
                        </HStack>
                        {visibilityStates.textToSpeech && (
                            <TextToSpeech prompt={hokkienTranslation} type={'translation'}/>
                        )}
                        {visibilityStates.image && (
                            <Box
                                backgroundColor={colors.primaryContainer}
                                p={3}
                                borderRadius="10"
                                w="100%"
                                alignSelf="center"
                            >
                                <Text
                                    fontSize="lg"
                                    my={2}
                                    fontWeight="bold"
                                    color={colors.onSurface}
                                >
                                    Context
                                </Text>
                                <TextToImage m={2} imageUrl={imageUrl}/>
                            </Box>
                        )}
                    </View>
                )}
                {/* Thumbs Up/Down and Feedback */}
                {!submitted && (
                    <VStack width="100%">
                        <HStack justifyContent="center" mt={4}>
                            <IconButton
                                icon={
                                    <Ionicons
                                        name="thumbs-up"
                                        size={30}
                                        color={colors.onPrimaryContainer}
                                    />
                                }
                                onPress={() => {
                                    setRate(true);
                                    setShowFeedbackForm(true);
                                }}
                            />
                            <IconButton
                                icon={
                                    <Ionicons
                                        name="thumbs-down"
                                        size={30}
                                        color={colors.onPrimaryContainer}
                                    />
                                }
                                onPress={() => {
                                    setRate(false);
                                    setShowFeedbackForm(true);
                                }}
                            />
                        </HStack>
                        {showFeedbackForm && (
                            <>
                                <QuickInputWords
                                    label="Feedback:"
                                    words={
                                        rate ? feedbackWords.thumbsUp : feedbackWords.thumbsDown
                                    }
                                    onWordPress={(word) => setFeedback(word)}
                                />
                                <VStack space={4} mt={4} width="100%">
                                    <Input
                                        variant="outline"
                                        placeholder="Enter your feedback"
                                        value={feedback}
                                        onChangeText={(text) => setFeedback(text)}
                                        multiline={true}
                                        h={20}
                                        paddingX={1}
                                        paddingY={2}
                                        style={{
                                            fontSize: 20,
                                            color: colors.onSurface,
                                        }}
                                    />
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
                                        onPress={() => setFeedback("")}
                                    />
                                    <Button
                                        onPress={handleFeedbackSubmit}
                                        borderRadius="full"
                                        backgroundColor={colors.primaryContainer}
                                        _pressed={{
                                            backgroundColor: colors.onPrimaryContainer,
                                            opacity: 0.8,
                                            _text: {
                                                color: colors.primaryContainer,
                                            },
                                        }}
                                        _text={{
                                            color: colors.onPrimaryContainer,
                                            fontSize: "sm",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Submit
                                    </Button>
                                </VStack>
                            </>
                        )}
                    </VStack>
                )}
            </VStack>
        </ScrollView>
    );
};

export default ResultScreen;

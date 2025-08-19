import React, {useEffect, useRef, useState} from 'react';
import {Animated, Text} from 'react-native';
import {
    getFlashcardListFromFlashcardListName,
    getFSRSParameters,
    getSchedulingCards,
    putFSRSParameters,
    putSchedulingCards,
    saveReviewInstance,
    updateOneSchedulingCard
} from '../backend/flashcards/flashcardFetchFunctions';
import {db} from "../backend/database/Firebase";
import {doc, getDoc} from "firebase/firestore";
import getCurrentUser from "../backend/database/GetCurrentUser";
import {Box, Button, Center, HStack, VStack,} from "native-base";
import {useTheme} from "./context/ThemeProvider";
import {FSRS, generatorParameters} from "ts-fsrs";
import {createExtendedCard} from './components/extendedCard';
import TextToSpeech from "./components/TextToSpeech";
import MixpanelService from "../backend/API/Mixpanel";
import {recordDeckCompletion} from "../backend/badges/EventTracker";
import {useToast} from "react-native-toast-notifications";
import getCurrentUserActual from "../backend/database/GetCurrentUserActual";

var currentUser = "";

const LearningScreen = ({route}) => {

    const {theme, themes} = useTheme();
    const colors = themes[theme];
    // const [hokkienOption, setHokkienOption] = useState("Characters");
    // const [optionType, setOptionType] = useState("English");
    // const [isDisabled, setIsDisabled] = useState(false);
    // const [currentCardIndex, setCurrentCardIndex] = useState(0);
    // const [flashcards, setFlashcards] = useState([]);
    const [curCard, setCurCard] = useState(null);
    const [allFlashcards, setAllFlashcards] = useState([]);
    const [loading, setLoading] = useState(true);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    // const [choiceIndex, setChoice] = useState(null);
    // const {languages} = useLanguage();
    // const [lang1, setLang1] = useState(languages[0]); // choices
    // const [lang2, setLang2] = useState(languages[1]); // question
    const choices = ["Again", "Hard", "Good", "Easy"];
    const [schedulingCardList, setSchedulingCardList] = useState([]);
    const [FSRSscheduler, setFSRSscheduler] = useState(null);
    const [newCards, setNewCards] = useState([]);
    const [againCards, setAgainCards] = useState([]);
    const [reviewCards, setReviewCards] = useState([]);
    const [currentList, setCurrentList] = useState("New");
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionHasCards, setSessionHasCards] = useState(false);
    const toast = useToast();

    const flashcardListName = route.params.flashcardListName;

    useEffect(() => {
        const initializeMixpanel = async () => {
            try {
                await MixpanelService.initialize();
                MixpanelService.track("Learning Screen Opened", {
                    flashcardListName: flashcardListName,
                });
                MixpanelService.flush();
            } catch (error) {
                console.error("Mixpanel initialization error:", error);
            }
        }

        initializeMixpanel();
    }, [])


    const fetchSchedulingCards = async () => {
        try {
            const schedulingCardList = await getSchedulingCards(currentUser, flashcardListName);
            console.log(schedulingCardList);
            return schedulingCardList;

        } catch (error) {
            console.error("Error fetching scheduling cards: ", error);
        }
    }

    const fetchFlashcards = async () => {
        try {
            const flashcardsList = await getFlashcardListFromFlashcardListName(flashcardListName);
            const flashcardIds = flashcardsList[0].cardList;


            const flashcardList = (await Promise.all(
                flashcardIds.map(async (flashcardId) => {
                    const flashcardDocRef = doc(db, "flashcard", flashcardId);
                    const flashcardDoc = await getDoc(flashcardDocRef);
                    // (Tanay) this maps the data so that it can be used
                    return flashcardDoc.exists()
                        ? {
                            id: flashcardDoc.id,
                            origin: flashcardDoc.data().origin,       // Question (Hokkien)
                            destination: flashcardDoc.data().destination, // Answer (English)
                        }
                        : null; // Skip non-existent flashcards
                })
            )).filter(Boolean); // Remove null values
            console.warn("Flashcard List:", flashcardList)
            return flashcardList;


        } catch (error) {
            console.error("Error fetching flashcards: ", error);
        }
    };// Modifications on this funcation have been complete


    const getScheduledCards = (cardList) => {
        var dueCards = cardList.filter(card => card.due <= new Date());
        // console.log(dueCards);

        // split dueCards by completely new cards and review cards. take new cards out of due cards
        const newCards = dueCards.filter(card => card.reps === 0);
        dueCards = dueCards.filter(card => card.reps > 0);
        // cards that have less than 1 day time diff between due date and last review
        const againCards = dueCards.filter(card => card.due - card.last_review < 86400000);

        // cards that have more than 1 day time diff between due date and last review
        const reviewCards = dueCards.filter(card => card.due - card.last_review >= 86400000);

        return [newCards, againCards, reviewCards];
    };

    const flashcardMapping = (findFlashcard, allFlashcards) => {
        // console.log("Current Flashcard", findFlashcard)
        // console.log(allFlashcards)
        const newF = allFlashcards.find(flashcard => flashcard.id === findFlashcard.flashcardId);
        // console.log("New Flashcard", newF)
        if (newF) {
            return newF
        } else {
            console.error(`Flashcard with ID ${findFlashcard.flashcardId} not found`);
        }

    }

//   const getButtonStyle = (index) => {
//     const correctAnswer = flashcards[currentCardIndex].destination;
//     const choice = 1;

//     if (selectedAnswer === null) {
//       return index === choiceIndex
//         ? {bg: colors.darkerPrimaryContainer, borderColor: colors.buttonBorder}
//         : {bg: colors.primaryContainer, borderColor: colors.buttonBorder};
//     } else if (choice === correctAnswer) {
//       return index === selectedAnswer
//         ? { bg: "rgba(39, 201, 36, 0.6)", borderColor: "#27c924" }
//         : { bg: "rgba(39, 201, 36, 0.6)", borderColor: "#27c924" };
//     } else {
//       return index === selectedAnswer
//         ? { bg: "rgba(186, 34, 39, 0.6)", borderColor: "#ba2227" }
//         : { bg: colors.primaryContainer, borderColor: colors.buttonBorder };
//     }
//   };

    useEffect(() => {
        // console.log("Current Card Index: ", curCard);


    }, [curCard]);
    const fetchUser = async () => {
        try {
            currentUser = await getCurrentUser();
            // console.log("Current User: ", currentUser);

        } catch (error) {
            // console.error("Error fetching user: ", error);
        }
    };


    const handleChoice = async (number) => {

        // var choice = choices[number];
        // get flashcard from schedulingcardList by flashcard ID
        var currentId = curCard.id;


        const currentCard = schedulingCardList.find(card => card.flashcardId === currentId);


        var futurecards = FSRSscheduler.repeat(currentCard, new Date());
        // console.log("Error check")


        var updatedcard = futurecards[number + 1].card


        const updatedSchedulingCardList = schedulingCardList.map(card =>
            card.flashcardId === currentId ? {...card, ...updatedcard} : card
        );

        setSchedulingCardList(updatedSchedulingCardList);

        // update the card in the database
        // console.log(currentUser);
        await updateOneSchedulingCard(db, currentUser, updatedcard, flashcardListName);


        var cardlog = futurecards[number + 1].log
        // console.log("Card Log:", cardlog);
        await saveReviewInstance(db, currentUser, cardlog, flashcardListName);

        var newCardsX = newCards;
        var reviewCardsX = reviewCards;
        var againCardsX = againCards;

        // remove card from current list
        if (currentList === "New") {
            newCardsX = newCards.filter(card => card.flashcardId !== updatedcard.flashcardId);
        } else if (currentList === "Again") {
            againCardsX = againCards.filter(card => card.flashcardId !== updatedcard.flashcardId);
        } else {
            reviewCardsX = reviewCards.filter(card => card.flashcardId !== updatedcard.flashcardId);
        }

        // get the time difference between now and the next due date
        var timeDiff = updatedcard.due - new Date();


        if (number === 0) { // this is for again
            // any card in again is put into the againCards list
            againCardsX = [...againCardsX, updatedcard];

        } else { // this is for hard
            // check the timeDiff. If less than 1 day, put into againCards, else put into reviewCards
            // console.log("Time Diff:", timeDiff);
            if (timeDiff < 86400000) {
                againCardsX = [...againCardsX, updatedcard];
            } else {
                reviewCardsX = [...reviewCardsX, updatedcard];
            }
        }
        // get all Duecards in again

        var dueAgainCards = againCardsX.filter(card => card.due <= new Date());
        // console.log("Due again Cards:", dueAgainCards);

        var dueReviewCards = reviewCardsX.filter(card => card.due <= new Date());


        // if there are dueAgainCards, set the flashcards to again, set the currentList to again

        if (dueAgainCards.length > 0) {
            // find card in allFlashcards
            var newF = flashcardMapping(dueAgainCards[0], allFlashcards);

            setCurCard(newF);
            setCurrentList("Again");
        } else {
            let newF;
            // if there are new cards, set the flashcards to new, set the currentList to new
            if (newCardsX.length > 0) {

                newF = flashcardMapping(newCardsX[0], allFlashcards);
                setCurCard(newF);

                setCurrentList("New");
            }
            // if there are review cards, set the flashcards to review, set the currentList to review
            else if (dueReviewCards.length > 0) {

                newF = flashcardMapping(dueReviewCards[0], allFlashcards);
                setCurCard(newF);
                setCurrentList("Review");
            } else if (againCardsX.length > 0) {
                // if there are no more cards, set the flashcards to again, set the currentList to again
                console.log("Again Cards 2.5:", againCardsX);
                newF = flashcardMapping(againCardsX[0], allFlashcards);
                console.log("Again Cards 3:", againCardsX);
                setCurCard(newF);
                setCurrentList("Again");
            } else {
                // if there are no more cards, set the flashcards to empty
                setCurCard(null);

                if (sessionHasCards) {
                    const userActual = await getCurrentUserActual();
                    await recordDeckCompletion(userActual.uid, flashcardListName, toast);
                    setSessionHasCards(false); // reset flag so reopening doesn't trigger again
                }
            }


        }

        // console.log("New:", newCardsX);
        // console.log("Review:", reviewCardsX);
        // console.log("Again:", againCardsX);

        setNewCards(newCardsX);
        setReviewCards(reviewCardsX);
        setAgainCards(againCardsX);

        setShowAnswer(false);


    }
    // useEffect(() => {
    //         const fetchData = async () => {
    //             setLoading(true);
    //             try{

    //             }catch (e) {
    //                 console.error("fetchData error:", e);
    //                } finally {
    //                 setLoading(false);
    //             }

    //             const flashcardsList = await fetchFlashcards();
    //             var allFlashcardsX = flashcardsList;
    //             setAllFlashcards(allFlashcardsX);
    //             const schedulingCards = await fetchSchedulingCards();

    //             console.log(schedulingCards);
    //             if (!schedulingCards.exists) {

    //                 const [fsrsScheduler, schedulingCardList] = await initalizeScheduler(flashcardsList);

    //                 setFSRSscheduler(fsrsScheduler);
    //                 setSchedulingCardList(schedulingCardList);
    //                 // var FSRSParameters = generatorParameters(fsrsScheduler);
    //                 console.log(schedulingCardList);
    //                 await putSchedulingCards(db, currentUser, schedulingCardList, flashcardListName);
    //                 // await putFSRSParameters(db, currentUser, FSRSParameters);
    //                 const paramToSave = generatorParameters(fsrsScheduler);
    //                 await putFSRSParameters(db, currentUser, paramToSave);

    //                 const [newCards, againCards, reviewCards] = getScheduledCards(schedulingCardList);

    //                 setNewCards(newCards.slice(0, 20));
    //                 setReviewCards(reviewCards);
    //                 setAgainCards(againCards);

    //                 const flashcardsX = flashcardMapping(newCards[0], allFlashcardsX);
    //                 setCurCard(flashcardsX);

    //                 //console.log(   flashcardsX);

    //                 // initalizeScheduler(currentUser);
    //                 setLoading(false);
    //             } else {
    //                 setSchedulingCardList(schedulingCards.cards);
    //                 const schedulingParameters = await getFSRSParameters(db, currentUser);
    //                 // console.log(schedulingParameters);


    //                 const fsrsScheduler = new FSRS(schedulingParameters);
    //                 setFSRSscheduler(fsrsScheduler);

    //                 const [newCards, againCards, reviewCards] = getScheduledCards(schedulingCards.cards);

    //                 setNewCards(newCards.slice(0, 20));
    //                 setReviewCards(reviewCards);
    //                 setAgainCards(againCards);

    //                 const flashcardsX = flashcardMapping(newCards[0], allFlashcardsX);
    //                 setCurCard(flashcardsX);

    //                 //console.log(   flashcardsX);

    //                 // initalizeScheduler(currentUser);
    //                 setLoading(false);
    //             }


    //         };
    //         fetchUser();
    //         fetchData();
    //     }
    //     , [])
    useEffect(() => {
        let isMounted = true; // avoid state updates after unmount

        (async () => {
            if (!isMounted) return;
            setLoading(true);
            try {
                // 1) Ensure user is fetched first (to use currentUser below)
                await fetchUser();

                // 2) Fetch flashcards and scheduling data
                const flashcardsList = await fetchFlashcards();
                if (!isMounted) return;
                setAllFlashcards(flashcardsList);

                const schedulingCards = await fetchSchedulingCards();

                if (!schedulingCards?.exists) {
                    // First-time init
                    const [fsrsScheduler, schedulingCardList] = await initalizeScheduler(flashcardsList);
                    if (!isMounted) return;

                    setFSRSscheduler(fsrsScheduler);
                    setSchedulingCardList(schedulingCardList);

                    // persist data
                    await putSchedulingCards(db, currentUser, schedulingCardList, flashcardListName);
                    const paramsToSave = generatorParameters(fsrsScheduler);
                    await putFSRSParameters(db, currentUser, paramsToSave);

                    // split queues
                    const [newC, againC, reviewC] = getScheduledCards(schedulingCardList);
                    if (newC.length > 0 || againC.length > 0 || reviewC.length > 0) {
                        setSessionHasCards(true);
                    } else {
                        setSessionHasCards(false);
                    }
                    if (!isMounted) return;
                    setNewCards(newC.slice(0, 20));
                    setAgainCards(againC);
                    setReviewCards(reviewC);

                    // pick first due card safely
                    if (newC.length > 0) {
                        setCurCard(flashcardMapping(newC[0], flashcardsList));
                        setCurrentList("New");
                    } else if (againC.length > 0) {
                        setCurCard(flashcardMapping(againC[0], flashcardsList));
                        setCurrentList("Again");
                    } else if (reviewC.filter(c => c?.due <= new Date()).length > 0) {
                        setCurCard(flashcardMapping(reviewC[0], flashcardsList));
                        setCurrentList("Review");
                    } else {
                        setCurCard(null);

                        if (sessionHasCards) {
                            const userActual= await getCurrentUserActual();
                            await recordDeckCompletion(userActual.uid, flashcardListName, toast);
                            setSessionHasCards(false); // reset flag so reopening doesn't trigger again
                        }
                    }
                } else {
                    // Returning user
                    if (!isMounted) return;
                    setSchedulingCardList(schedulingCards.cards);

                    const schedulingParameters = await getFSRSParameters(db, currentUser);
                    const fsrsScheduler = new FSRS(schedulingParameters);
                    if (!isMounted) return;
                    setFSRSscheduler(fsrsScheduler);

                    const [newC, againC, reviewC] = getScheduledCards(schedulingCards.cards);
                    setNewCards(newC.slice(0, 20));
                    setAgainCards(againC);
                    setReviewCards(reviewC);

                    if (newC.length > 0 || againC.length > 0 || reviewC.length > 0) {
                        setSessionHasCards(true);
                    } else {
                        setSessionHasCards(false);
                    }

                    if (newC.length > 0) {
                        setCurCard(flashcardMapping(newC[0], flashcardsList));
                        setCurrentList("New");
                    } else if (againC.length > 0) {
                        setCurCard(flashcardMapping(againC[0], flashcardsList));
                        setCurrentList("Again");
                    } else if (reviewC.filter(c => c?.due <= new Date()).length > 0) {
                        setCurCard(flashcardMapping(reviewC[0], flashcardsList));
                        setCurrentList("Review");
                    } else {
                        setCurCard(null);
                    }
                }
            } catch (e) {
                console.error("fetchData error:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
        // include dependencies that can change this screen's data
    }, [flashcardListName]);


    if (loading) {
        return (
            <Center flex={1} px="3" background={colors.surface}>
                <Text color={colors.onSurface}>Loading...</Text>
            </Center>
        );
    }

    if (curCard === null) {
        return (
            <Center flex={1} px="3" background={colors.surface}>
                <Text color={colors.onSurface}>Done Studying for Today!</Text>
            </Center>
        );
    }


    return (
        <Center flex={1} px="3" background={colors.surface}>
            <VStack space={4} alignItems="center">
                {/* <Text fontSize="lg" color={colors.onSurface}>
          Question {currentCardIndex + 1} of {flashcards.length}
        </Text>
        <Progress
          value={((currentCardIndex + 1) / flashcards.length) * 100}
          width="90%"
          colorScheme="green"
          mb={4}
        /> */}
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
                            <VStack space={1} alignItems="center">
                                <Text alignItems={"center"} color={colors.onSurface} mb={0}
                                      style={{fontSize: 36}}
                                >
                                    {showAnswer ? curCard.destination : curCard.origin}
                                </Text>
                                {!showAnswer && (
                                    <TextToSpeech
                                        prompt={curCard.origin}
                                    />
                                )}
                            </VStack>
                            <VStack space={5} width="100%">
                                {showAnswer ? (
                                    <>
                                        <HStack space={9} width="100%">
                                            <Button
                                                bg="red.300"
                                                size="lg"
                                                colorScheme={colors.onSurface}
                                                variant="outline"

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
                                                    {choices[0]}
                                                </Text>
                                            </Button>
                                            <Button
                                                bg="orange.300"
                                                size="lg"
                                                colorScheme={colors.onSurface}
                                                variant="outline"
                                                // {...getButtonStyle(1)}
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
                                                    {choices[1]}
                                                </Text>
                                            </Button>
                                        </HStack>
                                        <HStack space={9} width="100%">
                                            <Button
                                                bg="yellow.300"
                                                size="lg"
                                                colorScheme={colors.onSurface}
                                                variant="outline"
                                                // {...getButtonStyle(2)}
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
                                                    {choices[2]}
                                                </Text>
                                            </Button>
                                            <Button
                                                bg="green.300"
                                                size="lg"
                                                colorScheme={colors.onSurface}
                                                variant="outline"
                                                // {...getButtonStyle(3)}
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
                                                    {choices[3]}
                                                </Text>
                                            </Button>

                                        </HStack>
                                    </>
                                ) : (
                                    <Button
                                        size="lg"
                                        colorScheme={colors.onSurface}
                                        variant="outline"
                                        _hover={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        _pressed={{
                                            borderColor: colors.highlightButtonBorder,
                                        }}
                                        onPress={() => setShowAnswer(true)}
                                    > Show Answer
                                    </Button>
                                )}
                            </VStack>
                        </VStack>
                    </Box>
                </Animated.View>
            </VStack>


            <Box
                width="40%"
                position="absolute"
                bottom={0}
                height="20%"
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="end"
                padding="4"
            >
                <Text style={{fontSize: 12, color: 'blue', marginRight: 8}}>{newCards.length}</Text>
                <Text style={{fontSize: 12, color: 'red', marginRight: 8}}>{againCards.length}</Text>
                <Text style={{
                    fontSize: 12,
                    color: 'green',
                    marginRight: 8
                }}>{reviewCards.filter(card => card?.due <= new Date()).length}</Text>
            </Box>

        </Center>
    )

}


async function initalizeScheduler(flashcardList) {

    // this function should initalize the scheduler for a user that has never used the scheduling system before.
    var cardList = [];
    // for each flashcard, create an empty extended card associated with it. attach the flashcard object id to the card
    flashcardList.map((flashcard) => {

        let card = createExtendedCard(flashcard.id, new Date().getTime());
        cardList.push(card);


    });

    // create a new scheduler object
    var scheduler = new FSRS();


    // const dueCards = cardList.filter(card => card.due <= new Date());

    // schedule at cards for now
    var scheduling_cards;
    cardList.map(
        (card) => {

            scheduling_cards = scheduler.repeat(card, new Date());


            //console.log(scheduling_cards);
        }
    )


    return [scheduler, cardList]

    // var recordLogItem = scheduler.next(cardList[0], new Date(), 1);
    // console.log(recordLogItem);
    // recordLogItem = scheduler.next(cardList[0], new Date(), 1);
    // console.log(recordLogItem);
    // var scheduling_cards = scheduler.next(cardList[0], new Date(), 2);
    // //scheduling_cards = scheduler.repeat(cardList[0], new Date(), 1);
    // console.log(scheduling_cards);
    // //const good = scheduling_cards[1];
    // //console.log(good);
    // scheduling_cards[Rating.Again].card
    // scheduling_cards[Rating.Again].log

    // scheduling_cards[Rating.Hard].card
    // scheduling_cards[Rating.Hard].log

    // scheduling_cards[Rating.Good].card
    // scheduling_cards[Rating.Good].log

    // scheduling_cards[Rating.Easy].card
    // scheduling_cards[Rating.Easy].log
    // console.log(scheduling_cards);
}


export default LearningScreen;

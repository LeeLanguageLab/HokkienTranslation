
import {
    generatorParameters,
    FSRSParameters,
    FSRS,
    RecordLog,
} from "ts-fsrs";
import { ExtendedCard, createExtendedCard } from "../../screens/components/extendedCard";
import db from "../firebase";

async function storeCardInformation(cardList, db, currentUser) {
    await Promise.all(cardList.map(async (card) => {
        const cardObject = {
            flashcardId: card.flashcardId,
            difficulty: card.difficulty,
            due: card.due,
            elapsed_days: card.elapsed_days,
            lapses: card.lapses,
            last_review: card.last_review,
            reps: card.reps,
            scheduled_days: card.scheduled_days,
            stability: card.stability,
            state: card.state,
        };

        const cardsRef = collection(db, "schedulerFlashcardStorage", currentUser);
        const q = query(cardsRef, where("flashcardId", "==", card.flashcardId)); // Query by flashcardId
        const querySnapshot = await getDocs(q);
        
        try {
            if (!querySnapshot.empty) {
                // If a matching document is found, update the first one (assuming unique flashcardId)
                const existingDoc = querySnapshot.docs[0].ref;
                await updateDoc(existingDoc, card);
            } else {
                // If no document found, create a new one
                const newDocRef = doc(cardsRef); // Auto-generates an ID
                await setDoc(newDocRef, card);
            }
        } catch (error) {
            console.error(`Error storing card ${card.flashcardId}:`, error);
        }
    }));
}


async function fetchCardInformation(db, currentUser) {
    const cardsRef = collection(db, "schedulerFlashcardStorage", currentUser);
    const cardsSnapshot = await getDocs(cardsRef);

    const cardList = cardsSnapshot.docs.map((doc) => ({
        flashcardId: doc.flashcardId,
        difficulty: doc.difficulty,
        due: doc.due,
        elapsed_days: doc.elapsed_days,
        lapses: doc.lapses,
        last_review: doc.last_review,
        reps: doc.reps,
        scheduled_days: doc.scheduled_days,
        stability: doc.stability,
        state: doc.state,
    }));

    return cardList;
}

async function storeFSRSParameters(db, currentUser, FSRSParameters) {


    const paramsRef = doc(db, "schedulerFSRSParameters", currentUser);

    const FSRSParametersObject = {
        ...FSRSParameters,
    }
    await setDoc(paramsRef, FSRSParameters);
}

async function fetchFSRSParameters(db, currentUser) {
    const paramsRef = doc(db, "schedulerFSRSParameters", currentUser);
    const paramsSnapshot = await getDoc(paramsRef);

    const FSRSParameters = paramsSnapshot.data();

    return FSRSParameters;
}




async function storeRecordLog(db, currentUser, recordLog) {


    // the recordLog consists of RecordLogItems
    const recordLogRef = doc(db, "schedulerRecordLog", currentUser);

    const recordLogObject = {
        recordLog: recordLog,
    }

    await setDoc(recordLogRef, recordLogObject);
 
}

async function fetchRecordLog(db, currentUser) {
    const recordLogRef = doc(db, "schedulerRecordLog", currentUser);
    const recordLogSnapshot = await getDoc(recordLogRef);

    const recordLog = recordLogSnapshot.data();

    return recordLog;
}
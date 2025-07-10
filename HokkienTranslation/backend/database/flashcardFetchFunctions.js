import {collection, getDoc, getDocs} from "firebase/firestore";
import {addDoc} from "firebase/firestore";
import {updateDoc} from "firebase/firestore";
import {query, where} from "firebase/firestore";
import {doc, setDoc} from "firebase/firestore";
import {db} from "./Firebase";


export async function getFlashcardListFromFlashcardListName(flashcardListName) {
    // This function takes the flashcardListName and retrieves the flashcard list from Firestore.
    // It also replicates getFlashcardList but focuses on a specific flashcard list by name.
    try {
        const docRef = doc(db, "flashcardList", flashcardListName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {

            const flashcardMap = {
                id: docSnap.id,
                ...docSnap.data()
            };
            return [flashcardMap];
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
}

export async function getFlashcardList(db, currentUser) {
    const flashcardCol = collection(db, "flashcardList");
    const flashcardSnapshot = await getDocs(flashcardCol);

    const flashcardList = flashcardSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));


    const filteredList = flashcardList.filter((deck) =>
        deck.createdBy === currentUser || deck.shared);

    console.log(filteredList);
    return filteredList;
}

export async function getSchedulingCards(currentUser) {
    const cardsRef = collection(db, "schedulerFlashcardStorage", currentUser, "flashcards");
    const cardsSnapshot = await getDocs(cardsRef);

    if (cardsSnapshot.empty) {
        // No documents in this user's collection
        return {
            exists: false,
            cards: [],
        };
    }

    const cardList = cardsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            flashcardId: data.flashcardId,
            difficulty: data.difficulty,
            due: data.due?.toDate?.(),
            elapsed_days: data.elapsed_days,
            lapses: data.lapses,
            last_review: data.last_review?.toDate?.(),
            reps: data.reps,
            scheduled_days: data.scheduled_days,
            stability: data.stability,
            state: data.state,
        };
    });

    return {
        exists: true,
        cards: cardList,
    };
}


export async function putSchedulingCards(db, currentUser, schedulingCardList, flashcardListName) {
    const cardRef = collection(db, "schedulerFlashcardStorage", currentUser, flashcardListName);
    console.log(schedulingCardList);
    await Promise.all(
        schedulingCardList.map((card) => addDoc(cardRef, card))
    );
}

export async function updateOneSchedulingCard(db, currentUser, card, flashcardListName) {

    const flashcardsRef = collection(db, "schedulerFlashcardStorage", currentUser, flashcardListName);
    const q = query(flashcardsRef, where("flashcardId", "==", card.flashcardId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log("Card not found for update:");
        return;
    }

    // Get the document ID of the first matching card
    const docRef = querySnapshot.docs[0].ref;

    // Update the document
    await updateDoc(docRef, card);
    console.log("Updated card:", card);


}


export async function saveReviewInstance(db, currentUser, reviewInstance, flashcardListName) {
    const reviewRef = collection(db, "schedulerFlashcardStorage", currentUser, "reviewLog");

    const reviewInstanceWithListName = {
        ...reviewInstance,
        flashcardListName: flashcardListName
    };

    await addDoc(reviewRef, reviewInstanceWithListName);
}

export async function getFSRSParameters(db, currentUser) {
    const paramsRef = collection(db, "schedulerFSRSParameters");
    const paramsSnapshot = await getDocs(paramsRef, currentUser);

    if (paramsSnapshot.empty) {
        return null;
    }

    const params = paramsSnapshot.docs[0].data();

    return params;
}

export async function putFSRSParameters(db, currentUser, FSRSParameters) {
    const paramsRef = doc(db, "schedulerFSRSParameters", currentUser);
    await setDoc(paramsRef, FSRSParameters);
}

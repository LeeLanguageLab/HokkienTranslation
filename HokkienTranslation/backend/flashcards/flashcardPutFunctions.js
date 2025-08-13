import {doc, setDoc, updateDoc} from "firebase/firestore";
import {db} from "../database/Firebase";


export async function setFlashcard(flashcardData) {
    // This function takes the flashcard data and gives it new values.
    const flashcardRef = doc(db, "flashcards");
    await setDoc(flashcardRef, flashcardData);
    return flashcardRef.id
}

export async function updateFlashcardData(flashcardId, flashcardData){
    const flashcardRef = doc(db, "flashcard", flashcardId);
    await updateDoc(flashcardRef, flashcardData)

}

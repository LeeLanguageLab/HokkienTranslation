import {collection, doc, documentId, getDoc, getDocs, limit, query, where} from "firebase/firestore";
import {db} from "../database/Firebase";

export const getRandomFlashcard = async (flashcardId?: string) => {
    console.log("Fetching random flashcard...");
    try {
        let flashcardDoc;

        if (flashcardId) {
            // Get specific flashcard if ID is provided
            const docRef = doc(db, "flashcard", flashcardId);
            flashcardDoc = await getDoc(docRef);
            if (!flashcardDoc.exists()) {
                console.error("Flashcard not found:", flashcardId);
                return null;
            }
        } else {
            // Generate a random ID (same format as Firestore auto IDs)
            const randomId = doc(collection(db, "random")).id;

            // Query for documents with ID >= random ID
            const flashcardsRef = collection(db, "flashcard");
            const greaterQuery = query(
                flashcardsRef,
                where(documentId(), ">=", randomId),
                limit(1)
            );

            let flashcardsSnapshot = await getDocs(greaterQuery);

            // If no results, wrap around to the beginning of the collection
            if (flashcardsSnapshot.empty) {
                const lessQuery = query(
                    flashcardsRef,
                    where(documentId(), "<", randomId),
                    limit(1)
                );
                flashcardsSnapshot = await getDocs(lessQuery);
            }

            if (flashcardsSnapshot.empty) {
                console.log("No flashcards found");
                return null;
            }

            flashcardDoc = flashcardsSnapshot.docs[0];
        }

        const flashcard = flashcardDoc.data();
        flashcard.id = flashcardDoc.id;

        return flashcard;
    } catch (error) {
        console.error("Error fetching flashcard:", error);
        return null;
    }
};

import {fetchAudioBlob, fetchNumericTones} from "../API/TextToSpeechService";
import {uploadAudioFromBlob} from "../database/UploadtoDatabase";
import {collection, doc, getDoc, getDocs, query, updateDoc, where} from "firebase/firestore";
import {db} from "../database/Firebase";


export async function createRomanization(word) {

    const romanization = await fetchNumericTones(word);
    const audioBlob = await fetchAudioBlob(romanization);
    const audioUrl = await uploadAudioFromBlob(romanization, audioBlob);
    return {romanization, audioBlob, audioUrl}
}

// Add to learningScreen.js or create a separate utility file

export async function getRomanization(word, flashcardId = null) {
    try {
        // Step 1: Check if romanization already exists

        // If flashcardId is provided, check that specific card first
        if (flashcardId) {
            const flashcardRef = doc(db, "flashcard", flashcardId);
            const flashcardDoc = await getDoc(flashcardRef);

            if (flashcardDoc.exists()) {
                console.log("Flashcard doc exists while getng romaization")
                const data = flashcardDoc.data();
                if (data.romanization) {
                    return {
                        romanization: data.romanization,
                        audioUrl: data.audioUrl,
                        wasGenerated: false,
                        source: 'specific_card'
                    };
                }
                else {
                    console.warn("Flashcard exists but has no romanization, generating new one");
                }
            }
        }

        // Fallback: search by word if no flashcardId or if specific card doesn't have romanization
        const flashcardQuery = query(
            collection(db, "flashcard"),
            where("origin", "==", word)
        );
        const querySnapshot = await getDocs(flashcardQuery);

        if (!querySnapshot.empty) {
            // Check all matching cards for romanization
            for (const docSnapshot of querySnapshot.docs) {
                const flashcard = docSnapshot.data();
                if (flashcard.romanization) {
                    // If we have a specific flashcardId but found romanization in another card,
                    // copy it to our target card
                    if (flashcardId && docSnapshot.id !== flashcardId) {
                        const targetRef = doc(db, "flashcard", flashcardId);
                        await updateDoc(targetRef, {
                            romanization: flashcard.romanization,
                            audioUrl: flashcard.audioUrl
                        });
                    }

                    return {
                        romanization: flashcard.romanization,
                        audioUrl: flashcard.audioUrl,
                        wasGenerated: false,
                        source: 'word_search',
                        foundCardId: docSnapshot.id
                    };
                }
            }
        }

        // Step 2: No existing romanization found, generate new one
        console.log(`Generating new romanization for: ${word}`);
        const {romanization, audioBlob, audioUrl} = createRomanization(word);

        // Store in the specific flashcard if flashcardId is provided
        if (flashcardId) {
            const flashcardRef = doc(db, "flashcard", flashcardId);
            await updateDoc(flashcardRef, {
                romanization: romanization,
                audioUrl: audioUrl
            });
        }

        return {
            romanization,
            audioUrl,
            wasGenerated: true,
            source: 'generated'
        };

    } catch (error) {
        console.error("Error getting/generating romanization:", error);
        return null;
    }
};

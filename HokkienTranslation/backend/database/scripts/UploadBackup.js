import { db } from "../Firebase.js";
import { fetchNumericTones, fetchAudioBlob } from "../../API/TextToSpeechService.js";
import { fetchRomanizer } from "../../API/HokkienHanziRomanizerService.js";
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    getDoc,
    limit,
    updateDoc,
    arrayUnion,
    writeBatch,
  } from "firebase/firestore";
import { uploadAudioFromBlob } from "../Database.js";

async function updateDictionary() {
    const translationsRef = collection(db, 'translation');
    // const translationRef = collection(db, 'sentence');
    const queryRef = query(translationsRef);

    const snapshot = await getDocs(queryRef);

    if (snapshot.empty) {
        console.log("No documents found in the 'translation' collection.");
        return;
    }

    const batch = writeBatch(db);
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const origin = data.hokkienTranslation;
        // const origin = data.sentences[0];

        if (!origin) {
            console.log(`Skipping document ${doc.id} due to missing origin.`);
            continue;
        }

        try {
            // const romanization = await fetchRomanizer(origin);
            const numericTones = await fetchNumericTones(origin);
            const romanization = numericTones;
            const audioBlob = await fetchAudioBlob(numericTones);
            const audioUrl = await uploadAudioFromBlob(numericTones, audioBlob);

            batch.update(doc.ref, { romanization, audioUrl });
            console.log(`${romanization} added for ${data.englishInput}`)
            // console.log(`${romanization} added for ${data.sentences[1]}`)
            count++;

            if (count % 500 === 0) { // Firestore batch limit is 500
                await batch.commit();
                console.log(`${count} documents updated...`);
            }
        } catch (error) {
            console.error(`Error processing document ${doc.id}:`, error);
        }
    }

    if (count % 500 !== 0) {
        await batch.commit();
    }

    console.log(`Update complete. ${count} documents updated.`);
}

updateDictionary().catch(console.error);

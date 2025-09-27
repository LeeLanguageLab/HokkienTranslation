// This file contains 2 scripts for updating exisiting flashcards in the firebase database
// updateFlashcardsFromCSV: Adds romanization and audioUrl to existing flashcards in the database based on a CSV file.
// updateOptionsFromCSV: Updates otherOptions field in existing flashcards in the database based on a CSV file.
// To run, add "type": "module" to the package.json file and run the script using `node AudioDataUpload.js`.

import fs from "fs";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import csvParser from 'csv-parser';
import { db } from "../Firebase.js";
import { uploadAudio } from "../Database.js";
import path from 'path';


async function updateFlashcardsFromCSV() {
  const csvPath = "../../data/generated_flashcards_data_samples.csv";
  fs.createReadStream(csvPath)
    .pipe(csvParser())
    .on('data', async (row) => {
      const { origin, romanization, audioUrl } = row;
      const audioFile = path.basename(audioUrl);

      try {
        // Query Firestore for the document to update
        const flashcardsRef = collection(db, 'flashcard');
        const q = query(flashcardsRef, where('createdBy', '==', 'starter_words'), where('origin', '==', origin));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, 'flashcard', docSnapshot.id);
            const audioDownloadUrl = await uploadAudio(audioFile);
            // Update document with new fields
            await updateDoc(docRef, {
              romanization: romanization,
              audioUrl: audioDownloadUrl, // Replace with uploaded Firebase Storage URL if needed
            });

            console.log(`Updated flashcard: ${origin}`);
          });
        } else {
          console.log(`No flashcard found for origin: ${origin}`);
        }
      } catch (error) {
        console.error(`Error updating flashcard ${origin}:`, error);
      }
    })
    .on('end', () => {
      console.log('CSV processing complete.');
    });
};


async function updateOptionsFromCSV() {
  const csvPath = "../../data/new_flashcard_data_samples.csv";
  const rows = [];

  // Step 1: Read and parse the CSV file into an array
  fs.createReadStream(csvPath)
    .pipe(csvParser())
    .on('data', (row) => {
      rows.push({
        origin: row.origin.trim(),
        destination: row.destination.trim(),
        otherOptions: row.otherOptions.trim().split(',').map(option => option.trim()), // Convert to array of options
        type: row.type.trim(),
      });
    })
    .on('end', async () => {
      console.log('CSV file loaded into memory.');

      // Step 2: Update Firestore with the new `otherOptions`
      for (const currentRow of rows) {
        try {
          // Step 3: Query Firestore for the current origin
          const q = query(
            collection(db, 'flashcard'),
            where('createdBy', '==', 'starter_words'),
            where('origin', '==', currentRow.origin)
          );

          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            console.log(`No matching document found for origin: ${currentRow.origin}`);
            continue;
          }

          // Step 4: Update Firestore with the new `otherOptions`
          for (const docSnapshot of querySnapshot.docs) {
            const docRef = doc(db, 'flashcard', docSnapshot.id);

            await updateDoc(docRef, {
              otherOptions: currentRow.otherOptions, // Directly update with options from the CSV
            });

            console.log(`Updated document ID: ${docSnapshot.id} for origin: ${currentRow.origin}`);
          }
        } catch (error) {
          console.error(`Error processing origin: ${currentRow.origin}`, error);
        }
      }

      console.log('All flashcards updated with new otherOptions.');
      process.exit(0);
    });

}

updateOptionsFromCSV();
// updateFlashcardsFromCSV();
  
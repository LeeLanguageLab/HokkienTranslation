import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import firebase from "./Firebase.js";
import { determineLanguage } from "../BackendUtils.js";
import { fetchTranslation } from "../API/HokkienTranslationToolService.js";

const app = firebase;
const db = getFirestore(app);

// Function to check if user input already in database
export async function checkIfTranslationExists(englishInput, chineseInput) {
  const collectionName = "translation";
  const translationsRef = collection(db, collectionName);
  const qEnglish = query(
    translationsRef,
    where("englishInput", "==", englishInput)
  );
  const qChinese = query(
    translationsRef,
    where("chineseInput", "==", chineseInput)
  );

  try {
    const englishQuerySnapshot = await getDocs(qEnglish);
    const chineseQuerySnapshot = await getDocs(qChinese);
    if (!englishQuerySnapshot.empty) {
      const translationDocument = englishQuerySnapshot.docs[0];
      return translationDocument.data();
    } else if (!chineseQuerySnapshot.empty) {
      const translationDocument = chineseQuerySnapshot.docs[0];
      return translationDocument.data();
    } else {
      // No data in the database
      // console.log(
      //   `No Translation with englishInput: ${englishInput} and chineseInput:${chineseInput}`
      // );
      return null;
    }
  } catch (error) {
    console.error("Error getting Translation: ", error);
    throw error;
  }
}

// Function to check if a sentence exists by its ID
export async function checkIfSentenceExists(sentenceID) {
  const collectionName = "sentence";
  const sentenceRef = doc(db, collectionName, sentenceID);

  try {
    const docSnap = await getDoc(sentenceRef);
    if (docSnap.exists()) {
      // console.log("Sentence Found:");
      // console.log(docSnap.data());
      return docSnap.data();
    } else {
      // No sentence found with the given ID
      // console.log(`No Sentence with ID: ${sentenceID}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting Sentence: ", error);
    throw error;
  }
}

// Return englishInput, chineseInput, and hokkienTranslation
export async function translateToThree(query) {
  const inputLanguage = determineLanguage(query);
  let englishInput = "";
  let chineseInput = "";
  let hokkienTranslation = "";

  if (inputLanguage === "ZH") {
    englishInput = await fetchTranslation(query, "EN");
    englishInput = englishInput
      .toLowerCase()
      .replace(/[^a-z0-9\s,.!?_:"\-]/gi, "");
  } else if (inputLanguage === "EN") {
    englishInput = query;
  }

  const stored = await getStoredHokkienTranslation(query, "translation")
  hokkienTranslation = stored?.hokkienTranslation;
  chineseInput = stored?.chineseInput;

  if (!hokkienTranslation) {
    // console.log("Fetching translation from API");
    chineseInput = await fetchTranslation(query, "ZH");
    hokkienTranslation = await fetchTranslation(query, "HAN");
  }
  // console.log(englishInput, chineseInput, hokkienTranslation);

  return { englishInput, chineseInput, hokkienTranslation };
}

export async function getStoredHokkienFlashcard(prompt, searchBy) {
  // searchBy is "English", "Romanization", "Hokkien", 
  try {
    const flashcardRef = collection(db, 'flashcard');
    // firebase does not allow queries with multiple '!='s
    // so this assumes that if it has audioUrl, it has romanization
    let q;
    if (!prompt) {
      return null;
    }
    if (searchBy === "English") {
      q = query(flashcardRef, 
        where('destination', '==', prompt),
        where("audioUrl", "!=", null)); 
    } else if (searchBy === "Romanization") {
      q = query(flashcardRef, 
        where('romanization', '==', prompt),
        where("audioUrl", "!=", null)); 
    } else {
      q = query(flashcardRef, 
        where('origin', '==', prompt),
        where("audioUrl", "!=", null));
    }
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const flashcard = querySnapshot.docs[0].data();
      const romanization = flashcard.romanization;
      const audioUrl = flashcard.audioUrl;
      const origin = flashcard.origin;
      if (audioUrl && romanization) {
        return { audioUrl, romanization, origin };
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting stored Hokkien: ", error);
    throw error;
  }
}

export async function getStoredHokkienTranslation(prompt, collectionName) {
  // collection is "translation" or "sentence"
  try {
    if (collectionName !== "translation" && collectionName !== "sentence") {
      console.error("Invalid collection name");
      return null;
    }
    
    const flashcardRef = collection(db, collectionName);

    // firebase does not allow queries with multiple '!='s
    // so this assumes that if it has audioUrl, it has romanization
    let q;
    if (!prompt) {
      return null;
    }

    const lang = determineLanguage(prompt);
    
    if (collectionName === "translation" && lang === "EN") {
      q = query(flashcardRef, 
        where('englishInput', '==', prompt),
        where("audioUrl", "!=", null));
    } else if (collectionName === "translation") { // hokkien characters
      q = query(flashcardRef, 
        where('hokkienTranslation', '==', prompt),
        where("audioUrl", "!=", null)); 
    } else {
      q = query(flashcardRef, 
        where('sentences', 'array-contains', prompt),
        where("audioUrl", "!=", null));
    }
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const translation = querySnapshot.docs[0].data();
      // console.log("translation", translation);
      const hokkienTranslation = translation.hokkienTranslation;
      const chineseInput = translation.chineseInput;
      const romanization = translation.romanization;
      const audioUrl = translation.audioUrl;
      if (audioUrl && romanization) {
        return { hokkienTranslation, chineseInput, audioUrl, romanization };
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting stored Hokkien: ", error);
    throw error;
  }
}

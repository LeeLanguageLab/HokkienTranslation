import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { checkIfTranslationExists } from "./DatabaseUtils.js";
import { readFile } from "fs/promises";
import firebase from "./Firebase.js";

// Initialize Firebase
const app = firebase;
const db = getFirestore(app);
const storage = getStorage(app);

// Add Translation data to Firebase
export async function addTranslation(data) {
  const collectionName = "translation";
  const docRef = doc(collection(db, collectionName));
  await setDoc(docRef, {
    englishInput: data.englishInput,
    chineseInput: data.chineseInput,
    hokkienTranslation: data.hokkienTranslation,
    definitions: data.definitions,
    englishDefinitions: data.englishDefinitions,
    sentence: "",
  });
  return docRef.id;
}

// Add Sentence data to Firebase
export async function addSentence(data) {
  const collectionName = "sentence";
  const docRef = doc(collection(db, collectionName));

  await setDoc(docRef, {
    translationList: [],
    sentences: data.sentences,
    imageURL: data.imageURL,
  });
  return docRef.id;
}

// Upload image to google storage
// TODO: Do not upload Image with same Image Path for Excel Reading
export async function uploadImage(filename) {
  const localPath = `../../../data/total_img_125/${filename}`;
  // console.log(localPath);

  try {
    const buffer = await readFile(localPath);
    const imageRef = storageRef(storage, `images/${filename}`);
    const snapshot = await uploadBytes(imageRef, buffer);
    // console.log("Uploaded a blob or file!");

    const imageUrl = await getDownloadURL(snapshot.ref);
    console.log(imageUrl);

    return imageUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Update Translation with Sentence ID
export async function updateTranslationWithSentence(translationId, sentenceId) {
  const translationRef = doc(db, "translation", translationId);
  await updateDoc(translationRef, {
    sentence: sentenceId,
  });
}

// Update Sentence with Translation ID
export async function updateSentenceWithTranslation(
  sentenceId,
  translationList
) {
  const sentenceRef = doc(db, "sentence", sentenceId);
  await updateDoc(sentenceRef, {
    translationList: translationList,
  });
}

// Upload audio to google storage from local file
export async function uploadAudio(filename) {
  const localPath = `../../data/generated_audios/${filename}`;
  // console.log(localPath);

  try {
    const buffer = await readFile(localPath);
    const imageRef = storageRef(storage, `audios/${filename.split('/').pop()}`);
    const snapshot = await uploadBytes(imageRef, buffer);
    // console.log("Uploaded a blob or file!");

    const audioUrl = await getDownloadURL(snapshot.ref);
    console.log(audioUrl);

    return audioUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// same as UploadAudio.js
// Upload audio to google storage from blob
export async function uploadAudioFromBlob(numericTones, audioBlob) {
  try {
      const audioRef = storageRef(storage, `audios/${numericTones}.wav`);
      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const snapshot = await uploadBytes(audioRef, buffer, { contentType: "audio/wav" });
      return await getDownloadURL(snapshot.ref);
  } catch (error) {
      console.error("Error uploading audio:", error);
      throw error;
  }
}
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import firebase from "./Firebase.js";
import { Buffer } from 'buffer';

const app = firebase;
const storage = getStorage(app);

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
import badgesData from './badgesMap.json';
import {collection, doc, writeBatch} from "firebase/firestore";
import { db } from '../database/Firebase.js';

async function uploadBadgesFromJSON() {
  const batch = writeBatch(db);

  Object.entries(badgesData).forEach(([badgeId, badgeData]) => {
    const docRef = doc(collection(db, 'achievements'), badgeId);
    const badge = {
      ...badgeData,
    };
    batch.set(docRef, badge);
  });

  await batch.commit();
  console.log('Badges uploaded successfully');
}

export default uploadBadgesFromJSON

import { useEffect } from 'react';
import {doc, serverTimestamp, setDoc} from 'firebase/firestore';
import { UserCredential } from 'firebase/auth';
import { db } from '../database/Firebase';
import { usePushNotifications } from './usePushNotifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Custom hook that registers for push notifications and stores the token with the user ID
 * @param userCredential Firebase UserCredential object from authentication
 * @returns The Expo push token if successful, undefined otherwise
 */
export function useRegisterAndStoreToken(userCredential: UserCredential) {

  const { expoPushToken } = usePushNotifications();


  useEffect(() => {
    console.log("Expo push token fom register and store token:", expoPushToken);
    console.log("useEffect being called within Register and store token")
    const storeToken = async () => {
      if (!userCredential?.user || !expoPushToken) {
        console.warn("User not authenticated or push token not available");
        return;
      }

      const userId = userCredential.user.uid;
      console.log(`Registering push token for user: ${userId}`);

      try {
        // Store the token in Firestore with the user ID using modular syntax
        await setDoc(doc(db, 'userTokens', userId), {
          expoPushToken: expoPushToken.data,
          lastActive: serverTimestamp(),
          platform: Platform.OS,
          deviceName: Device.modelName || 'Unknown',
          createdAt: serverTimestamp()
        }, { merge: true });

        console.log(`Successfully stored push token for user: ${userId}`);
      } catch (error) {
        console.error('Error storing push token:', error);
      }
    };

    storeToken();
  }, [userCredential, expoPushToken]);

  return expoPushToken;
}

import React, {useEffect} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { doc, updateDoc, increment } from 'firebase/firestore';
import {db, auth} from '../../backend/database/Firebase';

export default function FlashcardFeedback({ route, navigation }) {
  const { isCorrect, origin, destination, contextSentence } = route.params;

    useEffect(() => {
    const updateUserStats = async () => {
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const userRef = doc(db, 'pointsLevelProgress', userId);

        try {
          await updateDoc(userRef, {
            notificationsAnswered: increment(1),
            points: isCorrect ? increment(10) : increment(0),
            correctAnswers: isCorrect ? increment(1) : increment(0)
          });
          console.log('User stats updated successfully');
        } catch (error) {
          console.error('Error updating user stats:', error);
        }
      }
    };

    updateUserStats();
  }, [isCorrect]);

  return (
    <View style={styles.container}>
      <View style={[styles.resultBanner, isCorrect ? styles.correctBanner : styles.incorrectBanner]}>
        <Text style={styles.resultText}>
          {isCorrect ? 'Correct! 🎉' : 'Not quite right 😕'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.originText}>{origin}</Text>
        {contextSentence && (
          <Text style={styles.contextText}>"{contextSentence}"</Text>
        )}
        <View style={styles.separator} />
        <Text style={styles.destinationText}>{destination}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
         onPress={() => navigation.navigate('Main', { screen: 'HomeStack' })}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBanner: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  correctBanner: {
    backgroundColor: '#d4edda',
  },
  incorrectBanner: {
    backgroundColor: '#f8d7da',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  originText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contextText: {
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 15,
  },
  destinationText: {
    fontSize: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#2596be',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

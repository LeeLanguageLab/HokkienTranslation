import React, { useState } from "react";
import { Button, HStack, Text, Spinner } from "native-base";
import { StyleSheet } from "react-native";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  addDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../backend/database/Firebase";
import { generateConversation } from "../../backend/API/GenerateConversation";
import { useTheme } from "../context/ThemeProvider";

export default function GenerateConversationButton({ flashcardListName, onComplete }) {
  const { themes, theme } = useTheme();
  const colors = themes[theme];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPressed, setIsPressed] = useState(false);

  const styles = StyleSheet.create({
    buttonBox: {
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      borderColor: colors.buttonBorder,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 1,
      backgroundColor: colors.primaryContainer,
    },
    buttonBoxPressed: {
      transform: [{ translateY: -2 }],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
      backgroundColor: colors.onPrimaryContainer,
    },
  });

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      // get the flashcard list document
      const listQ = query(
        collection(db, "flashcardList"),
        where("name", "==", flashcardListName),
        limit(1)
      );
      const snap = await getDocs(listQ);
      if (snap.empty) throw new Error(`No flashcard list "${flashcardListName}" found.`);

      const listDoc = snap.docs[0];
      const listRef = listDoc.ref;

      // get cardList
      const cardList = listDoc.data().cardList || [];
      if (!Array.isArray(cardList) || cardList.length === 0) {
        throw new Error("This flashcard list has no flashcards to use in the conversation.");
      }

      // fetch flashcards
      const flashcardCollection = collection(db, "flashcard");
      const flashcardQuery = query(flashcardCollection, where("__name__", "in", cardList));
      const flashcardSnap = await getDocs(flashcardQuery);
      const flashcards = flashcardSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const vocabList = flashcards.map((f) => f.origin || f.destination || "").filter(Boolean);
      const context = listDoc.get("context") || "general topic";

      if (vocabList.length === 0)
        throw new Error("None of the flashcards have usable words for conversation.");

      // generate conversation
      const convoData = await generateConversation(flashcardListName, context, vocabList, flashcardListName);
      // Link backend-generated document to flashcard list
      await updateDoc(listRef, { speakingPracticeDialogues: arrayUnion(convoData.id) });

      if (onComplete) onComplete();
    } catch (err) {
      console.error("Error generating conversation:", err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <HStack alignItems="center" justifyContent="space-between" p={4}>
      <Button
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={handleGenerate}
        borderRadius="21"
        style={isPressed ? [styles.buttonBox, styles.buttonBoxPressed] : styles.buttonBox}
      >
        {loading ? (
          <Spinner color={isPressed ? colors.primaryContainer : colors.onSurface} />
        ) : (
          <Text
            style={{
              fontWeight: "bold",
              color: isPressed ? colors.primaryContainer : colors.onSurface,
            }}
          >
            Generate Conversation
          </Text>
        )}
      </Button>
      {error ? <Text color="red.400" mt={2}>{error}</Text> : null}
    </HStack>
  );
}

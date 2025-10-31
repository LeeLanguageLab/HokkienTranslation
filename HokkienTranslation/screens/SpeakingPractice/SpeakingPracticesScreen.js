import React, { useEffect, useState, useCallback } from "react";
import { FlatList } from "react-native";
import { Box, VStack, HStack, Text, Spinner, Pressable } from "native-base";
import { useTheme } from "../context/ThemeProvider";
import { db } from "../../backend/database/Firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit
} from "firebase/firestore";

export default function SpeakingPracticesScreen({ route, navigation }) {
  const { themes, theme } = useTheme();
  const colors = themes[theme];
  const { flashcardListName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]); // [{id, title, context, dialogueCount}]

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr("");

    try {
      // 1) Find the flashcardList doc by name
      const listQ = query(
        collection(db, "flashcardList"),
        where("name", "==", flashcardListName),
        limit(1)
      );
      const snap = await getDocs(listQ);
      if (snap.empty) {
        throw new Error(`No flashcardList named "${flashcardListName}" found.`);
      }
      const listDoc = snap.docs[0];
      const ids = listDoc.get("speakingPracticeDialogues") || [];

      if (!Array.isArray(ids) || ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // 2) Fetch each dialogue doc
      const results = [];
      for (const id of ids) {
        const ref = doc(db, "speakingPracticeDialogues", id);
        const d = await getDoc(ref);
        if (d.exists()) {
          const data = d.data();
          results.push({
            id: d.id,
            title: data.title || "(Untitled)",
            context: data.context || "",
            dialogueCount: Array.isArray(data.dialogue) ? data.dialogue.length : 0,
          });
        } else {
          // keep placeholder for missing doc
          results.push({
            id,
            title: `(Missing: ${id})`,
            context: "",
            dialogueCount: 0,
          });
        }
      }

      setItems(results);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [flashcardListName]);

  useEffect(() => {
    if (flashcardListName) loadData();
  }, [flashcardListName, loadData]);

  const renderItem = ({ item }) => (
        <Pressable
          onPress={() =>
            navigation.navigate("Dialogue", {
              dialogueId: item.id,
              title: item.title,
            })
          }
        >
      {({ isPressed }) => (
        <Box
          mx={4}
          mb={3}
          p={4}
          borderRadius="xl"
          borderWidth={1}
          borderColor={colors.outline}
          bg={isPressed ? colors.onPrimaryContainer : colors.primaryContainer}
          style={{
            transform: [{ translateY: isPressed ? -2 : 0 }],
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <VStack space={2}>
            <HStack alignItems="center" justifyContent="space-between">
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={isPressed ? colors.primaryContainer : colors.onPrimaryContainer}
              >
                {item.title}
              </Text>
              <Text
                fontSize="xs"
                color={isPressed ? colors.primaryContainer : colors.onSurfaceVariant}
              >
                {item.dialogueCount} lines
              </Text>
            </HStack>

            {!!item.context && (
              <Text
                fontSize="sm"
                color={isPressed ? colors.primaryContainer : colors.onSurface}
              >
                {item.context}
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </Pressable>
  );

  return (
    <Box flex={1} bg={colors.surface} pt={4}>
      <VStack space={3} mx={4} mb={2}>
        <Text fontSize="xl" fontWeight="bold" color={colors.onSurface}>
          Speaking Practice: {flashcardListName || "(none)"}
        </Text>
      </VStack>

      {loading ? (
        <HStack mt={8} justifyContent="center">
          <Spinner color={colors.onPrimaryContainer} />
        </HStack>
      ) : err ? (
        <VStack mx={4} mt={4}>
          <Text color="red.500">Error: {err}</Text>
        </VStack>
      ) : items.length === 0 ? (
        <VStack mx={4} mt={4}>
          <Text color={colors.onSurfaceVariant}>
            No speaking practice dialogues for this deck yet.
          </Text>
        </VStack>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </Box>
  );
}

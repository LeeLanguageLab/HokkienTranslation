import React, { useEffect, useState, useCallback } from "react";
import { FlatList } from "react-native";
import { Box, VStack, HStack, Text, Spinner, Badge, IconButton, Button } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTheme } from "../context/ThemeProvider";
import { db } from "../../backend/database/Firebase";
import { doc, getDoc } from "firebase/firestore";
import AudioPromptRecorder from "../components/AudioPromptRecorder";
import { auth } from "../../backend/database/Firebase"; // if you want user uid


export default function DialogueScreen({ route, navigation }) {
  const { themes, theme } = useTheme();
  const colors = themes[theme];
  const { dialogueId, title } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [context, setContext] = useState("");
  const [lines, setLines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0); // how many lines are currently shown

  const load = useCallback(async () => {
    if (!dialogueId) return;
    setLoading(true);
    setErr("");
    try {
      const ref = doc(db, "speakingPracticeDialogues", dialogueId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error("Dialogue not found.");
      const data = snap.data();

      const arr = Array.isArray(data.dialogue) ? data.dialogue : [];
      const ordered = arr.sort((a, b) => (a._index ?? 0) - (b._index ?? 0));

      setContext(data.context || "");
      setLines(ordered);
      setVisibleCount(ordered.length > 0 ? 1 : 0); // show only first line at start
      navigation.setOptions?.({ title: data.title || title || "Dialogue" });
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [dialogueId, navigation, title]);

  useEffect(() => { load(); }, [load]);

  async function play(url) {
    if (!url) return;
    let sound;
    try {
      const res = await Audio.Sound.createAsync({ uri: url });
      sound = res.sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (s) => {
        if (s.didJustFinish) await sound.unloadAsync();
      });
    } catch (e) {
      console.warn("Audio play error:", e?.message || e);
      if (sound) await sound.unloadAsync();
    }
  }

  const revealNext = async () => {
    if (visibleCount < lines.length) {
      const next = visibleCount + 1;
      setVisibleCount(next);
      // optional: auto-play the newly revealed line
      const newLine = lines[next - 1];
      if (newLine?.audioUrl) play(newLine.audioUrl);
    }
  };

  const restart = () => setVisibleCount(lines.length > 0 ? 1 : 0);

  const renderItem = ({ item, index }) => {
    const speakerLabel = item.speaker?.toUpperCase?.() || "A";
    const isUser = item.speaker === "user" || item.speaker === "B";
    return (
      <Box
        mx={4}
        mb={3}
        p={4}
        borderRadius="xl"
        borderWidth={1}
        borderColor={colors.outline}
        bg={colors.primaryContainer}
      >
        <HStack alignItems="center" justifyContent="space-between" mb={2}>
          <Badge _text={{ fontWeight: "bold" }}>{speakerLabel}</Badge>
          <HStack space={2} alignItems="center">
            <Text fontSize="xs" color={colors.onSurfaceVariant}>
              {index + 1}/{lines.length}
            </Text>
            <IconButton
              size="sm"
              icon={<Ionicons name="volume-high" size={18} color={colors.onPrimaryContainer} />}
              isDisabled={!item.audioUrl}
              onPress={() => play(item.audioUrl)}
            />
          </HStack>
        </HStack>

        {!!item.hokText && (
          <Text fontSize="md" color={colors.onSurface} mb={1}>
            {item.hokText}
          </Text>
        )}
        {!!item.tailoRomanization && (
          <Text fontSize="sm" color={colors.onSurfaceVariant} mb={1}>
            [{item.tailoRomanization}]
          </Text>
        )}
        {!!item.engText && (
          <Text fontSize="sm" color={colors.onSurfaceVariant}>
            {item.engText}
          </Text>
        )}

          {/* Recorder below this line */}
          {(item.speaker === "user" || item.speaker === "B") && (<AudioPromptRecorder
            dialogueId={route.params?.dialogueId}
            lineIndex={index}
            userId={auth?.currentUser?.uid ?? "anon"}
            onSaved={(url) => {
              // optional: store user's attempt in local state or Firestore here
              // console.log("Saved to:", url);
            }}
            onDeleted={() => {
              // optional: react when deleted
            }}
          />)}
      </Box>
    );
  };

  const shown = lines.slice(0, visibleCount);
  const atEnd = visibleCount >= lines.length;

  return (
    <Box flex={1} bg={colors.surface}>
      <VStack space={2} mx={4} my={3}>
        <Text fontSize="xl" fontWeight="bold" color={colors.onSurface}>
          {title || "Dialogue"}
        </Text>
        {!!context && (
          <Text fontSize="sm" color={colors.onSurfaceVariant}>
            {context}
          </Text>
        )}
      </VStack>

      {loading ? (
        <HStack mt={8} justifyContent="center">
          <Spinner color={colors.onPrimaryContainer} />
        </HStack>
      ) : err ? (
        <VStack mx={4} mt={4}>
          <Text color="red.500">Error: {err}</Text>
        </VStack>
      ) : (
        <>
          <FlatList
            data={shown}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            // Optional: tap anywhere in list to reveal next
            onTouchEnd={revealNext}
          />

          <HStack mx={4} mb={4} justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color={colors.onSurfaceVariant}>
              Shown {visibleCount}/{lines.length}
            </Text>

            {atEnd ? (
              <Button
                onPress={restart}
                bg={colors.onPrimaryContainer}
                _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                leftIcon={<Ionicons name="refresh" size={18} color={colors.primaryContainer} />}
              >
                Restart
              </Button>
            ) : (
              <Button
                onPress={revealNext}
                bg={colors.onPrimaryContainer}
                _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                rightIcon={<Ionicons name="chevron-forward" size={18} color={colors.primaryContainer} />}
              >
                Next line
              </Button>
            )}
          </HStack>
        </>
      )}
    </Box>
  );
}

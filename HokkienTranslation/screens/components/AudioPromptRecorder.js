import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Box, HStack, VStack, Text, Button, Spinner, Alert } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTheme } from "../context/ThemeProvider";
import { compareTailo } from "../../utils/tailo"; // <-- your existing util

function normalizeTailo(s = "") {
  // Light normalization so spacing/punctuation don’t derail comparison
  return String(s)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[，。,.!?！？]/g, " ") // unify punctuation → space
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function preprocessTranscript(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/-/g, " ")                 // convert hyphens to space
    .replace(/[.,!?;:，。！？；：]/g, " ") // punctuation → space
    .replace(/\s+/g, " ")               // collapse multiple spaces
    .trim();                            // trim edges
}


/**
 * Props:
 * - serverUrl: string (FastAPI /transcribe endpoint)
 * - targetTailo: string (e.g., item.tailoRomanization)
 * - onSaved?: (uri) => void
 * - onDeleted?: () => void
 */
export default function AudioPromptRecorder({
  serverUrl = "http://127.0.0.1:8000/transcribe",
  targetTailo = "",
  onSaved,
  onDeleted,
}) {
  const { themes, theme } = useTheme();
  const colors = themes[theme];

  const [permission, setPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [localUri, setLocalUri] = useState("");
  const [busy, setBusy] = useState(false);

  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [compareResult, setCompareResult] = useState(null);

  const soundRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermission(status === "granted");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    })();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    if (!permission) return;
    try {
      if (recording) {
        await recording.stopAndUnloadAsync().catch(() => {});
        setRecording(null);
      }
      const rec = new Audio.Recording();
      const options = Audio.RecordingOptionsPresets.HIGH_QUALITY; // .m4a (AAC)
      await rec.prepareToRecordAsync(options);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setTranscript("");
      setElapsed(null);
      setErrorMsg("");
      setCompareResult(null);
    } catch (e) {
      console.warn("startRecording error:", e?.message || e);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setBusy(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI() || "";
      setLocalUri(uri);
      setRecording(null);
      setIsRecording(false);
      onSaved && onSaved(uri);
      console.log("Local recording URI:", uri);
    } catch (e) {
      console.warn("stopRecording error:", e?.message || e);
    } finally {
      setBusy(false);
    }
  };

  const playLocal = async () => {
    if (!localUri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: localUri });
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (s) => {
        if (s.didJustFinish) {
          await sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.warn("playLocal error:", e?.message || e);
    }
  };

  const clearLocal = async () => {
    try {
      setBusy(true);
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setLocalUri("");
      setTranscript("");
      setElapsed(null);
      setErrorMsg("");
      setCompareResult(null);
      onDeleted && onDeleted();
    } finally {
      setBusy(false);
    }
  };

  const doCompare = (hyp) => {
    if (!targetTailo) return setCompareResult(null);
    const userNorm = normalizeTailo(hyp);
    const tgtNorm = normalizeTailo(targetTailo);
    try {
      const res = compareTailo(userNorm, tgtNorm);
      setCompareResult(res);
    } catch (e) {
      console.warn("compareTailo error:", e?.message || e);
      setCompareResult(null);
    }
  };

  const transcribe = async () => {
    if (!localUri) return;
    setTranscribing(true);
    setErrorMsg("");
    setCompareResult(null);
    try {
      const form = new FormData();

      if (Platform.OS === "web") {
        // blob: URL → Blob
        const resp = await fetch(localUri);
        const blob = await resp.blob();
        form.append("file", blob, "recording.m4a");
      } else {
        form.append("file", {
          uri: localUri.startsWith("file://") ? localUri : `file://${localUri}`,
          name: "recording.m4a",
          type: "audio/mp4",
        });
      }

      const res = await fetch(serverUrl, { method: "POST", body: form });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
      }

      const data = await res.json();

      setElapsed(typeof data.elapsed_sec === "number" ? data.elapsed_sec : null);
      let hyp = typeof data.text === "string" ? data.text : "";
      hyp = preprocessTranscript(hyp);
      setTranscript(hyp);
      doCompare(hyp);
    } catch (e) {
      const msg =
        e && e.name === "AbortError" ? "Request timed out" : (e && e.message) || String(e);
      setErrorMsg(msg);
      console.warn("transcribe error:", msg);
    } finally {
      setTranscribing(false);
    }
  };

  const showRecordControls = !localUri;

  // color mapping like TailoCompareTest
  const colorForStatus = (status) => {
    return status === "correct"
      ? "#166534" // green-800
      : status === "tone-mismatch"
      ? "#854d0e" // amber-800
      : status === "missing"
      ? "#374151" // gray-700
      : status === "extra"
      ? "#6b21a8" // purple-800
      : "#991b1b"; // red-800
  };

  return (
    <Box mt={2} p={3} borderWidth={1} borderColor={colors.outline} borderRadius="lg" bg={colors.surface}>
      <VStack space={3}>
        <Text fontSize="sm" color={colors.onSurfaceVariant}>
          Your attempt (record → transcribe → feedback vs target):
        </Text>

        {showRecordControls ? (
          <HStack space={3} alignItems="center">
            <Button
              bg={isRecording ? "red.500" : colors.onPrimaryContainer}
              _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
              onPress={isRecording ? stopRecording : startRecording}
              leftIcon={
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={18}
                  color={colors.primaryContainer}
                />
              }
              isDisabled={permission === false || busy}
            >
              {isRecording ? "Stop" : "Record"}
            </Button>
            <Text fontSize="xs" color={colors.onSurfaceVariant}>
              {permission === false
                ? "Microphone permission denied"
                : isRecording
                ? "Recording…"
                : "Tap to start"}
            </Text>
            {busy ? <Spinner size="sm" color={colors.onPrimaryContainer} /> : null}
          </HStack>
        ) : (
          <>
            <HStack space={3} alignItems="center" flexWrap="wrap">
              <Button
                bg={colors.onPrimaryContainer}
                _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                onPress={playLocal}
                leftIcon={<Ionicons name="play" size={18} color={colors.primaryContainer} />}
                isDisabled={busy}
              >
                Play
              </Button>

              <Button
                bg={colors.onPrimaryContainer}
                _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                onPress={transcribe}
                isDisabled={busy || transcribing}
                leftIcon={
                  transcribing
                    ? undefined
                    : <Ionicons name="cloud-upload" size={18} color={colors.primaryContainer} />
                }
              >
                {transcribing ? <Spinner color={colors.primaryContainer} /> : "Transcribe"}
              </Button>

              <Button
                onPress={clearLocal}
                isDisabled={busy || transcribing}
                bg="muted.600"
                _text={{ color: "white" }}
                leftIcon={<Ionicons name="close" size={18} color="white" />}
              >
                Exit
              </Button>
            </HStack>

            <Text fontSize="xs" color={colors.onSurfaceVariant} selectable>
              URI: {localUri}
            </Text>
          </>
        )}

        {errorMsg ? (
          <Alert status="error" borderRadius="md" bg="error.100">
            <Text color="error.700" fontSize="xs">{errorMsg}</Text>
          </Alert>
        ) : null}

        {/* Transcript + timing */}
        {transcript ? (
          <VStack space={1} p={2} borderWidth={1} borderColor={colors.outline} borderRadius="md">
            <Text fontWeight="bold" color={colors.onSurface}>Transcript</Text>
            <Text color={colors.onSurfaceVariant}>{transcript}</Text>
            {elapsed != null ? (
              <Text mt={1} fontSize="xs" color={colors.onSurfaceVariant}>
                Model time: {elapsed}s
              </Text>
            ) : null}
          </VStack>
        ) : null}

        {/* Tailo comparison block (matches TailoCompareTest style) */}
        {compareResult ? (
          <VStack space={1} mt={1} p={2} borderWidth={1} borderColor={colors.outline} borderRadius="md">
            <Text style={{ fontWeight: "700", color: colors.onSurface }}>
              Overall: {(compareResult.overall * 100).toFixed(1)}%
            </Text>

            <Text style={{ fontWeight: "700", color: colors.onSurface, marginTop: 6 }}>
              Feedback
            </Text>

            {compareResult.items.map((it) => (
              <Text
                key={it.index}
                style={{
                  color: colorForStatus(it.status),
                  marginBottom: 4,
                  fontFamily: "monospace",
                }}
              >
                {(it.target || "∅") + "  →  " + (it.user ?? "∅") + "  —  " + it.message}
              </Text>
            ))}
          </VStack>
        ) : null}
      </VStack>
    </Box>
  );
}

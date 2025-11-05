// screens/components/AudioPromptRecorder.js
import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Box, HStack, VStack, Text, Button, Spinner, Alert } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useTheme } from "../context/ThemeProvider";

export default function AudioPromptRecorder({
  serverUrl = "http://127.0.0.1:8000/transcribe",
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
      const options = Audio.RecordingOptionsPresets.HIGH_QUALITY; // .m4a AAC
      await rec.prepareToRecordAsync(options);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setTranscript("");
      setElapsed(null);
      setErrorMsg("");
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
      onDeleted && onDeleted();
    } finally {
      setBusy(false);
    }
  };

    const transcribe = async () => {
      if (!localUri) return;
      setTranscribing(true);
      setErrorMsg("");

      try {
        const form = new FormData();

        if (Platform.OS === "web") {
          // Convert blob: URL → Blob data
          const resp = await fetch(localUri);
          const blob = await resp.blob();

          // Important: tell the backend the filename + correct mime type
          form.append("file", blob, "recording.m4a");
        } else {
          // iOS / Android local file uri
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
        setTranscript(data.text || "");
        setElapsed(data.elapsed_sec ?? null);
      } catch (e) {
        setErrorMsg(e?.message || String(e));
      } finally {
        setTranscribing(false);
      }
    };


  const showRecordControls = !localUri;

  return (
    <Box mt={2} p={3} borderWidth={1} borderColor={colors.outline} borderRadius="lg" bg={colors.surface}>
      <VStack space={3}>
        <Text fontSize="sm" color={colors.onSurfaceVariant}>
          Your attempt:
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

        {transcript ? (
          <VStack space={1} mt={1} p={2} borderWidth={1} borderColor={colors.outline} borderRadius="md">
            <Text fontWeight="bold" color={colors.onSurface}>Transcript</Text>
            <Text color={colors.onSurfaceVariant}>{transcript}</Text>
            {elapsed != null ? (
              <Text mt={1} fontSize="xs" color={colors.onSurfaceVariant}>
                Model time: {elapsed}s
              </Text>
            ) : null}
          </VStack>
        ) : null}
      </VStack>
    </Box>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { Box, HStack, VStack, Text, Button, IconButton, Spinner } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useTheme } from "../context/ThemeProvider";

// NOTE: Expo Recording saves .m4a (AAC). Expo cannot natively encode WAV.
// If you strictly need WAV, convert in a backend (Cloud Function) after upload.
// Here we upload .m4a and set the correct contentType.

export default function AudioPromptRecorder({
  dialogueId,
  lineIndex,
  userId = "anon",          // pass current user uid if available
  onSaved,                  // (url) => void
  onDeleted,                // () => void
  storageFolder = "userRecordings" // change if you want a different folder
}) {
  const { themes, theme } = useTheme();
  const colors = themes[theme];

  const [permission, setPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [localUri, setLocalUri] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const soundRef = useRef(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermission(status === "granted");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false
      });
    })();

    // cleanup sound if unmounted
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    if (!permission) return;

    try {
      // Ensure any previous recording is cleaned up
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }

      const rec = new Audio.Recording();
      const options = Audio.RecordingOptionsPresets.HIGH_QUALITY; // m4a AAC
      await rec.prepareToRecordAsync(options);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      console.warn("startRecording error:", e?.message || e);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setLocalUri(uri || "");
      setRecording(null);
      setIsRecording(false);
    } catch (e) {
      console.warn("stopRecording error:", e?.message || e);
    }
  };

  const playLocal = async () => {
    if (!localUri && !downloadUrl) return;
    const uri = localUri || downloadUrl;

    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
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

  const upload = async () => {
    if (!localUri) return;
    setUploading(true);
    try {
      const resp = await fetch(localUri);
      const blob = await resp.blob();

      const storage = getStorage();
      const ts = Date.now();
      const fileName = `d${dialogueId || "na"}-i${lineIndex}-u${userId}-${ts}.m4a`;
      const path = `${storageFolder}/${fileName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, blob, { contentType: "audio/mp4" }); // m4a = audio/mp4
      const url = await getDownloadURL(storageRef);
      setDownloadUrl(url);
      onSaved?.(url);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setUploading(false);
    }
  };

  const deleteUploaded = async () => {
    if (!downloadUrl) {
      onDeleted?.();
      setLocalUri("");
      return;
    }
    setDeleting(true);
    try {
      // extract the path from the downloadUrl
      // URL form: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?alt=media&token=...
      const match = downloadUrl.match(/\/o\/([^?]+)/);
      const encodedPath = match ? match[1] : "";
      const filePath = decodeURIComponent(encodedPath);

      const storage = getStorage();
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      setDownloadUrl("");
      setLocalUri("");
      onDeleted?.();
    } catch (e) {
      console.error("Delete failed:", e);
    } finally {
      setDeleting(false);
    }
  };

  const showRecordControls = !localUri && !downloadUrl;

  return (
    <Box mt={2} p={3} borderWidth={1} borderColor={colors.outline} borderRadius="lg" bg={colors.surface}>
      <VStack space={2}>
        <Text fontSize="sm" color={colors.onSurfaceVariant}>
          Your attempt (records locally, uploads to cloud):
        </Text>

        {showRecordControls ? (
          <HStack space={3} alignItems="center">
            <Button
              bg={isRecording ? "red.500" : colors.onPrimaryContainer}
              _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
              onPress={isRecording ? stopRecording : startRecording}
              leftIcon={<Ionicons name={isRecording ? "stop" : "mic"} size={18} color={colors.primaryContainer} />}
            >
              {isRecording ? "Stop" : "Record"}
            </Button>
            <Text fontSize="xs" color={colors.onSurfaceVariant}>
              {isRecording ? "Recording…" : "Tap to start"}
            </Text>
          </HStack>
        ) : (
          <>
            <HStack space={3} alignItems="center">
              <Button
                bg={colors.onPrimaryContainer}
                _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                onPress={playLocal}
                leftIcon={<Ionicons name="play" size={18} color={colors.primaryContainer} />}
              >
                Play
              </Button>

              {!downloadUrl ? (
                <Button
                  onPress={upload}
                  isDisabled={uploading}
                  bg={colors.onPrimaryContainer}
                  _text={{ color: colors.primaryContainer, fontWeight: "bold" }}
                  leftIcon={
                    uploading ? undefined : <Ionicons name="cloud-upload" size={18} color={colors.primaryContainer} />
                  }
                >
                  {uploading ? <Spinner color={colors.primaryContainer} /> : "Upload"}
                </Button>
              ) : (
                <HStack space={2} alignItems="center">
                  <Ionicons name="cloud-done" size={18} color={colors.onPrimaryContainer} />
                  <Text fontSize="xs" color={colors.onSurfaceVariant}>Uploaded</Text>
                </HStack>
              )}

              <Button
                onPress={deleteUploaded}
                isDisabled={deleting}
                bg="muted.600"
                _text={{ color: "white" }}
                leftIcon={<Ionicons name="close" size={18} color="white" />}
              >
                {deleting ? "Deleting…" : "Exit"}
              </Button>
            </HStack>

            {downloadUrl ? (
              <Text fontSize="xs" color={colors.onSurfaceVariant} numberOfLines={1}>
                {downloadUrl}
              </Text>
            ) : localUri ? (
              <Text fontSize="xs" color={colors.onSurfaceVariant}>
                Local file ready to upload
              </Text>
            ) : null}
          </>
        )}
      </VStack>
    </Box>
  );
}

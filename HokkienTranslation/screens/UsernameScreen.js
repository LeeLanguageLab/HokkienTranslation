import React, { useState, useEffect } from "react";
import { Box, Input, Button, Text, VStack } from "native-base";
import { auth } from "../backend/database/Firebase"; // adjust if needed
import { updateProfile } from "firebase/auth";

export default function UsernameScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser?.displayName) {
      setUsername(currentUser.displayName);
      setHasUsername(true);
    }
  }, []);

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateProfile(currentUser, { displayName: username });
      console.log("Username updated to:", username);
      navigation.replace("Main"); // Jump to Main tab navigator
    }
  };

  return (
    <Box flex={1} justifyContent="center" alignItems="center" px={4}>
      <VStack space={4} alignItems="center">
        {hasUsername ? (
          <Text fontSize="xl" textAlign="center">
            Your current username is:{" "}
            <Text bold color="blue.500">{username}</Text>
          </Text>
        ) : (
          <>
            <Text fontSize="xl" textAlign="center">
              You don’t have a username yet.
            </Text>
            <Text fontSize="md" textAlign="center" color="gray.500">
              Please set one — it will be shown on the leaderboard!
            </Text>
          </>
        )}

        <Input
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          w="80%"
        />

        <Button
          onPress={handleSave}
          isDisabled={!username.trim()}
          w="80%"
        >
          {hasUsername ? "Update Username" : "Set Username"}
        </Button>
      </VStack>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import { Box, Input, Button, Text, VStack } from "native-base";
import { auth } from "../backend/database/Firebase";
import { updateProfile } from "firebase/auth";
import { useTheme } from "./context/ThemeProvider"; 

export default function UsernameScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [hasUsername, setHasUsername] = useState(false);
  const { theme, themes, toggleTheme } = useTheme(); 

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
      navigation.replace("Main");
    }
  };

  const colors = themes[theme]; // Select colors based on the current theme

  return (
    <Box flex={1} justifyContent="center" alignItems="center" px={4} bg={colors.surface}>
      <VStack space={4} alignItems="center">
        {hasUsername ? (
          <Text fontSize="xl" textAlign="center" color={colors.onSurface}>
            Your current username is:{" "}
            <Text bold color={colors.bold}>{username}</Text>
          </Text>
        ) : (
          <>
            <Text fontSize="xl" textAlign="center" color={colors.onSurface}>
              You don’t have a username yet.
            </Text>
            <Text fontSize="md" textAlign="center" color={colors.onSurfaceVariant}>
              Please set one — it will be shown on the leaderboard!
            </Text>
          </>
        )}

        <Input
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          w="80%"
          bg={colors.primaryContainer}
          color={colors.onPrimaryContainer}
          borderColor={colors.buttonBorder}
        />

        <Button
          onPress={handleSave}
          isDisabled={!username.trim()}
          w="80%"
          bg={colors.categoriesButton}
          _text={{ color: colors.onSurface }}
        >
          {hasUsername ? "Update Username" : "Set Username"}
        </Button>
      </VStack>
    </Box>
  );
}

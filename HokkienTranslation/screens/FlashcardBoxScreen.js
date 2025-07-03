import React, { useState, useEffect } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { VStack, Text, Box } from "native-base";
import { useTheme } from "./context/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { getFlashcardsByBox } from "../backend/database/LeitnerSystemHelpers";
import getCurrentUser from "../backend/database/GetCurrentUser";

const FlashcardBoxScreen = ({ route, navigation }) => {
  const { theme, themes } = useTheme();
  const colors = themes[theme];
  const { boxNum } = route.params;
  const [flashcards, setFlashcards] = useState([]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const user = await getCurrentUser();
        const userEmail = user;
        const fetchedFlashcards = await getFlashcardsByBox(userEmail, boxNum);
        setFlashcards(fetchedFlashcards);
      } catch (error) {
        console.log("Error fetching flashcards: ", error);
      }
    };

    fetchFlashcards();
  }, [boxNum]);

  // Override back button to use Ionicons arrow-back
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("Settings")}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back-sharp" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <VStack space={3} p={5} bg={colors.surface}>
        <Text fontSize="2xl" fontWeight="bold" color={colors.onSurface}>
          Flashcards in Box {boxNum}
        </Text>
        
        {flashcards.length > 0 ? (
          flashcards.map((flashcard, index) => (
            <Box key={index} p={3} bg={colors.primaryContainer} borderRadius="lg">
              <Text fontSize="lg" color={colors.onSurface}>
                {flashcard.origin} → {flashcard.destination}
              </Text>
            </Box>
          ))
        ) : (
          <Text fontSize="md" color={colors.onSurface}>No flashcards found.</Text>
        )}
      </VStack>
    </ScrollView>
  );
};

export default FlashcardBoxScreen;

import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Pressable, ScrollView} from "react-native";
import { Switch, HStack, VStack, Text, Button, Box } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./context/ThemeProvider";
import { useLanguage } from "./context/LanguageProvider";
import { useComponentVisibility } from "./context/ComponentVisibilityContext";
import SignOut from "./Signout"; // Adjust the path if necessary
import { SelectList } from "react-native-dropdown-select-list";
import { countBox1Flashcards, countBox2Flashcards, countBox3Flashcards } from "../backend/database/LeitnerSystemHelpers.js";
import getCurrentUser from "../backend/database/GetCurrentUser";
import { count } from "firebase/firestore";
import { useBreakpointValue } from "native-base";

const SettingsScreen = () => {
  const { theme, toggleTheme, themes } = useTheme();
  const colors = themes[theme];
  const {
    visibilityStates,
    toggleVisibility,
    flashcardVisibilityStates,
    toggleFlashcardVisibility
  } = useComponentVisibility();
    const { languages, setLanguages, toggleLanguages } = useLanguage();
  const navigation = useNavigation();
  const [errorMessage, setErrorMessage] = useState("");
  const [box1Flashcards, setBox1Flashcards] = useState(null);
  const [box2Flashcards, setBox2Flashcards] = useState(null);
  const [box3Flashcards, setBox3Flashcards] = useState(null);

  const fetchBoxesFlashcards = async () => {
    try {
      const user = await getCurrentUser();
      const userEmail = user;
      const box1 = await countBox1Flashcards(userEmail);
      const box2 = await countBox2Flashcards(userEmail);
      const box3 = await countBox3Flashcards(userEmail);
      setBox1Flashcards(box1);
      setBox2Flashcards(box2);
      setBox3Flashcards(box3);
    } catch (error) {
      console.log("error fetching boxes flashcards: ", error);
    }
  };

  useEffect(() => {
    if (languages[0] === languages[1]) {
      setErrorMessage("The selected languages must be different.");
    } else {
      setErrorMessage("");
    }
  }, [languages]);

  useFocusEffect(
    useCallback(() => {
      fetchBoxesFlashcards();
    }, [])
  );

  const languageList = [
    { key: "Hokkien", value: "Hokkien" },
    // { key: "Arabic", value: "Arabic" },
    // { key: "Chinese (Simplified)", value: "Chinese (Simplified)" },
    //  { key: "Chinese (Traditional)", value: "Chinese (Traditional)" },
    // { key: "Czech", value: "Czech" },
    // { key: "Danish", value: "Danish" },
    // { key: "Dutch", value: "Dutch" },
    { key: "English", value: "English" },
    // { key: "French", value: "French" },
    // { key: "German", value: "German" },
    // { key: "Greek", value: "Greek" },
    // { key: "Hindi", value: "Hindi" },
    // { key: "Indonesian", value: "Indonesian" },
    //  { key: "Italian", value: "Italian" },
    //   { key: "Japanese", value: "Japanese" },
    // { key: "Korean", value: "Korean" },
    // { key: "Polish", value: "Polish" },
    // { key: "Portuguese", value: "Portuguese" },
    // { key: "Russian", value: "Russian" },
    //{ key: "Spanish", value: "Spanish" },
    // { key: "Turkish", value: "Turkish" },
    // { key: "Vietnamese", value: "Vietnamese" },
  ];

  const stackDirection = useBreakpointValue({
    base: "column",
    md: "row",
  });

  const ThemeOption = ({ themeName, iconName }) => (
    <Pressable onPress={toggleTheme} hitSlop={10}>
      <HStack space={2} alignItems="center">
        <Ionicons name={iconName} size={24} color={colors.onPrimaryContainer} />
        <Text style={{ fontSize: 16, color: colors.onSurface }}>
          {themeName}
        </Text>
      </HStack>
    </Pressable>
  );

  const LanguageOption = ({ language, iconName }) => (
    <Pressable onPress={toggleLanguages} hitSlop={10}>
      <HStack space={2} alignItems="center">
        <Ionicons name={iconName} size={24} color={colors.onPrimaryContainer} />
        <Text style={{ fontSize: 16, color: colors.onSurface }}>
          {language}
        </Text>
      </HStack>
    </Pressable>
  );

  const VisibilityToggle = ({ label, stateKey }) => (
    <HStack
      p={3}
      bg={colors.primaryContainer}
      borderRadius="lg"
      justifyContent="space-between"
      alignItems={"center"}
    >
      <Text fontSize="md" color={colors.onSurface}>
        {label}
      </Text>
      <Switch
        isChecked={visibilityStates[stateKey]}
        onToggle={() => toggleVisibility(stateKey)}
        onTrackColor={colors.onPrimaryContainer}
        offTrackColor={colors.light}
        onThumbColor={colors.primaryContainer}
        offThumbColor={colors.dark}
      />
    </HStack>
  );

  const FlashcardVisibilityToggle = ({ label, stateKey }) => (
    <HStack
      p={3}
      bg={colors.primaryContainer}
      borderRadius="lg"
      justifyContent="space-between"
      alignItems={"center"}
    >
      <Text fontSize="md" color={colors.onSurface}>
        {label}
      </Text>
      <Switch
        isChecked={flashcardVisibilityStates[stateKey]}
        onToggle={() => toggleFlashcardVisibility(stateKey)}
        onTrackColor={colors.onPrimaryContainer}
        offTrackColor={colors.light}
        onThumbColor={colors.primaryContainer}
        offThumbColor={colors.dark}
      />
    </HStack>
  );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <VStack
        style={{
          flex: 1,
          width: "100%",
          minWidth: 300,
          alignItems: "flex-start",
          backgroundColor: colors.surface,
          padding: 20,
        }}
      >
        {/* Leitner Box Flashcards Info */}
        <VStack space={2} w="90%" alignSelf="center" mb={4} p={3} bg={colors.primaryContainer} borderRadius="lg">
          <Text fontSize="lg" fontWeight="bold" color={colors.onSurface}>Your Flashcard Learning Progress</Text>

          <Pressable onPress={() => navigation.navigate("FlashcardBox", { boxNum: 1 })}>
            <Text fontSize="lg" color={colors.onSurface}> Box 1 (Unfamiliar): {box1Flashcards ?? "Loading..."}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("FlashcardBox", { boxNum: 2 })}>
            <Text fontSize="lg" color={colors.onSurface}> Box 2 (Familiar): {box2Flashcards ?? "Loading..."}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("FlashcardBox", { boxNum: 3 })}>
            <Text fontSize="lg" color={colors.onSurface}> Box 3 (Mastered): {box3Flashcards ?? "Loading..."}</Text>
          </Pressable>
        </VStack>

        <VStack space={4} w="90%" alignSelf="center">
          {/* Appearance section */}
          <VStack space={2}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.onSurface,
              }}
            >
              Theme
            </Text>

            <VStack space={2} alignItems="start">
              <ThemeOption
                themeName="Light"
                iconName={
                  theme === "light" ? "radio-button-on" : "radio-button-off"
                }
              />
              <ThemeOption
                themeName="Dark"
                iconName={
                  theme === "dark" ? "radio-button-on" : "radio-button-off"
                }
              />
            </VStack>
          </VStack>

          {/* Models section */}
          <VStack space={2} >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.onSurface,
              }}
            >
              Home Display Preferences
            </Text>
            <VisibilityToggle label="Image" stateKey="image" />
            <VisibilityToggle label="Definition" stateKey="definition" />
            <VisibilityToggle label="English Definition" stateKey="englishDefinition" />
            <VisibilityToggle label="Hokkien Sentence" stateKey="hokkienSentence" />
            <VisibilityToggle label="English Sentence" stateKey="englishSentence" />
            <VisibilityToggle label="Pronunciation" stateKey="textToSpeech" />
          </VStack>

          {/* Language section */}
           <VStack space={2}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.onSurface,
              }}
            >
              Flashcard Display Preferences
            </Text>
            <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                  color: colors.onSurface,
                }}
              >
                Front Card Language
            </Text>
            <VStack space={2} alignItems="start">
              <LanguageOption
                language="Hokkien"
                iconName={
                  languages[0] === "Hokkien" ? "radio-button-on" : "radio-button-off"
                }
              />
              <LanguageOption
                language="English"
                iconName={
                  languages[0] === "English" ? "radio-button-on" : "radio-button-off"
                }
              />
            </VStack>
            {/* <HStack space={2} flexDirection={stackDirection}>
              <Box
                flex={1}
                bg={colors.primaryContainer}
                borderRadius="10px"
                p={4}
                my={2}
                minWidth={300}
              >
                <HStack space={2} alignItems="center">
                  <Text
                    color={colors.onSurface}
                    style={{ marginRight: 10, fontSize: 16 }}
                  >
                    Front Card Language:
                  </Text>
                  <SelectList
                    setSelected={(key) => setLanguages([key, languages[1]])}
                    data={languageList}
                    save="key"
                    defaultOption={{ key: "Hokkien", value: "Hokkien" }}
                    boxStyles={{ backgroundColor: colors.primaryContainer }}
                    dropdownTextStyles={{ color: colors.onSurface }}
                    inputStyles={{ color: colors.onSurface }}
                  />
                </HStack>
              </Box>
              <Box
                flex={1}
                bg={colors.primaryContainer}
                borderRadius="10px"
                p={4}
                minWidth={300}
              >
                <HStack space={2} alignItems="center">
                  <Text
                    color={colors.onSurface}
                    style={{ marginRight: 10, fontSize: 16 }}
                  >
                    Back Card Language:
                  </Text>
                  <SelectList
                    setSelected={(key) => setLanguages([languages[0], key])}
                    data={languageList}
                    save="key"
                    defaultOption={{ key: "English", value: "English" }}
                    boxStyles={{ backgroundColor: colors.primaryContainer }}
                    dropdownTextStyles={{ color: colors.onSurface }}
                    inputStyles={{ color: colors.onSurface }}
                  />
                </HStack>
                {errorMessage ? (
                  <Text style={{ color: "red" }}>{errorMessage}</Text>
                ) : null}
              </Box>
            </HStack> */}
            {/* flashcard screen visibility */}
            <VStack space={2}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "bold",
                  color: colors.onSurface,
                }}
              >
                Display Options
              </Text>
              <FlashcardVisibilityToggle label="Image" stateKey="image" />
              {/* <FlashcardVisibilityToggle label="Definition" stateKey="definition" /> */}
              {/* <FlashcardVisibilityToggle label="English Definition" stateKey="englishDefinition" /> */}
              <FlashcardVisibilityToggle label="Hokkien Sentence" stateKey="hokkienSentence" />
              <FlashcardVisibilityToggle label="English Sentence" stateKey="englishSentence" />
              <FlashcardVisibilityToggle label="Pronunciation" stateKey="textToSpeech" />
            </VStack>
          </VStack>

          {/* Sign Out section */}
          <SignOut />
        </VStack>
      </VStack>
    </ScrollView>
  );
};

export default SettingsScreen;

import React, { useEffect, useState } from "react";
import { Modal, Button, Text, HStack, Select } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeProvider";
import { doc, setDoc, collection, getDocs, query, serverTimestamp, where,
            updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../backend/database/Firebase";
import getCurrentUser from "../../backend/database/GetCurrentUser";
import { fetchAudioUrl, fetchNumericTones } from "../../backend/API/TextToSpeechService";
import { generateOptions } from "../../backend/API/GenerateOptions";

async function getCategories(db) {
    const categoryCol = collection(db, "category");
    const categorySnapshot = await getDocs(categoryCol);

    const categoryList = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    return categoryList;
}

async function getFlashcardLists(db, currentUser, selectedCategoryId) {
    const flashcardCol = collection(db, "flashcardList");
    let q;
    
    if (selectedCategoryId) {
        q = query(
            flashcardCol,
            where("categoryId", "==", selectedCategoryId),
            where("createdBy", "==", currentUser)
        );
    } else {
        q = query(flashcardCol, where("createdBy", "==", currentUser));
    }

    const flashcardSnapshot = await getDocs(q);

    const flashcardList = flashcardSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }));

    // Filter out decks that don't belong to the user and aren't shared
    return flashcardList.filter(deck => 
        deck.createdBy === currentUser || deck.shared
    );
}

export default function DictToFlashcardModal({
  isOpen,
  onClose,
  hokkien,
  english,
  romanization,
  audioUrl,
  contextSentence,
  downloadUrl,
}) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [flashcardLists, setFlashcardLists] = useState([]);
  const [selectedFlashcardList, setSelectedFlashcardList] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);  

  const { theme, themes } = useTheme();
  const colors = themes[theme];
  
  const fetchUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error fetching user: ", error);
    }
};

  useEffect(() => {
    const fetchCategories = async () => {
        await fetchUser();
        setIsLoading(true);
        const fetchedCategories = await getCategories(db);
        setCategories(fetchedCategories);
        setIsLoading(false);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFlashcardLists = async () => {
      if (currentUser && selectedCategory) {
        setIsLoading(true);
        const fetchedFlashcardLists = await getFlashcardLists(db, currentUser, selectedCategory);
        setFlashcardLists(fetchedFlashcardLists);
        setIsLoading(false);
      } else {
        setFlashcardLists([]);
        setSelectedFlashcardList("");
      }
    };

    fetchFlashcardLists();
  }, [currentUser, selectedCategory]);

  const handleSave = async () => {
    if (!selectedFlashcardList) return;

    const option1 = await generateOptions(english);
    const currentWords = `${english}, ${option1}`;
    const option2 = await generateOptions(currentWords);
    const currentWords2 = `${currentWords}, ${option2}`;
    const option3 = await generateOptions(currentWords2);

    if (romanization == null) {
        romanization = await fetchNumericTones(hokkien);
    }

    if (audioUrl == null) {
        audioUrl = await fetchAudioUrl(romanization);
    }

    const newFlashcardData = {
        origin: hokkien,
        destination: english,
        otherOptions: [option1, option2, option3],
        type: "word",
        categoryId: selectedCategory,
        createdAt: serverTimestamp(),
        createdBy: currentUser,
        romanization: romanization,
        audioUrl: audioUrl || null,
        contextSentence: contextSentence || " ",
        downloadURL: downloadUrl || null,
    };

    const flashcardRef = doc(collection(db, "flashcard"));
    await setDoc(flashcardRef, newFlashcardData);
    const newFlashcardID = flashcardRef.id;

    const flashcardListRef = doc(db, "flashcardList", selectedFlashcardList);
    await updateDoc(flashcardListRef, {
    cardList: arrayUnion(newFlashcardID),
    });

    console.log("New flashcard ID added to cardList in flashcardList document");
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content maxWidth="400px" minWidth="300px">
        <Modal.CloseButton />
        <Modal.Header>
          <Text fontSize="xl" fontWeight="bold">
            Choose a Flashcard Deck
          </Text>
        </Modal.Header>
        <Modal.Body>
          <Text mb={4}>
            Add <Text bold>{english}/{hokkien}</Text> to an existing deck you created or a public deck
          </Text>          
          <Select
            selectedValue={selectedCategory}
            placeholder={isLoading ? "Loading categories..." : "Select Category"}
            onValueChange={setSelectedCategory}
            mb={4}
            isDisabled={isLoading}
            _hover={{
              borderColor: colors.darkerPrimaryContainer, 
              bg: colors.primaryContainer,
            }}
          >
            {categories.map((category) => (
              <Select.Item 
                key={category.id} 
                label={category.name} 
                value={category.id} 
              />
            ))}
          </Select>
          
          {selectedCategory && (
            <Select
              selectedValue={selectedFlashcardList}
              placeholder={isLoading ? "Loading decks..." : "Select Flashcard Deck"}
              onValueChange={setSelectedFlashcardList}
              isDisabled={isLoading || !selectedCategory}
              _hover={{
                borderColor: colors.darkerPrimaryContainer, 
                bg: colors.primaryContainer,
              }}
            >
              {flashcardLists.map((deck) => (
                <Select.Item 
                  key={deck.id} 
                  label={deck.name} 
                  value={deck.id} 
                />
              ))}
            </Select>
          )}
        </Modal.Body>
        <Modal.Footer>
          <HStack space={2}>
            <Button 
              colorScheme="green" 
              onPress={handleSave}
              isDisabled={!selectedFlashcardList}
            >
              <HStack space={1} alignItems="center">
                <Ionicons name="save-outline" size={30} color="#FFFFFF" />
                <Text color="#FFFFFF">Save</Text>
              </HStack>
            </Button>
            <Button
              onPress={onClose}
              variant="ghost"
              borderWidth={1}
              borderColor="coolGray.200"
              bg={colors.primaryContainer} 
              _hover={{ bg: colors.darkerPrimaryContainer }}
              _pressed={{ bg: colors.evenDarkerPrimaryContainer }}
            >
              <Text color={colors.onSurface}>Cancel</Text>
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}
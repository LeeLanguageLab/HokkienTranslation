import { useEffect } from "react";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  doc,
  getDocs,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../backend/database/Firebase";
import { HStack, Switch } from "native-base";
import { useTheme } from "./context/ThemeProvider";
import getCurrentUser from "../backend/database/GetCurrentUser";

var categoryId = "";
var ID = "";
var currentUser = "";

async function getFlashcardsforCategory(db, category) {
  const categoryRef = collection(db, "category");

  const q = query(categoryRef, where("name", "==", category));
    
  const querySnapshot = await getDocs(q);
  var flashcardList = [];
  var decks = [];
  console.log(q);
  querySnapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    decks = doc.data().flashcardList;
    categoryId = doc.id;
  });

  for (const deck of decks) {
    const deckRef = doc(db, "flashcardList", deck);
    const deckDoc = await getDoc(deckRef);
    const deckData = deckDoc.data();
    for (const card of deckData.cardList) {
      flashcardList.push(card);
    }
  }

  var flashcards = [];

  // filter duplicates (by same id)
  for (const flashcard of flashcardList) {
    const flashcardRef = doc(db, "flashcard", flashcard);
    const flashcardDoc = await getDoc(flashcardRef);
    const flashcardData = flashcardDoc.data();
    // console.log(flashcardData);
    // step could be taken here to ensured we are not accessing other users flashcards

    if (flashcardData && flashcardData.destination) {
      flashcards.push({
        word: flashcardData.destination,
        translation: flashcardData.origin,
        id: flashcardRef.id,
      });
    } 
    // console.log(flashcardRef.id)
  }

  // ensure unique flashcard id
  flashcards = flashcards.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id)
  );
  return flashcards;
}

const FlashcardAdd = ({ route }) => {
  const navigation = useNavigation();
  const [deckName, setDeckName] = useState(route.params.deckName || "");
  const [selectedFlashcards, setSelectedFlashcards] = useState(
    route.params.selectedFlashcards || []
  );
  const [flashcards, setFlashcards] = useState([]);
  const [shared, setShared] = useState(route.params.shared || false);

  const { theme, themes } = useTheme();
  const colors = themes[theme];

  const categoryId = route.params.categoryId;
  console.log("Category ID in FlashcardAdd: ", categoryId)

  useEffect(() => {
    getFlashcardsforCategory(db, route.params.curCategory)
      .then((flashcardList) => {
        setFlashcards(flashcardList);
      })
      .catch((error) => {
        console.error("Error fetching flashcards: ", error);
      });
  }, []);

  const fetchUser = async () => {
    try {
      const user = await getCurrentUser();
      currentUser = user;
    } catch (error) {
      console.error("Error fetching user: ", error);
    }
  };

  const toggleSelection = (id) => {
    if (selectedFlashcards.includes(id)) {
      setSelectedFlashcards(
        selectedFlashcards.filter((flashcardId) => flashcardId !== id)
      );
    } else {
      setSelectedFlashcards([...selectedFlashcards, id]);
    }
  };

  const handleSubmission = async () => {
    var cardList = selectedFlashcards;

    if (currentUser === "") {
      fetchUser();
    }

    if (route.params.update) {
      var serverTimestamps;
      const oldFlashcardListRef = doc(
        db,
        "flashcardList",
        route.params.deckName
      );

      await getDoc(oldFlashcardListRef).then((doc) => {
        if (doc.exists()) {
          serverTimestamps = doc.data().createdAt;
          console.log(serverTimestamps);
        }
      });

      // Set the new FlashcardList with updated data
      const newFlashcardListRef = doc(db, "flashcardList", deckName);
      await setDoc(newFlashcardListRef, {
        name: deckName,
        cardList: cardList,
        createdAt: serverTimestamps,
        categoryId: categoryId,
        createdBy: route.params.currentUser,
        shared: shared,
      });

      const categoryRef2 = doc(db, "category", categoryId);
      const categoryDoc2 = await getDoc(categoryRef2);
      const categoryData2 = categoryDoc2.data();
      var flashcardList = categoryData2.flashcardList;
      flashcardList.splice(flashcardList.indexOf(route.params.deckName), 1);
      flashcardList.push(deckName);

      await updateDoc(categoryRef2, {
        flashcardList: flashcardList,
      });
    } else {
      // new FlashcardList
      const flashcardListRef = doc(db, "flashcardList", deckName);
      await setDoc(flashcardListRef, {
        name: deckName,
        cardList: cardList,
        createdAt: serverTimestamp(),
        categoryId: categoryId,
        createdBy: route.params.currentUser,
        shared: shared,
      });

      // Update the category
      const categoryRef = doc(db, "category", categoryId);
      const categoryDoc = await getDoc(categoryRef);
      const categoryData = categoryDoc.data();
      var flashcardList = categoryData.flashcardList;
      flashcardList.push(deckName);
      await updateDoc(categoryRef, {
        flashcardList: flashcardList,
      });

      // new flashcardQuiz
      const flashcardQuizRef = doc(collection(db, "flashcardQuiz"));
      await setDoc(flashcardQuizRef, {
        flashcardListId: flashcardListRef.id,
        scores: {},
      });

      console.log("FlashcardQuiz created for", flashcardListRef.id);
    }

    var flashcardList = cardList;
    cardList = [];
    for (const card of flashcardList) {
      const cardRef = doc(db, "flashcard", card);
      const cardDoc = await getDoc(cardRef);

      if (cardDoc.exists()) {
        const cardData = cardDoc.data();
        cardList.push({
          id: card,
          origin: cardData.origin,
          destination: cardData.destination,
          otherOptions: cardData.otherOptions,
          type: cardData.type,
          word: cardData.destination,
          translation: cardData.origin,
          createdBy: currentUser,
          createdAt: new Date().toISOString(),
        });
      }
    }
    navigation.navigate("Flashcard", { cardList, deckName: deckName, currentUser, categoryId});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}>

        <View
          style={{
            width: '90%',
            alignSelf: 'center',
            padding: 20,
            backgroundColor: colors.primaryContainer,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <TextInput
            placeholder="Enter deck name"
            value={deckName}
            onChangeText={setDeckName}
            style={{
              borderWidth: 1,
              padding: 10,
              marginBottom: 20,
              borderColor: colors.primary,
              color: colors.onSurface,
              
            }}
            placeholderTextColor={colors.onSurfaceVariant}
          />
          <HStack style={{ flex: 1, marginBottom: 20 }}>
            <Text style={{ color: colors.onSurface }}>Share</Text>
            <Switch
              title="Share"
              isChecked={shared}
              onToggle={() => setShared(!shared)}
              style={{ marginLeft: 10 }}
              onTrackColor={colors.primary}
            />
            <Text style={{ color: colors.onSurfaceVariant, marginLeft: 10, fontSize: 12}}>
              Sharing means anyone can view or edit your deck.
            </Text>
          </HStack>
          <Text>Select at least one base flashcard. You can create custom flashcards on the next page.</Text>
          <TouchableOpacity
            onPress={handleSubmission}
            disabled={selectedFlashcards.length === 0}
            style={{
              backgroundColor: selectedFlashcards.length === 0 ? "#CCCCCC" : "#00FF00",
              paddingVertical: 15,
              paddingHorizontal: 20,
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              alignItems: "center",
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            <Text
              style={{ color: "#000000", fontSize: 16, fontWeight: "bold" }}
            >
              Submit
            </Text>
          </TouchableOpacity>

          {flashcards.map((item) => (
            <TouchableOpacity onPress={() => toggleSelection(item.id)} key={item.id}>
              <View
                style={{
                  flexDirection: "row",
                  padding: 10,
                  alignItems: "center",
                  backgroundColor: selectedFlashcards.includes(item.id)
                    ? colors.evenDarkerPrimaryContainer
                    : colors.darkerPrimaryContainer,
                  borderWidth: 2,
                  borderColor: selectedFlashcards.includes(item.id)
                    ? colors.primary
                    : colors.onSurface,
                  borderRadius: 10,
                  marginVertical: 3,
                }}
              >
                <Text style={{ flex: 1, color: colors.onSurface }}>
                  {item.word}
                </Text>
                <Text style={{ flex: 1, color: colors.onSurface }}>
                  {item.translation}
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: selectedFlashcards.includes(item.id)
                      ? colors.primary
                      : colors.onSurface,
                    backgroundColor: selectedFlashcards.includes(item.id)
                      ? "#00FF00"
                      : colors.surface,
                  }}
                />
              </View>
            </TouchableOpacity>
          ))}

        </View>
        
      </ScrollView>
    </View>
  );
};

export default FlashcardAdd;

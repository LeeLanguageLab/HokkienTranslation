import { parse } from "csv-parse";
import { promises as fs } from "fs";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../Firebase.js";

const categories = [
  "Daily Conversations",
  "Dining and Food",
  "Travel and Transportation",
  "Work and Business",
  "Shopping",
  "Health and Medicine",
  "Family and Relationships",
  "Education and Learning",
  "Hobbies and Leisure",
  "Emergency Situations",
  "Other",
];

const createdBy = "starter_words";

const uploadData = async () => {
  try {
    const path = "../../data/new_flashcard_data_samples.csv";
    const csvString = await fs.readFile(path, "utf-8");

    parse(
      csvString,
      {
        columns: true,
        skip_empty_lines: true,
      },
      async (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        for (const category of categories) {
          let categoryId;
          let categoryRef;

          const categoryQuery = query(
            collection(db, "category"),
            where("name", "==", category)
          );
          const categorySnapshot = await getDocs(categoryQuery);

          if (categorySnapshot.empty) {
            categoryRef = doc(collection(db, "category"));
            const categoryData = {
              name: category,
              description: `${category} description`,
              createdAt: new Date().toISOString(),
              flashcardList: [],
            };
            await setDoc(categoryRef, categoryData);
            categoryId = categoryRef.id;
          } else {
            const categoryDoc = categorySnapshot.docs[0];
            categoryRef = categoryDoc.ref;
            categoryId = categoryDoc.id;
          }
          console.log("categoryId: ", categoryId);

          const flashcardListName = `${category} Starter`;

          // Check for existing flashcard list
          const flashcardListQuery = query(
            collection(db, "flashcardList"),
            where("name", "==", flashcardListName),
            where("createdBy", "==", createdBy)
          );
          const flashcardListSnapshot = await getDocs(flashcardListQuery);

          if (flashcardListSnapshot.empty) {
            const flashcardListRef = doc(
              db,
              "flashcardList",
              flashcardListName
            );
            const flashcardList = {
              name: flashcardListName,
              cardList: [],
              categoryId: categoryId,
              shared: true,
              createdBy: createdBy,
              createdAt: new Date().toISOString(),
            };

            console.log("flashcardList: ", flashcardList);

            await setDoc(flashcardListRef, flashcardList);

            await updateDoc(categoryRef, {
              flashcardList: arrayUnion(flashcardListName),
            });

            for (let i = 0; i < 10; i++) {
              const flashcardData = data.shift();
              if (!flashcardData) break;

              // Check for existing flashcard
              const flashcardQuery = query(
                collection(db, "flashcard"),
                where("origin", "==", flashcardData.origin),
                where("destination", "==", flashcardData.destination),
                where("createdBy", "==", createdBy)
              );
              const flashcardSnapshot = await getDocs(flashcardQuery);

              if (flashcardSnapshot.empty) {
                const flashcardRef = doc(collection(db, "flashcard"));
                const flashcard = {
                  origin: flashcardData.origin,
                  destination: flashcardData.destination,
                  otherOptions: flashcardData.otherOptions.split(","),
                  type: flashcardData.type,
                  categoryId: categoryId,
                  createdBy: createdBy,
                  createdAt: new Date().toISOString(),
                };

                await setDoc(flashcardRef, flashcard);

                flashcardList.cardList.push(flashcardRef.id);
              }
            }

            await setDoc(
              flashcardListRef,
              { cardList: flashcardList.cardList },
              { merge: true }
            );

            // Check for existing flashcard quiz
            const flashcardQuizQuery = query(
              collection(db, "flashcardQuiz"),
              where("flashcardListId", "==", flashcardListName)
            );
            const flashcardQuizSnapshot = await getDocs(flashcardQuizQuery);

            if (flashcardQuizSnapshot.empty) {
              const flashcardQuizRef = doc(collection(db, "flashcardQuiz"));
              const flashcardQuiz = {
                flashcardListId: flashcardListName,
                scores: {
                  [createdBy]: [],
                },
              };

              await setDoc(flashcardQuizRef, flashcardQuiz);
            }

            console.log("flashcardQuiz flashcardListID: ", flashcardListName);
          }
        }
      }
    );
  } catch (error) {
    console.error("Error uploading data:", error);
  }
};

uploadData();

import app, { db } from "../database/Firebase.js";
import { collection, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

// ✍️ Add as many dialogues as you like here (Dialogue 1..6)
const SPEAKING_DOCS = [
    {// Dialogue 1
    title: "Talking About Family",
    flashcardListId: "Family and Relationships Starter",
    context: "A and B met each other at an event. They are talking about family.",
    dialogue: [
      {
        speaker: "A",
        engText: "Do you have brothers or sisters?",
        hokText: "你有兄弟姊妹無？",
        tailoRomanization: "li2 u7 hiann1 ti7 tsi2 mue7 bo5",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "I do. I have a sister.",
        hokText: "有啊，我有一个姊妹仔。",
        tailoRomanization: "u7 a1 gua2 u7 tsit8 e5 tsi2 mue7 a2",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "I have two brothers and a child.",
        hokText: "我有兩個兄弟閣一個囝仔。",
        tailoRomanization: "gua2 u7 nng7 e5 hiann1 ti7 koh4 tsit8 e5 gin2 a2",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "Is your child cute?",
        hokText: "你的囝仔有古錐無？",
        tailoRomanization: "li2 e5 gin2 a2 u7 koo2 tsui1 bo5",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "Very cute. My mother always says he’s smart.",
        hokText: "古錐啊，母親攏講伊真巧。",
        tailoRomanization: "koo2 tsui1 a1 bo2 tshin1 long2 kong2 i1 tsin1 khiau2",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "If the grandparents see him, they must be very happy.",
        hokText: "公媽若看著，定定會真歡喜。",
        tailoRomanization: "kong1 ma2 na7 khuann3 tioh8 tiann7 tiann7 e7 tsin1 huann1 hi2",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "Family is very important!",
        hokText: "家庭真重要！",
        tailoRomanization: "ka1 ting5 tsin1 tiong7 iau7",
        audioUrl: null,
      },
    ],
  },
    // Dialogue 2
  {
    title: "Cherishing Relationships",
    flashcardListId: "Family and Relationships Starter",
    context: "A and B are friends who have known each other for a long time. They are talking about their views on interpersonal relationships.",
    dialogue: [
      {
        speaker: "A",
        engText: "Do you feel like we’ve been friends for a long time?",
        hokText: "你有感覺咱做朋友真久矣無？",
        tailoRomanization: "li2 u7 kam2 kak4 lan2 tso3 ping5 iu2 tsin1 ku2 ah4 bo5",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "Yes, you’re just like my relative.",
        hokText: "有啊，你親像我的親情。",
        tailoRomanization: "u7 a1 li2 tshin1 tshiunn7 gua2 e5 tshin1 tsiann5",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "That’s touching. Have you met my father?",
        hokText: "真感心。你有看過我父親無？",
        tailoRomanization: "tsin1 kam2 sim1 li2 u7 khuann3 kue3 gua2 hu7 tshin1 bo5",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "Yes, he is very kind.",
        hokText: "有啊，伊真和氣。",
        tailoRomanization: "u7 a1 i1 tsin1 ho5 khi3",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "I always feel family is important. Relatives and friends must be cherished.",
        hokText: "我攏感覺家庭真重要，親情佮朋友攏需要珍惜。",
        tailoRomanization: "gua2 long2 kam2 kak4 ka1 ting5 tsin1 tiong7 iau7 tshin1 tsiann5 kah4 ping5 iu2 long2 su7 iau3 tin1 sio̍k8",
        audioUrl: null,
      },
      {
        speaker: "B",
        engText: "Husband and wife also need to understand each other.",
        hokText: "夫妻嘛著互相體諒。",
        tailoRomanization: "hu1 tshe1 ma7 tioh8 ho7 siong1 the2 liong7",
        audioUrl: null,
      },
      {
        speaker: "A",
        engText: "Well said!",
        hokText: "講得真好！",
        tailoRomanization: "kong2 tit4 tsin1 ho2",
        audioUrl: null,
      },
    ],
  },

  // ➕ Add Dialogue 2..6 here with the same shape as needed
];

/**
 * Upsert (create/overwrite) documents in 'speakingPracticeDialogues'.
 * Uses the slug of `title` as the document ID so it’s stable and readable.
 */
export async function seedSpeakingPracticeDialogues() {
  const colRef = collection(db, "speakingPracticeDialogues");

  for (const docData of SPEAKING_DOCS) {
    if (!docData?.title || !docData?.context || !Array.isArray(docData.dialogue)) {
      console.warn("Skipping invalid doc (needs title, context, dialogue[]):", docData?.title);
      continue;
    }

    docData.dialogue = docData.dialogue.map((d, i) => ({
      speaker: d.speaker ?? "computer",
      engText: d.engText ?? "",
      hokText: d.hokText ?? "",
      tailoRomanization: (d.tailoRomanization ?? "").trim(),
      audioUrl: d.audioUrl ?? null,
      _index: i,
    }));

    // ✅ Auto-ID instead of slugify
    const newDocRef = doc(colRef);
    await setDoc(newDocRef, docData);
    console.log(`✅ wrote speakingPracticeDialogues with ID: ${newDocRef.id}`);
  }

  console.log("Done seeding speakingPracticeDialogues.");
}


seedSpeakingPracticeDialogues()
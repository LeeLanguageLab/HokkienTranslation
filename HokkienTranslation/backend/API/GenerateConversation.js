
import { callOpenAIChat } from "./OpenAIChatService";
import { fetchTranslation } from "./HokkienTranslationToolService";
import { getFirestore, collection, addDoc } from "firebase/firestore";



const generateConversation = async (topicName, context, vocabList, flashcardListId = null, title = null) => {
  try {
    const englishVocabList = vocabList.map(v => v.destination || v).filter(Boolean);
    const prompt = `
  Generate a 7-line conversation between two speakers, A and B.
  Topic: "${topicName}" (${context})
  Use some of the following English vocabulary naturally: ${englishVocabList.join(", ")}.
  Do not use any chinese characters, the conversation should be entirely in English.
  Each line should be labeled "A:" or "B:", followed by English dialogue only.
  No explanations or commentary — just the 7 lines. 
  Avoid languages that are innapropriate or offensive for all audiences.
  `;

    console.log("Running in:", typeof window === "undefined" ? "Node" : "Browser");
    const conversationText = await callOpenAIChat(prompt);

    const dialogueLines = conversationText
      .split("\n")
      .filter((l) => l.trim())
      .map((line, idx) => {
        const match = line.match(/^([AB]):\s*(.*)$/);
        return {
          _index: idx,
          speaker: match ? match[1] : "A",
          engText: match ? match[2] : line,
          hokText: "",
          tailoRomanization: "",
          audioUrl: null,
        };
      });

    await Promise.all(
      dialogueLines.map(async (d) => {
        const hok = await fetchTranslation(d.engText, "en", "hokkien");
        const { fetchRomanizer } = await import("./HokkienHanziRomanizerService.js");
        const tailo = await fetchRomanizer(hok);
        d.hokText = hok; // Hokkien translation 
        d.tailoRomanization = tailo;
      })
    );


    // one sentence summary for context key
    let contextSummary = context;
    try {
      const convoText = dialogueLines.map(d => `${d.speaker}: ${d.engText}`).join('\n');
      const contextPrompt = `Given the following 7-line conversation, generate a very simple one-sentence summary of the conversation. Only return the summary sentence.\n\nConversation:\n${convoText}`;
      contextSummary = await callOpenAIChat(contextPrompt);
      if (contextSummary.length > 0) {
        contextSummary = contextSummary.charAt(0).toUpperCase() + contextSummary.slice(1);
        if (!/[.!?]$/.test(contextSummary)) contextSummary += '.';
      }
    } catch (e) {
      // fallback to previous logic if OpenAI fails
      const firstTwo = dialogueLines.slice(0, 2).map(d => d.engText).join(' ');
      contextSummary = firstTwo.length > 0 ? firstTwo : topicName;
      if (contextSummary.length > 0) {
        contextSummary = contextSummary.charAt(0).toUpperCase() + contextSummary.slice(1);
        if (!/[.!?]$/.test(contextSummary)) contextSummary += '.';
      }
    }

    // unique, max 5-word title using OpenAI
    let summaryTitle = title;
    try {
      const convoText = dialogueLines.map(d => `${d.speaker}: ${d.engText}`).join('\n');
      const hash = Math.abs(convoText.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100000;
      const titlePrompt = `Given the following 7-line conversation, generate a unique, short, and descriptive title (maximum 5 words) that summarizes the conversation. Only return the title, no punctuation at the end.\n\nConversation:\n${convoText}`;
      let aiTitle = await callOpenAIChat(titlePrompt);
      aiTitle = aiTitle.replace(/[\s\-_,.;:!?]+$/, '').trim();
      const words = aiTitle.split(/\s+/).filter(Boolean);
      let baseTitle = words.slice(0, 5).join(' ');
      if (!baseTitle) baseTitle = topicName;
      summaryTitle = `${baseTitle} #${hash}`;
    } catch (e) {
      // fallback to previous logic if OpenAI fails
      const firstLine = dialogueLines.length > 0 ? dialogueLines[0].engText : topicName;
      const words = firstLine.split(/\s+/).filter(Boolean);
      let baseTitle = words.slice(0, 5).join(' ');
      if (!baseTitle) baseTitle = topicName;
      // Add a hash for uniqueness
      const convoText = dialogueLines.map(d => `${d.speaker}: ${d.engText}`).join('\n');
      const hash = Math.abs(convoText.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100000;
      summaryTitle = `${baseTitle} #${hash}`;
    }

    // Prepare Firestore upload
    const db = getFirestore();
    const docData = {
      context: contextSummary,
      dialogue: dialogueLines,
      flashcardListId: flashcardListId || topicName,
      title: summaryTitle,
      createdAt: new Date().toISOString(),
    };

    // Upload
    const docRef = await addDoc(collection(db, "speakingPracticeDialogues"), docData);
    console.log("Uploaded conversation to Firestore with ID:", docRef.id);

    // Return Firestore document data and ID
    return { ...docData, id: docRef.id };
  } catch (error) {
    console.error("Error generating conversation:", error);
    throw error;
  }
};

export { generateConversation };

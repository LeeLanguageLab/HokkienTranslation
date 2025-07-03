import { callOpenAIChat } from "./OpenAIChatService";
import {fetchTranslation} from "./HokkienTranslationToolService";


const generateSentences = async (words) => {
    try {
        const promptForEnglish = `Given the word(s): ${words}, provide a sentence that uses the word(s) in context. The sentence should be clear and concise. Respond with only the sentence and no additional text or punctuation.`;
        const englishSentence = await callOpenAIChat(promptForEnglish);
        const promptForChinese = `,Translate the ${englishSentence} in Chinese. The sentence should be clear and concise. Respond with only the sentence and no additional text or punctuation.`;
        const chineseSentence = await callOpenAIChat(promptForChinese);
        const hokkienSentence = await fetchTranslation(englishSentence, "HAN");

        return {
            english: englishSentence,
            chinese: chineseSentence,
            hokkien: hokkienSentence,
        };
    } catch (error) {
        console.error("Error generating sentences:", error);
    }
};

export { generateSentences };

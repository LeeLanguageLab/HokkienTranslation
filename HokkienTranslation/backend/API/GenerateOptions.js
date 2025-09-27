import { callOpenAIChat } from "./OpenAIChatService";

const generateOptions = async (options) => {
    try {
        const prompt = `Given the word(s): ${options}, provide another word that belongs to the same category. The word must be similar in type but not identical. Respond with only one word and no punctuation.`;
        const response = await callOpenAIChat(prompt);
        // console.log("OpenAI Response:", response);
        return response;
    } catch (error) {
        console.error("Error generating options:", error);
    }
};

export { generateOptions };
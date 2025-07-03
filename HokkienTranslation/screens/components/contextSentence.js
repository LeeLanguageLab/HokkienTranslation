import { useEffect } from "react";
import {callOpenAIChat} from "../../backend/API/OpenAIChatService.js";

const getContextSentence = async (word) => {
    const answer = await callOpenAIChat(`Generate a single short natural contextual sentence using the word ${word}. Do not include any pleasantries, explanations, or anything other than the sentence itself.`);
    console.log(answer);

    return answer;
};

export default getContextSentence;
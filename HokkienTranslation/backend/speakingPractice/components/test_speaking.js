import { transcribeHokkienToEnglish } from "./stt.js";

async function runTest() {
  try {
    const result = await transcribeHokkienToEnglish("Hello, how are you?");
    console.log("Translation result:", result);
  } catch (err) {
    console.error("Error testing englishToHokkien:", err);
  }
}

runTest();
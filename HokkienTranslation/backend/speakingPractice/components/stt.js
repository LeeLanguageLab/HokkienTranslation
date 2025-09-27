import { fetchTranslation } from "../../API/HokkienTranslationToolService.js";

export async function transcribeHokkienToEnglish(audioBuffer) {
  // Substitute UnitY model to this when it's back
  if (!audioBuffer) throw new Error("No English text provided.");

  try {
    const hok = await fetchTranslation(audioBuffer, "HAN");
    return { text_en: audioBuffer, text_hok: hok || "[No translation returned]" };
  } catch (err) {
    console.error("englishToHokkien error:", err);
    throw err;
  }
}
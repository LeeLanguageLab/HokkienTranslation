import axios from "axios";
import MixpanelService from "./Mixpanel";
// import { TRANSLATION_API_URL } from "@env";

// const apiUrl = TRANSLATION_API_URL;
const apiUrl = process.env.TRANSLATION_API_URL;
// Use for FlashCardConvertToHokkien.js
// const apiUrl = "https://tw-trans.z12.tw/";

// outputLanguage = "ZH" (Chinese) / "EN" (English) / "HAN" (Hokkien)
const fetchTranslation = async (query, outputLanguage = "HAN") => {
  if (!query) return null;
  console.warn("fetchTranslation called with:", query, outputLanguage);

  await MixpanelService.initialize();

  try {
    const requestData = {
      inputs: `[TRANS]\n${query}\n[/TRANS]\n${outputLanguage}\n`,
      parameters: {
        max_new_tokens: 128,
        repetition_penalty: 1.1,
      },
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data[0].generated_text) {
      const text = response.data[0].generated_text;
      const lines = text.split("\n");
      const translationText = lines[lines.length - 2].trim();
      return translationText;
    }
  } catch (error) {
    MixpanelService.track("Error in Translation", {
      error: error.message,
      query,
      outputLanguage,
      type: "error"
    });
    MixpanelService.flush();
    console.error("Error:", error);
    throw new Error("Error in translation.");
  }
};

export { fetchTranslation };

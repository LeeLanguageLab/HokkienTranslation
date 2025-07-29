import axios from "axios";
import MixpanelService from "./Mixpanel";
// import { ROMANIZER_API_URL, API_KEY } from "@env";

// const apiUrl = ROMANIZER_API_URL;
// const apiKey = API_KEY;
const apiUrl = process.env.ROMANIZER_API_URL;
const apiKey = process.env.API_KEY;


const fetchRomanizer = async (hokkien) => {
  console.warn("fetchRomanizer called with:", hokkien);
  if (!hokkien) return null;
  await MixpanelService.initialize()

  try {
    const requestData = {
      sentence: hokkien,
    };

    const response = await axios.post(apiUrl, requestData, {
      headers: {
        "API-KEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (response.data && response.data.result) {
      return response.data.result;
    }
  } catch (error) {
    MixpanelService.track("Error in Romanizer", {
      error: error.message,
      hokkien,
      type: "error"
    });
    MixpanelService.flush();
    console.error("Error:", error);
    throw new Error("Error in romanizing.");
  }
};

export { fetchRomanizer };

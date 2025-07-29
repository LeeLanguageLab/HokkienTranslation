import axios from "axios";
import MixpanelService from "./Mixpanel";
// import { IMAGE_API_URL, API_KEY } from "@env";

// const apiUrl = IMAGE_API_URL;
// const apiKey = API_KEY;

const apiUrl = process.env.IMAGE_API_URL;
const apiKey = process.env.API_KEY;

const generateImage = async (prompt) => {
  if (!prompt) return { imgBase64: null, error: null };
  console.warn("generateImage called with:", prompt);

  await MixpanelService.initialize();

  const requestData = {
    prompt: prompt, //option types: string or list of strings.
    prompt_style: "photography", //options: "anime", "portraits", "landscape", "sci-fi", "photography", "video_game", None for default.
    negative_prompt: "", //can change to your negative prompt here.
    negative_prompt_style: null, //options: "comic", "basic", "natural_human", None for default.
    n_steps: 40, //generating steps
    high_noise_frac: 0.8, //generating parameters
    base64_string: true, //please set True for api call, False is for testing.
  };

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: { "API-KEY": apiKey },
    });

    if (response.data && response.data.img_base64_list) {
      const imgBase64 = response.data.img_base64_list[0];
      return { imgBase64, error: null };
    }
  } catch (error) {
    MixpanelService.track("Error in Image Generation", {
      error: error.message,
      prompt,
      type: "error"
    });

    MixpanelService.flush();
    console.error("Error:", error);
    return { imgBase64: null, error };
  }
};

export { generateImage };

import MixpanelService from "./Mixpanel";

const NUMERIC_TONES_API = process.env.TONE_API_URL;
const TEXT_TO_SPEECH_API = process.env.SPEECH_API_URL;

const fetchNumericTones = async (prompt) => {
    const params = new URLSearchParams({text0: prompt});
    const url = `${NUMERIC_TONES_API}?${params.toString()}`;
    await MixpanelService.initialize();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // console.error(`Error: ${response.status} - ${response.statusText}`);
            // throw new Error(`HTTP error! Status: ${response.status}`);
            throw new Error(`Failed to fetch numeric tones. Please try again later.`);
        }

        let numeric_tones = await response.text();
        if (numeric_tones.endsWith(".")) {
            numeric_tones = numeric_tones.slice(0, -1);
        }
        return numeric_tones;
    } catch (error) {
        MixpanelService.track("Error in Numeric Tones Fetch", {
            error: error.message,
            prompt,
            type: "error"
        });
        console.error("Error fetching numeric tones:", error);
        throw error;
    }
};

const fetchAudioUrl = async (numericTones) => {
    await MixpanelService.initialize();
    const params = new URLSearchParams({
        text1: numericTones,
        gender: "女聲",
        accent: "強勢腔（高雄腔）",
    });
    const url = `${TEXT_TO_SPEECH_API}?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio URL. Please try again later.`);
        }
        const data = await response.blob();
        const blob = new Blob([data], {type: "audio/wav"});
        return window.URL.createObjectURL(blob);
    } catch (error) {
        MixpanelService.track("Error in Audio URL Fetch", {
            error: error.message,
            numericTones,
            type: "error"
        });
        console.error("Error fetching audio URL:", error);
        throw error;
    }
};

const fetchAudioBlob = async (numericTones) => {
    await MixpanelService.initialize();
    const params = new URLSearchParams({
        text1: numericTones,
        gender: "女聲",
        accent: "強勢腔（高雄腔）",
    });
    const url = `${TEXT_TO_SPEECH_API}?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch audio");
        return await response.blob();
    } catch (error) {
        MixpanelService.track("Error in Audio Blob Fetch", {
            error: error.message,
            numericTones,
            type: "error"
        });
        MixpanelService.flush();
        console.error("Error fetching audio URL:", error);
        throw error;
    }
};

export {fetchNumericTones, fetchAudioUrl, fetchAudioBlob};

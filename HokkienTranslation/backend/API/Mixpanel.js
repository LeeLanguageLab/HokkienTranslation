import {Mixpanel} from "mixpanel-react-native";
import getCurrentUserActual from "../database/GetCurrentUserActual";

class MixpanelService {
    constructor() {
        this.mixpanel = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        const user = getCurrentUserActual();
        const mixpanelKey = process.env.MIXPANEL_API_KEY;
        const trackAutomaticEvents = false;
        const useNative = false;

        this.mixpanel = new Mixpanel(mixpanelKey, trackAutomaticEvents, useNative);
        await this.mixpanel.init();

        try {
            await this.mixpanel.identify(user.uid);
            this.mixpanel.getPeople().set("$email", user.email);
            this.isInitialized = true;
        } catch (error) {
            console.error("Mixpanel identify error:", error);
        }
    }

    track(eventName, properties = {}) {
        if (!this.isInitialized) {
            console.warn('Mixpanel not initialized yet');
            return;
        }
        this.mixpanel.track(eventName, properties);
    }

    setUserProperties(properties) {
        if (!this.isInitialized) return;
        this.mixpanel.getPeople().set(properties);
    }

    // Add other Mixpanel methods as needed
    flush() {
        if (!this.isInitialized) return;
        this.mixpanel.flush();
    }
}

// Export a singleton instance
export default new MixpanelService();

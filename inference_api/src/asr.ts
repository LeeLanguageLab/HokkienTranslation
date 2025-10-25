import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

export class HokkienSpeechRecognitionAPI {
    private readonly endpointUrl: string;
    private readonly hfToken: string;

    constructor(endpointUrl?: string, hfToken?: string) {
        // Use provided values or fall back to environment variables
        this.endpointUrl = endpointUrl || process.env.AUDIO_ENDPOINT_URL || "";
        this.hfToken = hfToken || process.env.HF_INFERENCE_TOKEN || "";

        // Validate that required environment variables are present
        if (!this.hfToken) {
            throw new Error('HF_TOKEN is required. Please set it in your .env file or pass it as a parameter.');
        }

        if (!this.endpointUrl) {
            throw new Error('AUDIO_ENDPOINT_URL is required. Please set it in your .env file or pass it as a parameter.');
        }

    }

    async transcribe(audioFilePath: string): Promise<string> {
        try {
            // Read the audio file as a buffer
            const audioBuffer = fs.readFileSync(audioFilePath);

            // Send request directly to the endpoint URL using fetch
            const response = await fetch(this.endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.hfToken}`,
                    'Content-Type': 'audio/flac', // or 'audio/wav', 'audio/mpeg' depending on your file
                },
                body: audioBuffer
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            return result.text || JSON.stringify(result);

        } catch (error: any) {
            console.error('Transcription error:', error);
            throw new Error(`Transcription failed: ${error.message}`);
        }
    }
}

// Example usage
async function main(): Promise<void> {
    const speechRecognizer = new HokkienSpeechRecognitionAPI(
        process.env.AUDIO_ENDPOINT_URL,
        process.env.HF_INFERENCE_TOKEN
    );

    try {
        const audioFile = 'sample1.flac';
        console.log(`Transcribing: ${audioFile}\n`);

        const transcription = await speechRecognizer.transcribe(audioFile);
        console.log('Transcription:', transcription);
    } catch (error) {
        console.error('Failed to transcribe:', error);
    }
}

main().catch(console.error);

import { InferenceClient } from '@huggingface/inference';
import * as dotenv from 'dotenv';

dotenv.config();

export class TaigiTranslatorAPI {
    private readonly endpointUrl: string;
    private readonly hfToken: string;
    private client: InferenceClient;
    private promptTemplate: string;

    constructor(endpointUrl?: string, hfToken?: string) {
        // Use provided values or fall back to environment variables
        this.endpointUrl = endpointUrl || process.env.HF_ENDPOINT_URL || "";
        this.hfToken = hfToken || process.env.HF_TOKEN || "";

        // Validate that required environment variables are present
        if (!this.hfToken) {
            throw new Error('HF_TOKEN is required. Please set it in your .env file or pass it as a parameter.');
        }

        if (!this.endpointUrl) {
            throw new Error('HF_ENDPOINT_URL is required. Please set it in your .env file or pass it as a parameter.');
        }

        // Initialize client with endpoint URL in options
        this.client = new InferenceClient(this.hfToken, {
            endpointUrl: this.endpointUrl
        });

        this.promptTemplate = "[TRANS]\n{source_sentence}\n[/TRANS]\n[{target_language}]\n";
    }

    private formatPrompt(sourceSentence: string, targetLanguage: string): string {
        return this.promptTemplate
            .replace('{source_sentence}', sourceSentence)
            .replace('{target_language}', targetLanguage);
    }

    async translate(sourceSentence: string, targetLanguage: string): Promise<string> {
        const prompt = this.formatPrompt(sourceSentence, targetLanguage);

        try {
            // Don't specify model parameter when using endpoint URL
            const response = await this.client.textGeneration({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 512,
                    temperature: 0.1,
                    do_sample: false,
                    repetition_penalty: 1.1,
                    return_full_text: false
                }
            });

            const generatedText = response.generated_text;
            const translation = generatedText.includes('[/')
                ? generatedText.substring(0, generatedText.indexOf('[/')).trim()
                : generatedText.trim();

            return translation;

        } catch (error: any) {
            console.error('Translation error:', error);
            return `Translation failed: ${error.message}`;
        }
    }
}


async function main(): Promise<void> {
    const translator = new TaigiTranslatorAPI();
    const sourceSentence = "How are you today？";

    console.log(`Source: ${sourceSentence}\n`);

    try {
        console.log("To Hanzi: " + await translator.translate(sourceSentence, "HAN"));
    } catch (error) {
        console.error("Translation failed:", error);
    }
}

main().catch(console.error);

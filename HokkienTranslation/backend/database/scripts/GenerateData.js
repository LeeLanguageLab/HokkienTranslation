// This file contains scripts for generating audio files and romanizations from a csv and creating a new csv with the generated data.
// It will create the audio files in the data/generated_audios folder and update the csv with the file paths.
// .env variables can be tricky, may need to hardcode the API URLs when actually running the script.
// To run, add "type": "module" to the package.json file and run the script using `node GenerateData.js`.

import fs from 'fs';
import fetch from 'node-fetch'
import csv from 'csv-parser';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { fetchNumericTones } from "../../API/TextToSpeechService.js";
import { fetchRomanizer } from "../../API/HokkienHanziRomanizerService.js";

const TEXT_TO_SPEECH_API = process.env.SPEECH_API_URL;

const inputCsvPath = '../../data/new_flashcard_data_samples.csv';
const outputCsvPath = '../../data/generated_flashcards_data_samples.csv';

const fetchLocalAudioUrl = async (numericTones) => {
    const params = new URLSearchParams({
        text1: numericTones,
        gender: "女聲",
        accent: "強勢腔（高雄腔）",
    });
    const url = `${TEXT_TO_SPEECH_API}?${params.toString()}`;

    try {
        // Fetch the audio data from the API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch audio');
        }

        // Get the response as a blob
        const data = await response.buffer();  // Use .buffer() instead of .blob() in Node.js

        // Define a local file path (you can modify the path as needed)
        const filePath = `../../data/generated_audios/${numericTones}.wav`;  // Save the file in the current directory

        // Write the binary data to a file
        fs.writeFileSync(filePath, data);  // This will write the file synchronously

        console.log(`Audio file saved to ${filePath}`);
        return filePath;  // Return the file path
    } catch (error) {
        console.error("Error fetching audio URL:", error);
        throw error;
    }
};

async function augmentFlashcardData(row) {
    try {
        const { origin } = row;
        
        // Fetch additional data from APIs
        const romanization = await fetchRomanizer(origin);
        const numericTones = await fetchNumericTones(origin);
        const audioUrl = await fetchLocalAudioUrl(numericTones);
        // const translation = await callOpenAIChat(origin);
        // const romanization = 'romanization';
        // const audioUrl = 'audioUrl';

        return {
            ...row,
            Romanization: romanization,
            AudioUrl: audioUrl,
            // Translation: translation
        };
    } catch (error) {
        console.error(`Error fetching data for row: ${row.origin}`, error);
        return row; // Return row as is if there's an error
    }
}

async function processCsv() {
    const rows = [];

    // Read the original CSV file
    fs.createReadStream(inputCsvPath)
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', async () => {
            console.log('CSV file successfully read');
            
            // Map rows to augment them with additional fields
            const augmentedRows = await Promise.all(rows.map(row => augmentFlashcardData(row)));

            // Define the output CSV writer
            const csvWriter = createObjectCsvWriter({
                path: outputCsvPath,
                header: [
                    { id: 'origin', title: 'Origin' },
                    { id: 'destination', title: 'Destination' },
                    { id: 'otherOptions', title: 'OtherOptions' },
                    { id: 'type', title: 'Type' },
                    { id: 'Romanization', title: 'Romanization' },
                    { id: 'AudioUrl', title: 'AudioUrl' },
                    // { id: 'Translation', title: 'Translation' }
                ]
            });

            // Write the augmented data to the new CSV file
            await csvWriter.writeRecords(augmentedRows);
            console.log('CSV file successfully written to', outputCsvPath);
        })
        .on('error', (error) => console.error('Error reading CSV file:', error));
}

const fetchAndAugmentFlashcards = async () => {
    const rows = [];

    // Step 1: Read the CSV and filter rows without Romanization
    fs.createReadStream(outputCsvPath)
        .pipe(csvParser())
        .on('data', (row) => {
            // Push the rows to the array, whether they have Romanization or not
            rows.push(row);
        })
        .on('end', async () => {
            // Step 2: Process each row, fetch missing Romanization and AudioUrl for rows without Romanization
            const updatedRows = [];

            for (let row of rows) {
                if (!row.Romanization) {  // Check if Romanization is missing
                    try {
                        // Fetch the augmented data
                        const romanization = await fetchRomanizer(row.Origin);
                        const numericTones = await fetchNumericTones(row.Origin);
                        const audioUrl = await fetchLocalAudioUrl(numericTones);

                        // Add the fetched data to the row
                        row.Romanization = romanization;
                        row.AudioUrl = audioUrl;

                        console.log(`Augmented data for ${row.Origin}`);
                    } catch (error) {
                        console.error(`Error augmenting data for ${row.Origin}:`, error);
                    }
                }
                // Always push the row (whether updated or not)
                updatedRows.push(row);
            }

            // Step 3: Write the augmented data back to a new CSV
            const csvHeader = ['Origin', 'Destination', 'OtherOptions', 'Type', 'Romanization', 'AudioUrl'];
            const csvData = updatedRows.map(row =>
                `${row.Origin},${row.Destination},"${row.OtherOptions}",${row.Type},${row.Romanization},${row.AudioUrl}`
            );

            const csvContent = [csvHeader.join(',')].concat(csvData).join('\n');

            fs.writeFileSync(outputCsvPath, csvContent);  // Write to the new CSV
            console.log('Augmented CSV file created:', outputCsvPath);
        });
};

// Start the process
processCsv();
// fetchAndAugmentFlashcards();
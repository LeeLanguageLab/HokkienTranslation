import React from 'react';
import { Text, HStack, IconButton, VStack, Box } from 'native-base';
import { Ionicons } from "@expo/vector-icons";
import TextToSpeech from './TextToSpeech'; 
import * as Clipboard from "expo-clipboard";
import { useTheme } from '../context/ThemeProvider';

const ExampleSentence = ({ sentence, audio = true, containerWidth }) => {
    const { theme, themes } = useTheme();
    const colors = themes[theme];

    const copyToClipboard = (text) => Clipboard.setString(text);

    return (
        <VStack width={containerWidth} maxWidth={{ base: "100%", md: containerWidth }}>
            <Text fontSize="md" fontWeight="bold" color={colors.onSurface} mt={2}>
                Example Sentence
            </Text>
            <HStack width="100%" flexWrap="wrap" alignItems="center">
                <Text flexShrink={1} fontSize="sm" color={colors.onSurface} maxWidth="100%">
                    {sentence || "No example sentence available."}
                </Text>
                <IconButton
                    icon={<Ionicons name="copy-outline" size={15} color={colors.onPrimaryContainer} />}
                    onPress={() => copyToClipboard(sentence)}
                    mt={-1}
                />
            </HStack>
            {audio && (
                <Box width="100%" maxWidth="100%">
                    <TextToSpeech 
                        prompt={sentence} 
                        type="sentence" 
                        fontSize="sm" 
                        style={{ 
                            flexShrink: 1, 
                            width: "100%", 
                            textAlign: "left"
                        }} 
                    />
                </Box>
            )}
        </VStack>
    );
};

export default ExampleSentence;

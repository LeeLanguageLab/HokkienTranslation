import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useTheme } from "./context/ThemeProvider";
import TextToSpeech from './components/TextToSpeech';

const roundBoxes = [
    { id: 1, label: 'Tone 1', roman: 'a1', marked: 'a'}, // char: '阿' },
    { id: 2, label: 'Tone 2', roman: 'a2', marked: 'á'}, // char: '啊' },
    { id: 3, label: 'Tone 3', roman: 'a3', marked: 'à'}, // char: '壓' },
    { id: 4, label: 'Tone 4', roman: 'a4', marked: 'â'}, // char: '亞' },
    { id: 5, label: 'Tone 5', roman: 'a6', marked: 'ā'}, // char: '啞' },
    { id: 6, label: 'Tone 6', roman: 'a5', marked: 'a̍h'}, // char: '揠' },
    { id: 7, label: 'Tone 7', roman: 'a7', marked: 'ah'}, // char: '吖' }
];

export default function LearnTonesScreen() {
    const { theme, themes } = useTheme();
    const colors = themes[theme];
    const styles = getStyles(colors);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>Learn Hokkien Tones</Text>
                <View style={styles.boxContainer}>
                    {roundBoxes.map(box => (
                        <View key={box.id} style={styles.roundBox}>
                            <Text style={[styles.marked, { color: colors.onSurface }]}>{box.marked}</Text>
                            <TextToSpeech prompt={box.marked} type={'translation'} />
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background || '#fff',
    },
    scroll: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        color: colors.primary,
    },
    boxContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
    },
    roundBox: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.primaryContainer || '#EADDFF',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    marked: {
        fontSize: 32,
        fontWeight: 'bold',
        // color will be overridden inline
        marginBottom: 4,
    },
    roman: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    speakerButton: {
        marginTop: 4,
        padding: 6,
        borderRadius: 20,
        backgroundColor: colors.background || '#fff',
        elevation: 1,
    },
});

import React, { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeProvider"; // you already use this elsewhere
import { compareTailo } from "../../utils/tailo";

export default function TailoCompareTest() {
  const [target, setTarget] = useState("i1 e5 tshing7 tshah4 tsin1 u7 phin2 bi7");
  const [user, setUser] = useState("i1 e5 tshing7 tshah2 tsin1 u7 phin2 bi7");
  const [result, setResult] = useState(null);
  const { themes, theme } = useTheme();
  const colors = themes[theme];

  const onCompare = () => setResult(compareTailo(user, target));

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.onSurface }]}>Tailo Pronunciation Feedback (Local Test)</Text>

      <Text style={[styles.label, { color: colors.onSurface }]}>Target Tailo Romanization</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.onSurface, color: colors.onSurface }]}
        value={target}
        onChangeText={setTarget}
        placeholder="e.g., i1 e5 tshing7 tshah4 tsin1 u7 phin2 bi7"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#9ca3af"
      />

      <Text style={[styles.label, { color: colors.onSurface }]}>User Tailo Romanization</Text>
      <TextInput
        style={[styles.input, { borderColor: colors.onSurface, color: colors.onSurface }]}
        value={user}
        onChangeText={setUser}
        placeholder="e.g., i1 e5 tshing7 tshah2 tsin1 u7 phin2 bi7"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#9ca3af"
      />

      <View style={{ marginVertical: 8 }}>
        <Button title="Compare" onPress={onCompare} />
      </View>

      {result && (
        <View style={{ marginTop: 16, alignSelf: "stretch" }}>
          <Text style={[styles.overall, { color: colors.onSurface }]}>
            Overall: {(result.overall * 100).toFixed(1)}%
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.onSurface, marginTop: 12 }]}>Feedback</Text>
          {result.items.map((it) => {
            const color =
              it.status === "correct" ? "#166534" :       // green-800
              it.status === "tone-mismatch" ? "#854d0e" : // amber-800
              it.status === "missing" ? "#374151" :       // gray-700
              it.status === "extra" ? "#6b21a8" :         // purple-800
              "#991b1b";                                  // red-800

            return (
              <Text key={it.index} style={{ color, marginBottom: 4, fontFamily: "monospace" }}>
                {(it.target || "∅") + "  →  " + (it.user ?? "∅") + "  —  " + it.message}
              </Text>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12,
    fontFamily: "monospace",
  },
  overall: { fontSize: 16, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
});

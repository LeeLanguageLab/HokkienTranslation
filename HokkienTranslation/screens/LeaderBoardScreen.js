import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, ScrollView } from "react-native";
import { View, Text, Spinner, Heading } from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./context/ThemeProvider";


const LeaderboardScreen = () => {
  const [levelBoard, setLevelBoard] = useState([]);
  const [streakBoard, setStreakBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { themes, theme } = useTheme();
  const colors = themes[theme];
  const baseUrl = "https://api-n72gsjbtpa-uc.a.run.app/";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [levelsRes, streaksRes] = await Promise.all([
          fetch(`${baseUrl}leaderboard/points`),
          fetch(`${baseUrl}leaderboard/streaks`)
        ]);
        const levels = await levelsRes.json();
        const streaks = await streaksRes.json();

        setLevelBoard(levels);
        setStreakBoard(streaks);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const renderItem = (item, index, icon) => (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <Text style={[styles.rank, { color: colors.onSurface }]}>#{index + 1}</Text>
      <Text style={[styles.name, { color: colors.onSurface }]}>{item.username}</Text>
      <View style={styles.metric}>
        <Ionicons name={icon} size={16} color={icon === "flame" ? "#FF6B35" : "#4ECDC4"} />
        <Text style={[styles.metricText, { color: colors.onSurface }]}>
          {item.value}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <Spinner color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Heading size="md" color={colors.onSurface} mb={2}>
        Top 10 by Level
      </Heading>
      <FlatList
        data={levelBoard}
        keyExtractor={(item, index) => `lvl-${index}`}
        scrollEnabled={false}
        renderItem={({ item, index }) => renderItem(item, index, "trophy")}
      />

      <Heading size="md" color={colors.onSurface} mt={6} mb={2}>
        Top 10 by Streak
      </Heading>
      <FlatList
        data={streakBoard}
        keyExtractor={(item, index) => `strk-${index}`}
        scrollEnabled={false}
        renderItem={({ item, index }) => renderItem(item, index, "flame")}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  row: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8
  },
  rank: {
    width: 40,
    fontSize: 16,
    fontWeight: "bold"
  },
  name: {
    flex: 1,
    fontSize: 16
  },
  metric: {
    flexDirection: "row",
    alignItems: "center"
  },
  metricText: {
    marginLeft: 4,
    fontWeight: "bold",
    fontSize: 16
  }
});

export default LeaderboardScreen;

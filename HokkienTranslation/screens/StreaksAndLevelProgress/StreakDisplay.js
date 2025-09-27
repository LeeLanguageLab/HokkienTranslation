import {StyleSheet} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {checkAndUpdateStreak} from "../../backend/streaks/CheckAndUpdateStreak";
import {useEffect, useState} from "react";
import {View, Text} from "native-base";
import {useTheme} from "../context/ThemeProvider"
import {useToast} from "react-native-toast-notifications";

export const StreakDisplay = () => {
    const [loading, setLoading] = useState(true);
    const [streakData, setStreakData] = useState({streakCount: 0, isNewStreak: false});
    const {themes, theme} = useTheme();
    const colors = themes?.[theme] || {};
    const toast = useToast();

    useEffect(() => {
        const updateStreak = async () => {
            try {
                const result = await checkAndUpdateStreak();
                if (result && typeof result === 'object' && !result.error) {
                    setStreakData(result);
                } else {
                    setStreakData({streakCount: 1});
                }
                if (result.isNewStreak && result.streakCount > 1) {
                    console.log("Toast for streaks is working")
                    toast.show(`New Streak achieved of "${result.streakCount} days! Congratulations!"`, {
                        type: 'success',
                        placement: 'top',
                        duration: 4000,
                        animationType: 'slide-in',
                    });
                }
            } catch (error) {
                console.error("Error updating streak:", error);
                setStreakData({streakCount: 0});
            } finally {
                setLoading(false);
            }
        };

        updateStreak();
    }, []);

    if (loading) {
        return (
            <View style={styles.streakContainer}>
                <Text style={[styles.streakText, {color: colors.onSurface}]}>
                    Loading...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color="#FF6B35"/>
            <Text style={[styles.streakText, {color: colors.onSurface}]}>
                {streakData?.streakCount || 1}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    streakText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

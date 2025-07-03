import {useEffect, useState} from "react";
import {View, Text, HStack} from "native-base";
import getCurrentUser from "../../backend/database/GetCurrentUser";
import {getUserLevel, getUserPoints} from "../../backend/database/LeitnerSystemHelpers";
import {StyleSheet} from "react-native";
import * as Progress from "react-native-progress";
import {useTheme} from "../context/ThemeProvider"

export const LevelProgress = () => {
    const [loading, setLoading] = useState(true);
    const [userLevel, setUserLevel] = useState(null);
    const [userPoints, setUserPoints] = useState(null);
    const [levelProgress, setLevelProgress] = useState(0);
    const {themes, theme} = useTheme();
    const colors = themes?.[theme] || {};
    const pointsPerLevel = 100;

    useEffect(() => {
        const fetchUserLevelData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                const level = await getUserLevel(user, pointsPerLevel);
                const points = await getUserPoints(user);

                setUserLevel(level || 1);
                setUserPoints(points || 0);
                setLevelProgress(((points || 0) - (((level || 1) - 1) * 100)) / 100);
            } catch (error) {
                console.error("Error fetching user level:", error);
                setUserLevel(1);
                setUserPoints(0);
                setLevelProgress(0);
            } finally {
                setLoading(false);
            }
        };

        fetchUserLevelData();
    }, []);

    if (loading) {
        return (
            <View style={styles.levelContainer}>
                <Text style={[styles.levelText, {color: colors.onSurface}]}>
                    Loading...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.levelContainer}>
            <HStack space={2} alignItems="center" justifyContent="center">
                <Text style={[styles.levelText, {color: colors.onSurface}]}>
                     {userLevel || "..."}
                </Text>
                <Progress.Bar
                    progress={levelProgress || 0}
                    width={80}
                    height={15}
                    color={colors.primaryContainer}
                    unfilledColor={colors.surface}
                    borderWidth={0}
                />
                <Text style={[styles.pointsText, {color: colors.onSurface}]}>
                    {userPoints || 0}/{(userLevel || 1) * 100}
                </Text>
            </HStack>
        </View>
    );
};

const styles = StyleSheet.create({
    levelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    pointsText: {
        fontSize: 10,
        marginTop: 1,
        opacity: 0.8,
    },
});

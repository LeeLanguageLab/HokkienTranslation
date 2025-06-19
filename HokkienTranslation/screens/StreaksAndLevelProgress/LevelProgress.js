import {useEffect, useRef, useState} from "react";
import {View, Text, HStack} from "native-base";
import {StyleSheet, TouchableOpacity} from "react-native";
import * as Progress from "react-native-progress";
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import getCurrentUser from "../../backend/database/GetCurrentUser";
import {getUserLevel, getUserPoints} from "../../backend/database/LeitnerSystemHelpers";
import {useTheme} from "../context/ThemeProvider"
import {recordLevelCompletion} from "../../backend/badges/EventTracker";
import getCurrentUserActual from "../../backend/database/GetCurrentUserActual";

export const LevelProgress = () => {
    const [loading, setLoading] = useState(true);
    const [userLevel, setUserLevel] = useState(null);
    const [userPoints, setUserPoints] = useState(null);
    const [levelProgress, setLevelProgress] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    const {themes, theme} = useTheme();
    const colors = themes?.[theme] || {};
    const navigation = useNavigation();

    const previousLevel = useRef(null)

    const pointsPerLevel = 100;

    useFocusEffect(() => {
        const fetchUserLevelData = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                setCurrentUser(user);
                const level = await getUserLevel(user, pointsPerLevel);
                const points = await getUserPoints(user);

                const currentLevel = level || 1;
                const currentPoints = points + 100 || 0;

                // Check if level has changed
                if (previousLevel.current !== null && previousLevel.current < currentLevel) {
                    const userActual = await getCurrentUserActual()
                    const userId = userActual?.uid;
                    await recordLevelCompletion(userId, currentLevel)
                    console.log(`Level up! ${previousLevel.current} → ${currentLevel}`);
                }

                // Update the previous level reference
                previousLevel.current = currentLevel;
                console.log(`Current Level: ${currentLevel}, Progress: ${levelProgress}`);

                setUserLevel(currentLevel);
                setUserPoints(currentPoints);
                setLevelProgress((currentPoints - ((currentLevel - 1) * 100)) / 100);

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
    });

    const handlePress = () => {
        if (currentUser) {
            navigation.navigate('BadgeScreen', {userId: currentUser.uid});
        }
    };

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
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
            <View style={styles.levelContainer}>
                <Text style={[styles.levelText, {color: colors.text}]}>
                    Level {userLevel || "..."}
                </Text>

                <Progress.Bar
                    progress={levelProgress || 0}
                    width={80}
                    height={10}
                    color={colors.primaryContainer}
                    unfilledColor={colors.surface}
                    borderWidth={0}
                />
                <Text style={[styles.pointsText, {color: colors.onSurface}]}>
                    {userPoints || 0}/{(userLevel || 1) * 100}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    levelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
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

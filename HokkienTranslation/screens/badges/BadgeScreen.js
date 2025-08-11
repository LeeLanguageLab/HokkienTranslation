import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl, TouchableOpacity,
    SectionList, Platform
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import Badge from './Badge';
import {getBadgeScreenData} from "../../backend/badges/BadgesFunctions";
import {useTheme} from "../context/ThemeProvider";
import {createDynamicStyles} from "./DynamicStyles";
import getCurrentUserActual from "../../backend/database/GetCurrentUserActual";
import MixpanelService from "../../backend/API/Mixpanel";
import {Dimensions} from "react-native";


const BadgeScreen = () => {
    const route = useRoute();

    const BADGE_CARD_WIDTH = 140; // Fixed width for each badge card
    const CARD_MARGIN = 12; // Margin around each card
    const CONTAINER_PADDING = 16; // Container padding

    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - (CONTAINER_PADDING * 2);
    const numColumns = Math.floor(availableWidth / (BADGE_CARD_WIDTH + CARD_MARGIN));
    const actualColumns = Math.max(numColumns, 1); // Ensure at least 1 column

    // Calculate spacing to center the cards
    const totalCardWidth = actualColumns * (BADGE_CARD_WIDTH + CARD_MARGIN);
    const remainingSpace = availableWidth - totalCardWidth;
    const sideMargin = Math.max(remainingSpace / 2, 0);


    const [user, setUser] = useState(null);
    useEffect(() => {
        const loadUser = async () => {
            const userActual = await getCurrentUserActual();
            setUser(userActual);
        };

        const initializeMixpanel = async () => {
            try {
                await MixpanelService.initialize();
                MixpanelService.track("Badge Screen Viewed", {});
                MixpanelService.flush();
            } catch (error) {
                console.error("Mixpanel initialization error:", error);
            }
        }

        loadUser();
        initializeMixpanel();
    }, []);

    const {themes, theme} = useTheme();
    const colors = themes?.[theme] || {};

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [badgeData, setBadgeData] = useState({
        allBadges: [],
        userEarnedBadges: [],
        userProgress: {}
    });

    // Initialize default badge data
    const initializeBadgeData = () => ({
        allBadges: [],
        userEarnedBadges: [],
        userProgress: {}
    });

    // Validate badge data
    const validateBadgeData = (data) => {
        if (!data) return initializeBadgeData();

        return {
            allBadges: Array.isArray(data.allBadges) ? data.allBadges.filter(badge =>
                badge &&
                typeof badge === 'object' &&
                badge.achievement_id &&
                badge.name
            ) : [],
            userEarnedBadges: Array.isArray(data.userEarnedBadges) ? data.userEarnedBadges.filter(badge =>
                badge &&
                typeof badge === 'object' &&
                badge.achievement_id
            ) : [],
            userProgress: data.userProgress && typeof data.userProgress === 'object' ? data.userProgress : {}
        };
    };

    // Load badge data with error handling
    const loadBadgeData = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            setError(null);

            if (!user?.uid) {
                throw new Error('No user Id provided');
            }

            const data = await getBadgeScreenData(user.uid);
            const validatedData = validateBadgeData(data);
            setBadgeData(validatedData);

        } catch (error) {
            console.error('Error loading badge data:', error);
            setError(error.message || 'Failed to load badge data');
            setBadgeData(initializeBadgeData());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadBadgeData().catch(error => {
                console.error('Error in loading badge data', error);
            });
        } else {
            setLoading(false);
            setError('No user ID provided');
        }
    }, [user]);

    // Refresh function
    const onRefresh = () => {
        setRefreshing(true);
        loadBadgeData(false);
    };

    // Safely separate badges with null checks
    const earnedBadges = badgeData.allBadges.filter(badge =>
        badge &&
        badge.achievement_id &&
        badgeData.userEarnedBadges.some(earned =>
            earned && earned.achievement_id === badge.achievement_id
        )
    );

    const unearnedBadges = badgeData.allBadges.filter(badge =>
        badge &&
        badge.achievement_id &&
        !badgeData.userEarnedBadges.some(earned =>
            earned && earned.achievement_id === badge.achievement_id
        )
    );

    // Get earned date with null checks
    const getEarnedDate = (badgeId) => {
        if (!badgeId || !badgeData.userEarnedBadges) return null;

        const earnedBadge = badgeData.userEarnedBadges.find(
            earned => earned && earned.achievement_id === badgeId
        );
        return earnedBadge ? earnedBadge.earned_at : null;
    };

    // Get progress with null checks
    const getProgress = (badgeId) => {
        if (!badgeId || !badgeData.userProgress) return 0;
        return badgeData.userProgress[badgeId] || 0;
    };

    // Render individual badge item with null checks
    const renderBadgeItem = ({item, isEarned}) => {
        if (!item || !item.achievement_id) {
            return (
                <View style={dynamicStyles.badgeItemContainer}>
                    <Text style={dynamicStyles.errorText}>Invalid badge data</Text>
                </View>
            );
        }

        return (
            <View style={dynamicStyles.badgeItemContainer}>
                <Badge
                    badge={item}
                    isEarned={isEarned}
                    progress={getProgress(item.achievement_id)}
                    earnedDate={isEarned ? getEarnedDate(item.achievement_id) : null}
                />
            </View>
        );
    };

    const dynamicStyles = createDynamicStyles(colors);

    // Error state
    if (error && !loading) {
        return (
            <View style={dynamicStyles.errorContainer}>
                <Text style={dynamicStyles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity
                    style={dynamicStyles.retryButton}
                    onPress={() => loadBadgeData()}
                >
                    <Text style={dynamicStyles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.onPrimaryContainer || '#3b82f6'}/>
                <Text style={dynamicStyles.loadingText}>Loading user...</Text>
            </View>
        );
    }

    // Loading state
    if (loading) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.onPrimaryContainer || '#3b82f6'}/>
                <Text style={dynamicStyles.loadingText}>Loading badges...</Text>
            </View>
        );
    }

    // Calculate overall progress safely
    const totalBadges = badgeData.allBadges.length || 0;
    const earnedCount = earnedBadges.length || 0;
    const progressPercentage = totalBadges > 0 ? (earnedCount / totalBadges) * 100 : 0

    const allBadgesData = [
        ...earnedBadges.map(badge => ({...badge, isEarned: true})),
        ...unearnedBadges.map(badge => ({...badge, isEarned: false}))
    ];
    const sections = [
        {
            title: '🏆 Badges Earned',
            count: earnedCount,
            data: earnedBadges.map(badge => ({...badge, isEarned: true}))
        },
        {
            title: '🔒 Badges to be Acquired',
            count: unearnedBadges.length,
            data: unearnedBadges.map(badge => ({...badge, isEarned: false}))
        }
    ];

    const renderHeader = () => (
        <View style={dynamicStyles.header}>
            {/*<Text style={dynamicStyles.headerTitle}>Badge Collection</Text>*/}

            <View style={dynamicStyles.progressContainer}>
                <Text style={dynamicStyles.progressText}>
                    {earnedCount} of {totalBadges} badges earned
                </Text>

                {/* Progress Bar */}
                <View style={dynamicStyles.progressBar}>
                    <View style={dynamicStyles.progressBarTrack}>
                        <View
                            style={[
                                dynamicStyles.progressFill,
                                {width: `${Math.round(progressPercentage)}%`}
                            ]}
                        />
                    </View>
                </View>

                <Text style={dynamicStyles.progressPercentage}>
                    {Math.round(progressPercentage)}% Complete
                </Text>
            </View>
        </View>
    );

    const renderSectionHeader = ({section}) => (
        <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
            <View style={dynamicStyles.badgeCount}>
                <Text style={dynamicStyles.badgeCountText}>{section.count}</Text>
            </View>
        </View>)

    const renderBadgeGrid = () => {
        const badges = allBadgesData;
        const rows = [];

        for (let i = 0; i < badges.length; i += actualColumns) {
            const row = badges.slice(i, i + actualColumns);
            rows.push(
                <View key={`row-${i}`} style={[dynamicStyles.gridRow, {paddingHorizontal: sideMargin}]}>
                    {row.map((badge, index) => (
                        <View key={badge.achievement_id || `badge-${i + index}`} style={dynamicStyles.gridItem}>
                            <Badge
                                badge={badge}
                                isEarned={badge.isEarned}
                                progress={getProgress(badge.achievement_id)}
                                earnedDate={badge.isEarned ? getEarnedDate(badge.achievement_id) : null}
                            />
                        </View>
                    ))}
                    {/* Fill empty spaces for incomplete rows */}
                    {Array.from({ length: actualColumns - row.length }).map((_, emptyIndex) => (
                        <View key={`empty-${i}-${emptyIndex}`} style={dynamicStyles.gridItem} />
                    ))}
                </View>
            );
        }
        return rows;
    }

    const renderBadgeList = () => {
        if (Platform.OS === "web") {
            return (
                <ScrollView
                    contentContainerStyle={dynamicStyles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                >
                    {renderHeader()}
                    {renderBadgeGrid()}
                </ScrollView>
            );
        } else {
            return (

                <FlatList
                    data={allBadgesData}
                    renderItem={({item}) => renderBadgeItem({item, isEarned: item.isEarned})}
                    keyExtractor={(item, index) => item.achievement_id || `badge-${index}`}
                    numColumns={2}
                    ListHeaderComponent={renderHeader}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                    contentContainerStyle={dynamicStyles.scrollContent}
                    columnWrapperStyle={dynamicStyles.row}
                />)
        }
    }

    return (
        <SafeAreaView style={dynamicStyles.container}>
            {renderBadgeList()}
        </SafeAreaView>
    );
};


// return (
//     <SafeAreaView style={dynamicStyles.container}>
//         {/* Header with overall progress */}
//         <View style={dynamicStyles.header}>
//             <Text style={dynamicStyles.headerTitle}>Badge Collection</Text>
//             <View style={dynamicStyles.progressContainer}>
//                 <Text style={dynamicStyles.progressText}>
//                     {earnedCount} of {totalBadges} badges earned
//                 </Text>
//                 <View style={dynamicStyles.progressBar}>
//                     <View
//                         style={[
//                             dynamicStyles.progressFill,
//                             {width: `${Math.max(0, Math.min(progressPercentage, 100))}%`}
//                         ]}
//                     />
//                 </View>
//                 <Text style={dynamicStyles.progressPercentage}>
//                     {Math.round(progressPercentage)}% Complete
//                 </Text>
//             </View>
//         </View>
//
//         <ScrollView
//             style={dynamicStyles.scrollView}
//             contentContainerStyle={dynamicStyles.scrollContent}
//             showsVerticalScrollIndicator={false}
//             refreshControl={
//                 <RefreshControl
//                     refreshing={refreshing}
//                     onRefresh={onRefresh}
//                     tintColor={colors.onPrimaryContainer || '#3b82f6'}
//                 />
//             }
//         >
//             {/* Earned Badges Section */}
//             <View style={dynamicStyles.section}>
//                 <View style={dynamicStyles.sectionHeader}>
//                     <Text style={dynamicStyles.sectionTitle}>🏆 Badges Earned</Text>
//                     <View style={dynamicStyles.badgeCount}>
//                         <Text style={dynamicStyles.badgeCountText}>{earnedCount}</Text>
//                     </View>
//                 </View>
//
//                 {earnedBadges.length > 0 ? (
//                     <FlatList
//                         key={`earned-${numColumns}`}
//                         data={earnedBadges}
//                         renderItem={({item}) => renderBadgeItem({item, isEarned: true})}
//                         keyExtractor={(item, index) => item?.achievement_id || `earned-${index}`}
//                         numColumns={2}
//                         // scrollEnabled={false}
//                         contentContainerStyle={dynamicStyles.badgeList}
//                         columnWrapperStyle={dynamicStyles.row}
//                     />
//                 ) : (
//                     <View style={dynamicStyles.emptyState}>
//                         <Text style={dynamicStyles.emptyStateText}>No badges earned yet</Text>
//                         <Text style={dynamicStyles.emptyStateSubtext}>
//                             Start completing quizzes and levels to earn your first badge!
//                         </Text>
//                     </View>
//                 )}
//             </View>
//
//             {/* Separator */}
//             <View style={dynamicStyles.separator}/>
//
//             {/* Unearned Badges Section */}
//             <View style={dynamicStyles.section}>
//                 <View style={dynamicStyles.sectionHeader}>
//                     <Text style={dynamicStyles.sectionTitle}>🔒 Badges to be Acquired</Text>
//                     <View style={dynamicStyles.badgeCount}>
//                         <Text style={dynamicStyles.badgeCountText}>{unearnedBadges.length}</Text>
//                     </View>
//                 </View>
//
//                 {unearnedBadges.length > 0 ? (
//                     <FlatList
//                         key={`unearned-${numColumns}`}
//                         data={unearnedBadges}
//                         renderItem={({item}) => renderBadgeItem({item, isEarned: false})}
//                         keyExtractor={(item, index) => item?.achievement_id || `unearned-${index}`}
//                         numColumns={2}
//                         // scrollEnabled={false}
//                         contentContainerStyle={dynamicStyles.badgeList}
//                         columnWrapperStyle={dynamicStyles.row}
//                     />
//                 ) : (
//                     <View style={dynamicStyles.emptyState}>
//                         <Text style={dynamicStyles.emptyStateText}>All badges earned!</Text>
//                         <Text style={dynamicStyles.emptyStateSubtext}>
//                             Congratulations! You've earned every available badge.
//                         </Text>
//                     </View>
//                 )}
//             </View>
//         </ScrollView>
//     </SafeAreaView>
// );
// }
// ;


export default BadgeScreen;

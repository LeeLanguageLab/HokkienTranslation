import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from "../context/ThemeProvider";
import {createDynamicStyles} from "./DynamicStyles";

const Badge = ({
                   badge = null,
                   isEarned = false,
                   progress = 0,
                   earnedDate = null
               }) => {
    const {themes, theme} = useTheme();
    const colors = themes?.[theme] || {};

    const formatEarnedDate = (earnedDate) => {
        try {
            // Handle Firebase Timestamp object (from serverTimestamp)
            if (earnedDate && typeof earnedDate === 'object' && earnedDate.seconds) {
                return earnedDate.toDate().toLocaleDateString();
            }

            // Handle ISO string format (2025-06-19T11:17:45.563Z)
            if (typeof earnedDate === 'string' && earnedDate.includes('T')) {
                return new Date(earnedDate).toLocaleDateString();
            }

            // Handle Firebase timestamp string format (June 23, 2025 at 4:09:18 PM UTC+5:30)
            if (typeof earnedDate === 'string' && earnedDate.includes(' at ')) {
                const datePart = earnedDate.split(' at ')[0];
                return new Date(datePart).toLocaleDateString();
            }

            // Fallback for other formats or Date objects
            return new Date(earnedDate).toLocaleDateString();
        } catch (error) {
            console.warn('Error parsing date:', earnedDate, error);
            return 'Invalid date';
        }
    };

    // Early return if badge is null/undefined
    if (!badge) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Badge data not available</Text>
            </View>
        );
    }

    // Add null checks for all badge properties
    const safeBadge = {
        rarity: badge.rarity || 'common',
        category: badge.category || 'general',
        name: badge.name || 'Unknown Badge',
        description: badge.description || 'No description available',
        required_criteria: badge.required_criteria || {target_value: 1},
        achievement_id: badge.achievement_id || 'unknown'
    };

    const getRarityColors = (rarity) => {
        const rarityColors = {
            common: ['#6b7280', '#9ca3af'],
            uncommon: ['#10b981', '#34d399'],
            rare: ['#3b82f6', '#60a5fa'],
            epic: ['#8b5cf6', '#a78bfa'],
            legendary: ['#f59e0b', '#fbbf24']
        };
        return rarityColors[rarity] || rarityColors.common;
    };

    const getBadgeIcon = (category) => {
        const icons = {
            quiz_participation: '🧠',
            level_completion: '🎯',
            daily_streak: '🔥',
            high_score: '⭐',
            deck_completion: '📚',
            speed: '⚡',
            social: '🤝',
            persistence: '💪',
            general: '🏆'
        };
        return icons[category] || '🏆';
    };

    const rarityColors = getRarityColors(safeBadge.rarity);
    const badgeIcon = getBadgeIcon(safeBadge.category);
    const dynamicStyles = createDynamicStyles(colors, rarityColors, isEarned);

    return (
        <View style={[
            dynamicStyles.badgeCard,
            isEarned ? dynamicStyles.earnedCard : dynamicStyles.unearnedCard
        ]}>
            {/* Circular Badge Icon */}
            <View style={dynamicStyles.badgeIconContainer}>
                <View style={[
                    dynamicStyles.badgeIconOuter,
                    {borderColor: isEarned ? rarityColors[0] : colors.outlineVariant || '#d1d5db'}
                ]}>
                    <LinearGradient
                        colors={isEarned ? rarityColors : [colors.categoriesContainer || '#f3f4f6', colors.outlineVariant || '#e5e7eb']}
                        style={dynamicStyles.badgeIconGradient}
                    >
                        <View style={[
                            dynamicStyles.badgeIconInner,
                            !isEarned && dynamicStyles.grayscaleFilter
                        ]}>
                            <Text style={[
                                dynamicStyles.badgeIcon,
                                !isEarned && dynamicStyles.grayscaleText
                            ]}>
                                {badgeIcon}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            </View>

            {/* Badge Content */}
            <View style={dynamicStyles.badgeContent}>
                <Text style={[
                    dynamicStyles.badgeName,
                    !isEarned && dynamicStyles.mutedText
                ]}>
                    {safeBadge.name}
                </Text>

                <Text style={[
                    dynamicStyles.badgeDescription,
                    !isEarned && dynamicStyles.mutedText
                ]}>
                    {safeBadge.description}
                </Text>

                {/* Progress Section for Unearned Badges */}
                {!isEarned && progress > 0 && safeBadge.required_criteria?.target_value && (
                    <View style={dynamicStyles.progressSection}>
                        <View style={dynamicStyles.progressBar}>
                            <View
                                style={[
                                    dynamicStyles.progressFill,
                                    {
                                        width: `${Math.min((progress / safeBadge.required_criteria.target_value) * 100, 100)}%`,
                                        backgroundColor: rarityColors[0]
                                    }
                                ]}
                            />
                        </View>
                        <Text style={dynamicStyles.progressTextBadge}>
                            {progress} / {safeBadge.required_criteria.target_value}
                        </Text>
                    </View>
                )}

                {/* Rarity Text */}
                <Text style={[
                    dynamicStyles.rarityText,
                    {color: isEarned ? rarityColors[0] : colors.onSurfaceVariant || '#9ca3af'}
                ]}>
                    {safeBadge.rarity.charAt(0).toUpperCase() + safeBadge.rarity.slice(1)} Badge
                </Text>

                {/* Earned Date */}
                {isEarned && earnedDate && (
                    <View style={dynamicStyles.earnedDateContainer}>
                        <Text style={dynamicStyles.earnedDateText}>
                            Earned {formatEarnedDate(earnedDate)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Status Indicator */}
            <View style={dynamicStyles.statusContainer}>
                {isEarned ? (
                    <View style={[
                        dynamicStyles.statusEarned,
                        {
                            backgroundColor: `${rarityColors[0]}20`,
                            borderColor: rarityColors[0]
                        }
                    ]}>
                        <Text style={[
                            dynamicStyles.statusEarnedText,
                            {color: rarityColors[0]}
                        ]}>
                            ✓ Completed
                        </Text>
                    </View>
                ) : (
                    <View style={dynamicStyles.statusLocked}>
                        <Text style={dynamicStyles.statusLockedText}>🔒 Locked</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

// Add default props
Badge.defaultProps = {
    badge: {
        rarity: 'common',
        category: 'general',
        name: 'Default Badge',
        description: 'Default badge description',
        required_criteria: {target_value: 1},
        achievement_id: 'default'
    },
    isEarned: false,
    progress: 0,
    earnedDate: null
};

const styles = StyleSheet.create({
    badgeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        margin: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        width: 300,
        alignItems: 'center',
    },

    earnedCard: {
        backgroundColor: '#ffffff',
    },

    unearnedCard: {
        opacity: 0.6,
        backgroundColor: '#f9fafb',
    },

    // Badge Icon Styles
    badgeIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },

    badgeIconOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        padding: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeIconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeIcon: {
        fontSize: 48,
    },

    grayscaleFilter: {
        opacity: 0.4,
    },

    grayscaleText: {
        opacity: 0.3,
    },

    // Content Styles
    badgeContent: {
        alignItems: 'center',
        width: '100%',
    },

    badgeName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 8,
    },

    badgeDescription: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 12,
    },

    // Progress Styles (Added back)
    progressSection: {
        width: '100%',
        marginVertical: 12,
    },

    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        marginBottom: 8,
    },

    progressFill: {
        height: '100%',
        borderRadius: 4,
    },

    progressText: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        textAlign: 'center',
    },

    rarityText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    mutedText: {
        color: '#9ca3af',
    },

    // Earned Date Styles
    earnedDateContainer: {
        marginTop: 8,
        marginBottom: 12,
    },

    earnedDateText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },

    // Status Styles
    statusContainer: {
        alignItems: 'center',
        width: '100%',
    },

    statusEarned: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },

    statusEarnedText: {
        fontSize: 13,
        fontWeight: '600',
    },

    statusLocked: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },

    statusLockedText: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: '600',
    },

    errorContainer: {
        padding: 20,
        backgroundColor: '#fee2e2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fecaca',
        margin: 8,
        alignItems: 'center',
    },

    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default Badge;

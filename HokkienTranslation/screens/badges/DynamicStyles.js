import {StyleSheet} from "react-native";

export const createDynamicStyles = (colors, rarityColors, isEarned) => StyleSheet.create({
    // Main Container Styles (Missing)
    container: {
        flex: 1,
        backgroundColor: colors.surface || '#f8fafc',
    },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface || '#f8fafc',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.onSurfaceVariant || '#6b7280',
        fontWeight: '500',
    },

    // Header Styles (Missing)
    header: {
        backgroundColor: colors.header || '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant || '#e5e7eb',
        shadowColor: colors.onSurface || '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },

    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.onSurface || '#1f2937',
        textAlign: 'center',
        marginBottom: 12,
    },

    // Progress Styles (Missing)
    progressContainer: {
        alignItems: 'center',
    },

    progressText: {
        fontSize: 14,
        color: colors.onSurfaceVariant || '#6b7280',
        marginBottom: 8,
        fontWeight: '500',
    },

    progressTextBadge: {
        fontSize: 10,
        color: colors.onSurfaceVariant || '#6b7280',
        marginBottom: 8,
        fontWeight: '500',
    },

    progressPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.onPrimaryContainer || '#10b981',
    },

    // Scroll View Styles (Missing)
    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingBottom: 20,
    },

    // Section Styles (Missing)
    section: {
        // paddingHorizontal: 16,
        paddingVertical: 20,
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.onSurface || '#1f2937',
    },

    badgeCount: {
        backgroundColor: colors.primaryContainer || '#3b82f6',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.buttonBorder || '#e5e7eb',
    },

    badgeCountText: {
        color: colors.onPrimaryContainer || '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },

    badgeList: {
        alignItems: 'center',
        paddingVertical: 4,
    },

    badgeItemContainer: {
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 16,
        backgroundColor: colors.categoriesContainer || '#ffffff',
        borderRadius: 12,
        marginHorizontal: 8,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: colors.outlineVariant || '#e5e7eb',
        borderStyle: 'dashed',
    },

    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.onSurfaceVariant || '#6b7280',
        marginBottom: 8,
        textAlign: 'center',
    },

    emptyStateSubtext: {
        fontSize: 14,
        color: colors.onSurfaceVariant || '#9ca3af',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
        opacity: 0.8,
    },

    separator: {
        height: 1,
        backgroundColor: colors.outlineVariant || '#e5e7eb',
        marginHorizontal: 20,
        marginVertical: 8,
    },

    badgeCard: {
        backgroundColor: colors.surface || '#ffffff',
        borderRadius: 16,
        padding: 16,
        margin: 6,
        shadowColor: colors.onSurface || '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: colors.outlineVariant || '#e5e7eb',
        width: 150,
        height: 250,
        alignItems: 'center',
        justifyContent: 'center',
    },

    earnedCard: {
        backgroundColor: colors.surface || '#ffffff',
        borderColor: colors.buttonBorder || '#10b981',
    },

    unearnedCard: {
        opacity: 0.6,
        backgroundColor: colors.categoriesContainer || '#f9fafb',
    },

    // Badge Icon Styles
    badgeIconContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },

    badgeIconOuter: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: isEarned ? (rarityColors?.[0] || colors.onPrimaryContainer) : colors.outlineVariant,
    },

    badgeIconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeIconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
        backgroundColor: colors.surface || 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    badgeIcon: {
        fontSize: 24,
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
        fontSize: 14,
        fontWeight: '600',
        color: colors.onSurface || '#1f2937',
        textAlign: 'center',
        marginBottom: 4,
        numberOfLines: 2,
    },

    badgeDescription: {
        fontSize: 11,
        color: colors.onSurfaceVariant || '#6b7280',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 6,
        numberOfLines: 2,
    },

    // Progress Styles
    progressSection: {
        width: '100%',
        marginVertical: 6,
    },

    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: colors.outlineVariant || '#e5e7eb',
        borderRadius: 2,
        marginBottom: 4,
    },

    progressBarTrack: {
        width: '100%',
        height: 8,
        backgroundColor: colors.outlineVariant || '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: rarityColors?.[0] || colors.onPrimaryContainer || '#10b981',
    },

    rarityText: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        color: isEarned ? (rarityColors?.[0] || colors.onPrimaryContainer) : colors.onSurfaceVariant,
    },

    mutedText: {
        color: colors.onSurfaceVariant || '#9ca3af',
        opacity: 0.6,
    },

    // Earned Date Styles
    earnedDateContainer: {
        marginTop: 8,
        marginBottom: 12,
    },

    earnedDateText: {
        fontSize: 9,
        color: colors.onSurfaceVariant || '#6b7280',
        textAlign: 'center',
    },

    // Status Styles
    statusContainer: {
        alignItems: 'center',
        width: '100%',
    },

    statusEarned: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: rarityColors?.[0] ? `${rarityColors[0]}20` : `${colors.onPrimaryContainer || '#10b981'}20`,
        borderColor: rarityColors?.[0] || colors.onPrimaryContainer || '#10b981',
    },

    statusEarnedText: {
        fontSize: 10,
        fontWeight: '600',
        color: rarityColors?.[0] || colors.onPrimaryContainer || '#10b981',
    },

    statusLocked: {
        backgroundColor: colors.categoriesContainer || '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.outlineVariant || '#d1d5db',
    },

    statusLockedText: {
        color: colors.onSurfaceVariant || '#6b7280',
        fontSize: 10,
        fontWeight: '600',
    },

    // Error Handling Styles
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: colors.surface || '#ffffff',
    },

    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 16,
    },

    retryButton: {
        backgroundColor: colors.primaryContainer || '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },

    retryButtonText: {
        color: colors.onPrimaryContainer || '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },

    badgeGrid: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    row: {
        flex: 1,
        justifyContent: 'space-around',
        marginBottom: 12,
        // paddingHorizontal: 4,
    },

    sectionHeaderContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface || '#ffffff',
    },

});

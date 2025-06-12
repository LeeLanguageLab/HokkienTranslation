// backend/badges/BadgeNotifications.js
import { Alert } from 'react-native';

// Note: You'll need to get the toast instance from your component
// We'll create functions that accept the toast instance as a parameter

export const showBadgeNotification = (newBadges, toast) => {
  if (newBadges.length === 1) {
    const badge = newBadges[0];

    // Show toast notification using react-native-toast-notifications
    toast.show(`🏆 Badge Earned: "${badge.name}"`, {
      type: 'success',
      placement: 'top',
      duration: 4000,
      animationType: 'slide-in',
    });

    // Show special alerts for streak badges
    if (badge.category === 'daily_streak') {
      setTimeout(() => {
        Alert.alert(
          '🔥 Streak Badge Earned!',
          `Amazing! You've maintained a ${badge.required_criteria.target_value}-day streak!\n\n"${badge.name}"\n${badge.description}`,
          [
            { text: 'Keep it up!', style: 'default' }
          ]
        );
      }, 1000);
    } else if (badge.rarity === 'epic' || badge.rarity === 'legendary') {
      setTimeout(() => {
        Alert.alert(
          '🏆 Special Badge Earned!',
          `Congratulations! You earned the ${badge.rarity} badge "${badge.name}"\n\n${badge.description}`,
          [
            { text: 'Awesome!', style: 'default' }
          ]
        );
      }, 1000);
    }

  } else if (newBadges.length > 1) {
    toast.show(`🎉 You earned ${newBadges.length} new badges!`, {
      type: 'success',
      placement: 'top',
      duration: 4000,
      animationType: 'slide-in',
    });
  }
};

export const showStreakNotification = (streakResult, toast) => {
  if (streakResult.isNewStreak && streakResult.streakCount > 1) {
    toast.show(`🔥 ${streakResult.streakCount} Day Streak! Keep it going!`, {
      type: 'normal',
      placement: 'bottom',
      duration: 3000,
      animationType: 'slide-in',
    });
  }
};

export const showBadgeProgress = (badge, currentProgress, toast) => {
  const percentage = Math.round((currentProgress / badge.required_criteria.target_value) * 100);

  if (percentage === 75 || percentage === 90) {
    toast.show(`${percentage}% to "${badge.name}" - ${currentProgress}/${badge.required_criteria.target_value}`, {
      type: 'normal',
      placement: 'bottom',
      duration: 2000,
      animationType: 'slide-in',
    });
  }
};

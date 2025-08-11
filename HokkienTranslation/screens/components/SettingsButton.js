// Create a new file: components/SettingsButton.js
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeProvider';

const SettingsButton = () => {
    const navigation = useNavigation();
    const { themes, theme } = useTheme();
    const colors = themes[theme];

    return (
        <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={{ marginRight: 15 }}
        >
            <Ionicons
                name="settings"
                size={24}
                color={colors.onSurface}
            />
        </TouchableOpacity>
    );
};

export default SettingsButton;

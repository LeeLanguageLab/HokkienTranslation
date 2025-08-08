import React, {useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import {Button, IconButton} from "native-base";
import {Linking} from "react-native";
import {useTheme} from "../context/ThemeProvider";

const FeedbackButton = ({iconOnly = true}) => {
    const {themes, theme} = useTheme();
    const colors = themes[theme];
    const [isPressed, setIsPressed] = useState(false);

    const openFeedbackForm = () => {
        Linking.openURL("https://forms.gle/TuXR5SCwRSVtyqTG8");
    };

    if (iconOnly) {
        return (
            <IconButton
                icon={
                    <Ionicons
                        name="document-text"
                        size={25}
                        color={colors.onSurface}
                    />
                }
                borderRadius="full"
                _hover={{bg: "transparent"}}
                _pressed={{bg: "transparent"}}
                onPress={openFeedbackForm} // or whatever your existing onPress function is
            />
        );
    }

    return (
        <Button
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            onPress={openFeedbackForm}
            mr={4}
            borderRadius="full"
            backgroundColor={colors.primaryContainer}
            _pressed={{
                backgroundColor: colors.onPrimaryContainer,
                opacity: 0.8,
                _text: {
                    color: colors.primaryContainer,
                },
            }}
            leftIcon={
                <Ionicons
                    name="document-text"
                    size={25}
                    color={
                        isPressed ? colors.primaryContainer : colors.onPrimaryContainer
                    }
                />
            }
            _text={{
                color: colors.onPrimaryContainer,
                fontSize: "sm",
                fontWeight: "bold",
            }}
        >
            Feedback
        </Button>
    );
};

export default FeedbackButton;

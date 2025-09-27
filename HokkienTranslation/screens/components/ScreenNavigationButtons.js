import React, {useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import {StyleSheet} from "react-native";
import {Button, HStack, Text} from "native-base";
import {useNavigation} from "@react-navigation/native";

const ScreenNavigationButtons = ({colors, flashcardListName}) => {
    const navigation = useNavigation();
    const [isPressedCatButton, setIsPressedCatButton] = useState(false);
    const [isPressedQuizButton, setIsPressedQuizButton] = useState(false);
    const [isPressedStudyButton, setIsPressedStudyButton] = useState(false);

    const styles = StyleSheet.create({
        categoryBox: {
            alignItems: "center",
            borderWidth: 1,
            borderRadius: 10,
            borderColor: colors.buttonBorder,
            padding: 10,
            marginBottom: 10,
            shadowColor: "#000",
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 1,
            backgroundColor: colors.primaryContainer,
        },
        categoryBoxPressed: {
            transform: [{translateY: -2}],
            shadowColor: "#000",
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
            opacity: 1,
            backgroundColor: colors.onPrimaryContainer,
        },
    });

    return (
        <HStack alignItems="center" justifyContent="space-between" p={4}>
            <Button
                marginRight="auto"
                onPressIn={() => setIsPressedCatButton(true)}
                onPressOut={() => setIsPressedCatButton(false)}
                onPress={() => navigation.goBack()}
                background={colors.primaryContainer}
                _text={{color: colors.onSurface}}
                borderRadius="21"
                style={
                    isPressedCatButton
                        ? [styles.categoryBox, styles.categoryBoxPressed]
                        : styles.categoryBox
                }
            >
                <HStack alignItems="center">
                    <Ionicons
                        name={"arrow-back-outline"}
                        size={17}
                        color={
                            isPressedCatButton ? colors.primaryContainer : colors.onSurface
                        }
                    />
                    <Text
                        style={{
                            fontWeight: "bold",
                            marginLeft: 1,
                            opacity: 1,
                            color: isPressedCatButton
                                ? colors.primaryContainer
                                : colors.onSurface,
                        }}
                    >
                        Categories
                    </Text>
                </HStack>
            </Button>
            <Button
                marginLeft="auto"
                onPressIn={() => setIsPressedQuizButton(true)}
                onPressOut={() => setIsPressedQuizButton(false)}
                onPress={() => navigation.navigate("Quiz", {flashcardListName})}
                background={colors.primaryContainer}
                _text={{color: colors.onSurface}}
                borderRadius="21"
                style={
                    isPressedQuizButton
                        ? [styles.categoryBox, styles.categoryBoxPressed]
                        : styles.categoryBox
                }
            >
                <HStack alignItems="center">
                    <Text
                        style={{
                            fontWeight: "bold",
                            marginLeft: 8,
                            marginRight: 1,
                            opacity: 1,
                            color: isPressedQuizButton
                                ? colors.primaryContainer
                                : colors.onSurface,
                        }}
                    >
                        Quiz
                    </Text>
                    <Ionicons
                        name={"arrow-forward-outline"}
                        size={17}
                        color={
                            isPressedQuizButton ? colors.primaryContainer : colors.onSurface
                        }
                    />
                </HStack>
            </Button>
        </HStack>
    );
};

export default ScreenNavigationButtons;

import {Button, HStack, Text} from "native-base";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import {StyleSheet} from "react-native";


export const StudyButton = ({colors}) => {

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
                marginLeft="auto"
                onPressIn={() => setIsPressedStudyButton(true)}
                onPressOut={() => setIsPressedStudyButton(false)}
                onPress={() => navigation.navigate("FlashcardScreen", {flashcardListName})}
                background={colors.primaryContainer}
                _text={{color: colors.onSurface}}
                borderRadius="21"
                style={
                    isPressedStudyButton
                        ? [styles.categoryBox, styles.categoryBoxPressed]
                        : styles.categoryBox
                }
            >
                <HStack alignItems="center">
                    <Text
                        style={{
                            fontWeight: "bold",
                            marginLeft: 1,
                            marginRight: 1,
                            opacity: 1,
                            color: isPressedStudyButton
                                ? colors.primaryContainer
                                : colors.onSurface,
                        }}
                    >Study
                    </Text>
                </HStack>
            </Button>
        </HStack>
    )
}

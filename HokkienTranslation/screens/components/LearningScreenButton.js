import {Button, HStack, Text} from "native-base";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";


const StudyButton = () => {

    const [isPressedStudyButton, setIsPressedStudyButton] = useState(false);

    return(
    <HStack alignItems="center" justifyContent="space-between" p={4}>
                <Button
                    marginRight="auto"
                    onPressIn={() => setIsPressedStudyButton(true)}
                    onPressOut={() => setIsPressedStudyButton(false)}
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
    )
}

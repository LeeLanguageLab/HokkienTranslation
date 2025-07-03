import React, {useState, useEffect, useRef} from "react";
import {Box, Text, VStack, FormControl, Input, Button, Image} from "native-base";
import {ImageBackground, Animated} from "react-native";
import {LinearGradient} from 'expo-linear-gradient';
import {CommonActions} from "@react-navigation/native";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {auth} from "../backend/database/Firebase";
import {useTheme} from "./context/ThemeProvider";
import {initializeLeitnerBoxesForUser, initializePointLevelProgress} from "../backend/database/LeitnerSystemHelpers.js";
import {useRegisterAndStoreToken} from "../backend/notifications/RegisterAndStoreToken";

export default function RegisterScreen({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState("");
    const {theme, themes} = useTheme();
    const colors = themes[theme];

    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity value

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100, // Duration of anim
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const registerWithEmail = async () => {
        if (password !== passwordConfirmation) {
            setMessage("Passwords don't match!");
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setMessage("Successfully registered!");
            const token = useRegisterAndStoreToken(userCredential);
            console.warn("ExpoPushToken at login:", token);

            await initializePointLevelProgress(userCredential.user.email);
            console.log("PointLevelProgress initialized for ", userCredential.user.email);

            await initializeLeitnerBoxesForUser(userCredential.user.email);
            console.log("Leitner Boxes initialized for ", userCredential.user.email);

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{name: "Main"}],
                })
            );
        } catch (error) {
            const errorMessage = error.message;
            setMessage(errorMessage);
        }
    };


    return (
        <ImageBackground
            source={require("../assets/background.png")}
            style={{flex: 1, justifyContent: "center", alignItems: "center"}}
        >
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                backgroundColor={`${colors.primaryContainer}C0`}
            />
            <Animated.View style={{opacity: fadeAnim, width: '90%', maxWidth: 400}}>
                <LinearGradient
                    colors={['#fcfcfa', '#e0d4bc']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={{
                        padding: 24,
                        borderRadius: 16,
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        shadowColor: '#000',
                        shadowOffset: {height: 4, width: 0}
                    }}
                >
                    <VStack space={4} alignItems="center">
                        <Image
                            source={require("../assets/logo.png")}
                            alt="Logo"
                            size="xl"
                            mb="5"
                        />
                        <Text fontSize="2xl" fontWeight="bold" color={colors.primary}>
                            Register Now
                        </Text>
                        <FormControl>
                            <FormControl.Label>Email</FormControl.Label>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email"
                                bg={colors.surface}
                                _focus={{borderColor: colors.primary}}
                            />
                        </FormControl>
                        <FormControl>
                            <FormControl.Label>Password</FormControl.Label>
                            <Input
                                type="password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                bg={colors.surface}
                                _focus={{borderColor: colors.primary}}
                            />
                        </FormControl>
                        <FormControl>
                            <FormControl.Label>Confirm Password</FormControl.Label>
                            <Input
                                type="password"
                                value={passwordConfirmation}
                                onChangeText={setPasswordConfirmation}
                                placeholder="Enter your password again"
                                bg={colors.surface}
                                _focus={{borderColor: colors.primary}}
                            />
                        </FormControl>
                        <Button
                            mt="4"
                            w="full"
                            bg="#2596be"
                            _hover={{bg: "#1e7ca1"}}
                            _pressed={{bg: "#1e7ca1"}}
                            _text={{fontSize: "md", fontWeight: "bold", color: colors.surface}}
                            rounded="lg"
                            shadow="3"
                            onPress={registerWithEmail}
                        >
                            Register
                        </Button>
                        <Button
                            mt="2"
                            w="full"
                            bg="#646FD4"
                            _hover={{bg: "#4a4ba1"}}
                            _pressed={{bg: "#4a4ba1"}}
                            _text={{fontSize: "md", fontWeight: "bold", color: colors.surface}}
                            rounded="lg"
                            shadow="3"
                            onPress={() => navigation.navigate("Login")}
                        >
                            I have an account!
                        </Button>
                        {message ? (
                            <Text mt="4" color="red.500" textAlign="center">
                                {message}
                            </Text>
                        ) : null}
                    </VStack>
                </LinearGradient>
            </Animated.View>
        </ImageBackground>
    );
}

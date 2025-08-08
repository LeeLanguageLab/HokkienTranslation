import React, {useState, useEffect, useRef} from "react";
import {useToast} from 'react-native-toast-notifications';
import {
    Box,
    Text,
    VStack,
    FormControl,
    Input,
    Button,
    Pressable,
    HStack,
    Image,
    Divider,
    Icon,
} from "native-base";
import {ImageBackground, Animated} from "react-native";
import {LinearGradient} from 'expo-linear-gradient';
import {CommonActions} from "@react-navigation/native";
import {Ionicons} from "@expo/vector-icons";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
} from "firebase/auth";
import {auth} from "../backend/database/Firebase";
import {useTheme} from "./context/ThemeProvider";
import {useRegisterAndStoreToken} from "../backend/notifications/RegisterAndStoreToken";

export default function LoginScreen({navigation}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    // const [userCred, setUserCred] = useState(null);
    const {theme, themes} = useTheme();
    const colors = themes[theme];
    // const token = useRegisterAndStoreToken(userCred);

    const toast = useToast();

    const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600, // Duration of anim
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{name: "Main"}],
                    })
                );
            }
        });

        return () => unsubscribe();
    }, [navigation]);

    const loginWithEmail = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // console.log("User logged in:", userCredential.user);
                setMessage("Successfully logging you in");
                // setUserCred(userCredential);
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{name: "Main"}],
                    })
                );
            })
            .catch((error) => {
                let toastMessage = "";
                let toastType = "danger";
                const errorCode = error.code;
                switch (errorCode) {
                    case "auth/user-not-found":
                        toastMessage = "No account found with this email address. Please check your email or create " +
                            "a new account."
                        break;
                    case "auth/wrong-password":
                        toastMessage = "Incorrect password. Please try again or use 'Forgot Password'."
                        break;
                    case "auth/invalid-email":
                        toastMessage = "Please enter a valid email address."
                        break;
                    case "auth/user-disabled":
                        toastMessage = "This account has been disabled. Please contact support."
                        break;
                    case "auth/too-many-requests":
                        toastMessage = "Too many failed attempts. Please try again later."
                        break;
                    case "auth/network-request-failed":
                        toastMessage = "Network error. Please check your internet connection and try again."
                        break;
                    case "auth/operation-not-allowed":
                        toastMessage = "Email/password sign-in is not enabled. Please contact support."
                        break;
                    case "auth/internal-error":
                        toastMessage = "An internal error occurred. Please try again later."
                        break;
                    case "auth/invalid-credential":
                        toastMessage = "Your password is invalid or the user does not have a password. " +
                            "Please try using forgot password or login with Google."
                        break;
                    default:
                        setMessage(error.message || "An unexpected error occurred. Please try again.");
                }
                toast.hideAll();
                        toast.show(toastMessage, {
                            type: toastType,
                            placement: "top",
                            duration: 4000,
                            animationType: "slide-in",
                        })
            });
    };

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/contacts.readonly");
    const loginWithGoogle = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                setMessage("Successfully logging you in");
                navigation.dispatch(
                    CommonActions.reset({
                        index: 0,
                        routes: [{name: "Main"}],
                    })
                );
            })
            .catch((error) => {
                const errorMessage = error.message;
                setMessage(errorMessage);
            });
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
                            Welcome Back
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
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                bg={colors.surface}
                                _focus={{borderColor: colors.primary}}
                                InputRightElement={
                                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                                        <Icon
                                            as={Ionicons}
                                            name={showPassword ? "eye-off" : "eye"}
                                            size="sm"
                                            mr="2"
                                            color={colors.primary}
                                        />
                                    </Pressable>
                                }
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
                            onPress={loginWithEmail}
                        >
                            Login with Email
                        </Button>
                        <HStack alignItems="center" width="100%" mt="4">
                            <Divider flex={1} bg={colors.onSurface}/>
                            <Text mx="2" fontSize="sm" color="gray.500">
                                or
                            </Text>
                            <Divider flex={1} bg={colors.onSurface}/>
                        </HStack>
                        <Pressable onPress={loginWithGoogle} w="200px">
                            <HStack
                                alignItems="center"
                                justifyContent="center"
                                mt="4"
                                bg="gray.100"
                                p="2"
                                borderRadius="4"
                            >
                                <Image
                                    source={require("../assets/google-icon.png")}
                                    size="xs"
                                    mr="2"
                                    resizeMode="contain"
                                />
                                <Text color="black" fontSize="sm">
                                    Continue with Google
                                </Text>
                            </HStack>
                        </Pressable>
                        <HStack width="100%" justifyContent="space-between" mt="4">
                            <Pressable onPress={() => navigation.navigate("Register")}>
                                <Text color="blue.500" fontSize="sm">
                                    I don't have an account
                                </Text>
                            </Pressable>
                            <Pressable onPress={() => navigation.navigate("ForgetPassword")}>
                                <Text color="blue.500" fontSize="sm">
                                    Forgot my password
                                </Text>
                            </Pressable>
                        </HStack>
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

import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {NativeBaseProvider} from "native-base";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {Ionicons} from "@expo/vector-icons";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ResultScreen from "./screens/ResultScreen";
import LandingPage from "./screens/LandingScreen";
import FlashcardScreen from "./screens/FlashcardScreen";
import QuizScreen from "./screens/QuizScreen";
import FlashcardCategory from "./screens/FlashcardCategory";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ForgetPasswordScreen from "./screens/ForgetPasswordScreen";
import ThemeProvider, {useTheme} from "./screens/context/ThemeProvider";
import {LanguageProvider} from "./screens/context/LanguageProvider";
import {ComponentVisibilityProvider} from "./screens/context/ComponentVisibilityContext";
import FeedbackButton from "./screens/components/FeedbackButton";
import FlashcardAdd from "./screens/FlashcardAdd";
import LearningScreen from "./screens/learningScreen";


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
    const {themes, theme} = useTheme();
    const colors = themes[theme];

    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={({route}) => ({
                headerShown: route.name !== "Landing",
                headerStyle: {
                    backgroundColor: colors.header,
                },
                headerTitleStyle: {
                    fontSize: 25,
                    color: colors.onSurface,
                },
                headerTitleAlign: "center",
                headerTintColor: colors.onSurface,
                headerRight: () => <FeedbackButton/>,
            })}
        >
            <Stack.Screen name="Home" component={HomeScreen}/>
            <Stack.Screen name="Result" component={ResultScreen}/>
            <Stack.Screen name="Settings" component={SettingsScreen}/>
        </Stack.Navigator>
    );
};

const FlashcardStack = () => {
    const {themes, theme} = useTheme();
    const colors = themes[theme];

    return (
        <Stack.Navigator
            initialRouteName="Category"
            screenOptions={{
                headerStyle: {backgroundColor: colors.header},
                headerTitleStyle: {fontSize: 25, color: colors.onSurface},
                headerTitleAlign: "center",
                headerTintColor: colors.onSurface,
                headerRight: () => <FeedbackButton/>,
            }}
        >
            <Stack.Screen name="Category" component={FlashcardCategory}/>
            <Stack.Screen name="Flashcard" component={FlashcardScreen}/>
            <Stack.Screen name="Quiz" component={QuizScreen}/>
            <Stack.Screen name="FlashcardAdd" component={FlashcardAdd}/>
            <Stack.Screen name="FlashcardStudy" component={LearningScreen}/>
        </Stack.Navigator>
    );
};

const LearningStack = () => {
    const {themes, theme} = useTheme();
    const colors = themes[theme];

    return (
        <Stack.Navigator
            initialRouteName="Learning"
            screenOptions={{
                headerStyle: {backgroundColor: colors.header},
                headerTitleStyle: {fontSize: 25, color: colors.onSurface},
                headerTitleAlign: "center",
                headerTintColor: colors.onSurface,
                headerRight: () => <FeedbackButton/>,
            }}
        >
            <Stack.Screen name="FlashcardStudy" component={LearningScreen}/>
        </Stack.Navigator>
    );


}

const MainTabNavigator = () => {
    const {themes, theme} = useTheme();
    const colors = themes[theme];

    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    let iconName;

                    if (route.name === "HomeStack") {
                        iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "FlashcardStack") {
                        iconName = focused ? "book" : "book-outline";
                    } else if (route.name === "Learning") {
                        iconName = focused ? "albums" : "albums-outline";
                    } else if (route.name === "Settings") {
                        iconName = focused ? "settings" : "settings-outline";
                    }

                    return <Ionicons name={iconName} size={size} color={color}/>;
                },
                tabBarStyle: {
                    backgroundColor: colors.primaryContainer,
                    borderTopWidth: 1,
                    //borderTopColor: colors.onSurface,
                },
                tabBarActiveTintColor: colors.onPrimaryContainer,
                tabBarInactiveTintColor: colors.onSurface,
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="HomeStack"
                component={HomeStack}
                options={{title: "Home"}}
            />
            <Tab.Screen
                name="FlashcardStack"
                component={FlashcardStack}
                options={{title: "Flashcards"}}
            />
            {/*<Tab.Screen*/}
            {/*  name="Learning"*/}
            {/*  component={LearningStack}*/}
            {/*  options={{ title: "Learning"}}*/}
            {/*/>*/}
            <Tab.Screen name="Settings" component={SettingsScreen}/>
        </Tab.Navigator>
    );
};

const AppContent = () => {
    return (
        <NativeBaseProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Landing"
                    screenOptions={{
                        headerShown: false,
                    }}
                >
                    <Stack.Screen name="Landing" component={LandingPage}/>
                    <Stack.Screen name="Main" component={MainTabNavigator}/>
                    <Stack.Screen name="Login" component={LoginScreen}/>
                    <Stack.Screen name="Register" component={RegisterScreen}/>
                    <Stack.Screen
                        name="ForgetPassword"
                        component={ForgetPasswordScreen}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </NativeBaseProvider>
    );
};

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <ComponentVisibilityProvider>
                    <AppContent/>
                </ComponentVisibilityProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}

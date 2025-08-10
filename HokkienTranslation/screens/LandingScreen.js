import React, { useEffect, useRef } from "react";
import { ImageBackground, Pressable, Animated } from "react-native";
import { Box, Image, Text, VStack } from "native-base";
import { CommonActions } from "@react-navigation/native";
import { useTheme } from "./context/ThemeProvider";
import { auth } from "../backend/database/Firebase";

const LandingPage = ({ navigation }) => {
  const { theme, themes } = useTheme();
  const colors = themes[theme];

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800, // 0.8 seconds
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable
      style={{ flex: 1 }}
      onPress={() => {
        const user = auth.currentUser;
        if (user && user.displayName) {
          // User is logged in and has username
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Main" }],
            })
          );
        } else if (user) {
          // Logged in but no username yet
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Username" }],
            })
          );
        } else {
          // Not logged in
          navigation.navigate("Login");
        }
      }}
      // onPress={() => navigation.navigate("Login")}
      // onPress={() =>
      //   navigation.dispatch(
      //     CommonActions.reset({
      //       index: 0,
      //       routes: [{ name: "Main" }],
      //     })
      //   )
      // }
    >
      <ImageBackground
        source={require("../assets/background.png")}
        style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }}
      >

      <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor={`${colors.primaryContainer}C0`}
      />

        {/* <Box
          marginX="20%"
          marginY="5%"
          justifyContent="center"
          alignItems="center"
          width="100%"
        > */}
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center", width: "80%"}}>
          <Image source={require("../assets/logo.png")} alt="Logo" size="2xl" marginBottom={-15}/>
          <VStack space={1} alignItems="center">
            {/* <Text fontSize="4xl" fontWeight="bold" color={colors.onPrimaryContainer} textAlign="center">
              LangLearn
            </Text> */}
            <Text fontSize="2xl"  fontWeight="bold" color={colors.onSurface} textAlign="center">
              Hokkien Translation & Education Tool
            </Text>
            <Text fontSize="md" color={colors.onPrimaryContainer} textAlign="center">
              Tap anywhere to continue
            </Text>
          </VStack>
        {/* </Box> */}
        </Animated.View>
      </ImageBackground>
    </Pressable>
  );
};

export default LandingPage;

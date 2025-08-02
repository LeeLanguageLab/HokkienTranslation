import React, {useContext} from "react";
import {Button, Pressable, HStack} from "native-base";
import {Text} from "react-native";
import {useNavigation} from "@react-navigation/native";
// import { AuthContext } from "../backend/database/AuthContext";
import {signOut} from "firebase/auth";
import {auth} from "../../backend/database/Firebase";
import {useTheme} from '../context/ThemeProvider';
import {Ionicons} from "@expo/vector-icons";


const SignOut = () => {
    // const { setUser } = useContext(AuthContext);
    const navigation = useNavigation();
    const {theme, themes} = useTheme();
    const colors = themes[theme];

    const handleSignOut = () => {
        signOut(auth).then(() => {
            // Navigate to the Landing page
            navigation.reset({
                index: 0,
                routes: [{name: "Landing"}],
            });
        }).catch((error) => {
            // An error happened.

            console.error("Sign out error: ", error);
        });
    };

    return (

        // Previous implemenetation when SignOut was a button in the Settings screen
        // <Button
        //       bg={colors.darkerPrimaryContainer }
        //       _hover={{ bg: colors.evenDarkerPrimaryContainer }}
        //       _pressed={{ bg: colors.onPrimaryContainer}}
        //       _text={{ color: colors.onSurface }}
        //       onPress={handleSignOut}>Sign Out</Button>

        <Pressable onPress={handleSignOut} style={{marginRight: 10}}>
            <HStack alignItems="center">
                <Ionicons name="log-out" size={24} color={colors.onSurface}/>
            </HStack>
        </Pressable>

    )
};

export default SignOut;

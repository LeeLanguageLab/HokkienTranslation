import React from "react";
import { HStack, Pressable, Text } from "native-base";
import { Ionicons } from "@expo/vector-icons";

const FlashcardNav = ({ currentIndex, total, onBack, onNext, isPressedLeft, isPressedRight, setIsPressedLeft, setIsPressedRight, color }) => {
    return (
      <HStack space={4} alignItems="center">
        <Pressable
          borderRadius="50"
          onPressIn={() => setIsPressedLeft(true)}
          onPressOut={() => setIsPressedLeft(false)}
          onPress={onBack}
        >
          <Ionicons
            name={isPressedLeft ? "chevron-back-circle" : "chevron-back-circle-outline"}
            color={color}
            size={50}
          />
        </Pressable>
        <Text fontSize="lg" color={color}>
          {currentIndex + 1}/{total}
        </Text>
        <Pressable
          borderRadius="50"
          onPressIn={() => setIsPressedRight(true)}
          onPressOut={() => setIsPressedRight(false)}
          onPress={onNext}
        >
          <Ionicons
            name={isPressedRight ? "chevron-forward-circle" : "chevron-forward-circle-outline"}
            color={color}
            size={50}
          />
        </Pressable>
      </HStack>
    );
  };
  
  export default FlashcardNav;
  
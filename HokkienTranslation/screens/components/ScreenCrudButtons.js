import React from 'react';
import { Button, Text, HStack } from 'native-base';
import { useTheme } from "../context/ThemeProvider";
import { Ionicons } from '@expo/vector-icons';

const CrudButtons = ({title, onPress, iconName, isDisabled}) => {
  const { theme, themes } = useTheme();
  const colors = themes[theme];
  return (
    <Button 
      onPress={onPress} 
      bg={colors.primaryContainer} 
      isDisabled={isDisabled}
      shadow={2}
      paddingX={4}
      paddingY={2}
      borderRadius="10px"
      _hover={{ bg: colors.darkerPrimaryContainer }}
      _pressed={{ bg: colors.evenDarkerPrimaryContainer }}>
      {/* <Ionicons name={iconName} size={20} color={colors.onPrimary} /> */}
      <HStack space={2} alignItems="center">
        <Ionicons name={iconName} size={20} color={colors.onSurface} />
        <Text color={colors.onSurface} fontWeight={"bold"}>{title}</Text>
      </HStack>
    </Button>
  );
};

export default CrudButtons;

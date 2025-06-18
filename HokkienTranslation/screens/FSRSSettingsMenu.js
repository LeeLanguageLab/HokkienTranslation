import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from "./context/ThemeProvider";

const defaultFSRSParams = {
  w: '1.5, 0.5, 0.3, 2.5, 1.0, 1.2, 2.1, 0.8, 1.7, 1.6, 1.3, 2.0, 1.9, 0.6, 1.4, 2.3, 1.8, 1.1, 2.4', // 19 numbers as a comma-separated string
};

const FSRSSettingsMenu = () => {
  const [customParams, setCustomParams] = useState(defaultFSRSParams.w); // Only store the 'w' string
  const [validationError, setValidationError] = useState(null);
  const { theme, themes } = useTheme();
  const colors = themes[theme];

  const validateParameters = (raw) => {
    try {
      // Trim spaces and split the string into an array
      const rawArray = raw.trim().split(',').map(item => item.trim());

      // Check if there are exactly 19 numbers
      if (rawArray.length !== 19) {
        throw new Error('w must be a string with exactly 19 comma-separated numbers');
      }

      // Ensure all items are valid numbers
      const invalidItems = rawArray.filter(n => isNaN(parseFloat(n)));
      if (invalidItems.length > 0) {
        throw new Error(`Invalid number(s) found: ${invalidItems.join(', ')}`);
      }

      setValidationError(null); // Clear any previous validation error
      return rawArray; // Return the array of valid numbers
    } catch (e) {
      setValidationError(e.message || 'Invalid parameters');
      return null;
    }
  };

  const handleSaveAndValidate = () => {
    const result = validateParameters(customParams);
    if (result) {
      // Convert the validated parameters back into the desired format
      const updatedParams = { w: result.map((n) => parseFloat(n.trim())) };
      Alert.alert('Saved', 'Parameters have been saved successfully.');
      console.log(updatedParams); // Hook in your save logic here
    } else {
      // Show an alert or error message if validation fails
      Alert.alert('Error', 'Validation failed. Please check your input.');
    }
  };

  const handleOptimize = () => {
    Alert.alert('Optimize', 'Start parameter optimization (hook into your logic)');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: colors.backgroundColor }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginVertical: 8 }}>
        FSRS Parameters
      </Text>

      {/* Editable field for w string */}
      <TextInput
        style={{
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          minHeight: 160,
          fontFamily: 'Courier',
          marginBottom: 8,
          color: colors.text,
          backgroundColor: colors.inputBackground,
        }}
        multiline
        value={customParams}
        onChangeText={setCustomParams}
      />

      {validationError && <Text style={{ color: 'red', marginBottom: 8 }}>⚠️ {validationError}</Text>}

      <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
  <TouchableOpacity
    onPress={handleSaveAndValidate}
    style={{
      backgroundColor: colors.primaryContainer,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1, // Makes the button take up equal space with the other
      marginRight: 8, // Adds space between buttons
    }}
  >
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
      Save
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    onPress={handleOptimize}
    style={{
      backgroundColor: colors.primaryContainer,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1, // Makes the button take up equal space with the other
    }}
  >
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
      Optimize
    </Text>
  </TouchableOpacity>
</View>

    </ScrollView>
  );
};

export default FSRSSettingsMenu;

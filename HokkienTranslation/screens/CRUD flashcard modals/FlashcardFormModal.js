import React from "react";
import {Modal, VStack, HStack, Input, Button, Text, Select} from "native-base";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeProvider";

export default function FlashcardFormModal({
  isOpen,
  onClose,
  mode = "create", // "create" or "update"
  values = {},
  setters = {},
  onSubmit,
  onAutofill, 
}) {
  const {
    enteredWord = "",
    enteredTranslation = "",
    option1 = "",
    option2 = "",
    option3 = "",
    type = "word",
  } = values;

  const {
    setEnteredWord = () => {},
    setEnteredTranslation = () => {},
    setOption1 = () => {},
    setOption2 = () => {},
    setOption3 = () => {},
    setType = () => {},
  } = setters;

  const isCreate = mode === "create";
  const { theme, themes } = useTheme();
  const colors = themes[theme];
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Content width="80%" maxWidth="350px">
        <Modal.CloseButton />
        <Modal.Header>
          {isCreate ? "Create New Flashcard" : "Update Flashcard"}
        </Modal.Header>
        <Modal.Body>
          <VStack space={isCreate ? 4 : 3}>
            {isCreate ? (
              <>
                <Input
                  placeholder="Enter English word"
                  value={enteredTranslation}
                  onChangeText={setEnteredTranslation}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                />
                <Button
                  bg={colors.primaryContainer} 
                  _hover={{ bg: colors.darkerPrimaryContainer }}
                  _pressed={{ bg: colors.evenDarkerPrimaryContainer }}
                  onPress={onAutofill}
                  isDisabled={!enteredTranslation}
                >
                  <Text color={colors.onSurface} > Autofill </Text>
                </Button>
                <Input
                  placeholder="Enter Hokkien translation"
                  value={enteredWord}
                  onChangeText={setEnteredWord}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                />
                <Input
                  placeholder="Option 1"
                  value={option1}
                  onChangeText={setOption1}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                />
                <Input
                  placeholder="Option 2"
                  value={option2}
                  onChangeText={setOption2}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                />
                <Input
                  placeholder="Option 3"
                  value={option3}
                  onChangeText={setOption3}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                />
                <Select
                  selectedValue={type}
                  placeholder="Select Type"
                  onValueChange={setType}
                  _hover={{
                    borderColor: colors.darkerPrimaryContainer, 
                    bg: colors.primaryContainer,
                  }}
                  //focusOutlineColor =... literally cannot figure this out :')
                >
                  <Select.Item label="Word" value="word" />
                  <Select.Item label="Sentence" value="sentence" />
                </Select>
              </>
            ) : (
              <>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Word:</Text>
                  <Input
                    flex={1}
                    value={enteredWord}
                    onChangeText={setEnteredWord}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                    focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                  />
                </HStack>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Translation:</Text>
                  <Input
                    flex={1}
                    value={enteredTranslation}
                    onChangeText={setEnteredTranslation}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                    focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                  />
                </HStack>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Option 1:</Text>
                  <Input
                    flex={1}
                    value={option1}
                    onChangeText={setOption1}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                    focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                  />
                </HStack>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Option 2:</Text>
                  <Input
                    flex={1}
                    value={option2}
                    onChangeText={setOption2}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                    focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                  />
                </HStack>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Option 3:</Text>
                  <Input
                    flex={1}
                    value={option3}
                    onChangeText={setOption3}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                    focusOutlineColor= {colors.evenDarkerPrimaryContainer}
                  />
                </HStack>
                <HStack space={2} alignItems="center">
                  <Text width="100px">Type:</Text>
                  <Select
                    flex={1}
                    selectedValue={type}
                    placeholder="Select Type"
                    onValueChange={setType}
                    _hover={{
                        borderColor: colors.darkerPrimaryContainer, 
                        bg: colors.primaryContainer,
                      }}
                      //focusOutlineColor =... literally cannot figure this out :')
                  >
                    <Select.Item label="Word" value="word" />
                    <Select.Item label="Sentence" value="sentence" />
                  </Select>
                </HStack>
              </>
            )}
          </VStack>
        </Modal.Body>
        <Modal.Footer>
          <HStack space={2}>
            <Button colorScheme="green" onPress={onSubmit}>
              <HStack space={1} alignItems="center">
                <Ionicons name="save-outline" size={30} color="#FFFFFF" />
                <Text color="#FFFFFF">Save</Text>
              </HStack>
            </Button>
            <Button
              onPress={onClose}
              variant="ghost"
              borderWidth={1}
              borderColor="coolGray.200"
              bg={colors.primaryContainer} 
              _hover={{ bg: colors.darkerPrimaryContainer }}
              _pressed={{ bg: colors.evenDarkerPrimaryContainer }}
            >
               <Text color={colors.onSurface}>Cancel</Text>
            </Button>
          </HStack>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  );
}

import { Button, Flex, Input, Stack, Textarea } from "@chakra-ui/react";
import React from "react";

type TextInputsProps = {
  textInputs: {
    title: string;
    body: string;
  };

  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCreatePost: () => void;
  loading: boolean;
};

const TextInput: React.FC<TextInputsProps> = ({
  textInputs,
  onChange,
  handleCreatePost,
  loading,
}) => {
  return (
    <Stack spacing={3} width="100%">
      <Input
        name="title"
        value={textInputs.title}
        onChange={onChange}
        borderRadius={4}
        padding="10px"
        placeholder="Title"
        _placeholder={{ color: "gray.400" }}
        _focus={{
          bg: "white",
          border: "1px soild",
          borderColor: "black",
          outline: "none",
        }}
      />
      <Textarea
        name="body"
        value={textInputs.body}
        onChange={onChange}
        borderRadius={4}
        padding="10px"
        height="100px"
        placeholder="Text (Optional)"
        _placeholder={{ color: "gray.400" }}
        _focus={{
          bg: "white",
          border: "1px soild",
          borderColor: "black",
          outline: "none",
        }}
      />
      <Flex justify="flex-end">
        <Button
          height="34px"
          padding="0px 30px"
          disabled={!textInputs.title}
          isLoading={loading}
          onClick={handleCreatePost}
        >
          Post
        </Button>
      </Flex>
    </Stack>
  );
};
export default TextInput;

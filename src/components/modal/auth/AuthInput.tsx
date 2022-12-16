import { Flex } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";
import { authModalState } from "../../../atoms/AuthModalAtom";
import Login from "./Login";
import SignUp from "./SignUp";

type AuthInputProps = {};

const AuthInput: React.FC<AuthInputProps> = () => {
  const modalState = useRecoilValue(authModalState);

  return (
    <Flex direction="column" align="center" mt={4} width="100%">
      {modalState.view === "login" && <Login />}
      {modalState.view === 'signup' && <SignUp />}
    </Flex>
  );
};
export default AuthInput;

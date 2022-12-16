import { Box, Text } from "@chakra-ui/react";
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useSetRecoilState } from "recoil";
import { communityState } from "../../../atoms/CommunitiesAtom";
import About from "../../../components/community/About";
import PageContent from "../../../components/layout/PageContent";
import NewPostForm from "../../../components/post/NewPostForm";
import { auth } from "../../../firebase/authClient";
import useCommunityData from "../../../hooks/useCommunityData";

const SubmitPageProps: React.FC = () => {
  const [user] = useAuthState(auth);
  //   const setCurrentStateValue = useSetRecoilState(communityState);
  const { communityStateValue } = useCommunityData();

  console.log("CurrentCommunity", communityStateValue);

  return (
    <PageContent>
      <>
        <Box padding="14px 0px" borderBottom="1px solid" borderColor="white">
          <Text>Create a post</Text>
        </Box>
        {user && <NewPostForm user={user} communityImageURL ={communityStateValue.currentCommunity?.imageURL} />}
      </>
      <>
        {communityStateValue.currentCommunity && (
          <About communityData={communityStateValue.currentCommunity} />
        )}
      </>
    </PageContent>
  );
};
export default SubmitPageProps;

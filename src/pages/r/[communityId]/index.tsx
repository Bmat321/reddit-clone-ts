import { doc, getDoc } from "firebase/firestore";
import { GetServerSidePropsContext } from "next";
import React, { useEffect } from "react";
import { Community, communityState } from "../../../atoms/CommunitiesAtom";
import { firestore } from "../../../firebase/authClient";
import safeJsonStringify from "safe-json-stringify";
import NoCommunityNotFound from "../../../components/community/NoCommunityFound";
import Header from "../../../components/community/Header";
import PageContent from "../../../components/layout/PageContent";
import CreatePostLink from "../../../components/community/CreatePostLink";
import Post from "../../../components/post/Post";
import { useSetRecoilState } from "recoil";
import About from "../../../components/community/About";

type CommunityPageProps = {
  communityData: Community;
};

const CommunityPage: React.FC<CommunityPageProps> = ({ communityData }) => {
 

  const setCurrentStateValue = useSetRecoilState(communityState);
  

  useEffect(() => {
    setCurrentStateValue((prev) => ({
      ...prev,
      currentCommunity: communityData,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityData]);

  if (!communityData) {
    return <NoCommunityNotFound />;
  }

  return (
    <>
      <Header communityData={communityData} />
      <PageContent>
        <>
          <div>
            <CreatePostLink />
            <Post communityData={communityData} />
          </div>
        </>

        <>
          <div><About communityData={communityData} /></div>
        </>
      </PageContent>
    </>
  );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  try {
    const communityDocRef = doc(
      firestore,
      "communities",
      context.query.communityId as string
    );
    const communityDoc = await getDoc(communityDocRef);

    return {
      props: {
        communityData: communityDoc.exists()
          ? JSON.parse(
              safeJsonStringify({ id: communityDoc.id, ...communityDoc.data() })
            )
          : "",
      },
    };
  } catch (error) {
    console.log("getServerSideProps error", error);
  }
}

export default CommunityPage;

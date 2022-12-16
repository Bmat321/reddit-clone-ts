import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useRecoilValue } from "recoil";
import { communityState } from "../../../../atoms/CommunitiesAtom";
import { Post } from "../../../../atoms/postAtom";
import About from "../../../../components/community/About";
import PageContent from "../../../../components/layout/PageContent";
import Comments from "../../../../components/post/comments/Comments";
import PostItem from "../../../../components/post/PostItem";
import { auth, firestore } from "../../../../firebase/authClient";
import useCommunityData from "../../../../hooks/useCommunityData";
import usePosts from "../../../../hooks/usePosts";

const PostPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const { pid } = useRouter().query;
  const { postStateValue, setPostStateValue, onVote, onDeletePost } =
    usePosts();
  const { communityStateValue } = useCommunityData();

  const fetchPost = async (postId: string) => {
    try {
      const postDocRef = doc(firestore, "posts", postId);
      const postRef = await getDoc(postDocRef);
      setPostStateValue((prev) => ({
        ...prev,
        selectedPost: { id: postRef.id, ...postRef.data() } as Post,
      }));
    } catch (error: any) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (pid && !postStateValue.selectedPost) {
      fetchPost(pid as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, postStateValue]);

  return (
    <PageContent>
      {/* LHS */}
      <>
        {postStateValue.selectedPost && (
          <PostItem
            post={postStateValue.selectedPost}
            onDeletePost={onDeletePost}
            onVote={onVote}
            userVoteValue={
              postStateValue.postVotes.find(
                (item) => item.postId === postStateValue.selectedPost?.id
              )?.voteValue
            }
            userIsCreator={user?.uid === postStateValue.selectedPost?.creatorId}
          />
        )}

        <Comments
          user={user as User}
          selectedPost={postStateValue.selectedPost}
          communityId={postStateValue.selectedPost?.communityId as string}
        />
      </>

      {/* RHS */}
      <>
        {communityStateValue.currentCommunity && (
          <About communityData={communityStateValue.currentCommunity} />
        )}
      </>
    </PageContent>
  );
};
export default PostPage;

import { Flex, Stack } from "@chakra-ui/react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import React, { useCallback, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Community } from "../../atoms/CommunitiesAtom";
import { Post } from "../../atoms/postAtom";
import { auth, firestore } from "../../firebase/authClient";
import usePosts from "../../hooks/usePosts";
import PostItem from "./PostItem";
import PostLoader from "./PostLoader";

type PostProps = {
  communityData: Community;
};

const Post: React.FC<PostProps> = ({ communityData }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const {
    postStateValue,
    setPostStateValue,
    onVote,
    onDeletePost,
    onSelectPost,
  } = usePosts();

  const getPosts = useCallback(async () => {
    setLoading(true);
    try {
      // get posts for the community
      const postsQuery = query(
        collection(firestore, "posts"),
        where("communityId", "==", communityData.id),
        orderBy("createdAt", "desc")
      );

      const postDocs = await getDocs(postsQuery);

      // store in db
      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));
    } catch (error: any) {
      console.log("getPost error", error.message);
    }
    setLoading(false);
  }, [communityData.id, setPostStateValue]);

  useEffect(() => {
    getPosts();
  }, [getPosts]);

  return (
    <>
      {loading ? (
        <PostLoader />
      ) : (
        <Stack>
          {postStateValue.posts.map((item) => (
            <PostItem
              key={item.id}
              post={item}
              userVoteValue={
                postStateValue.postVotes.find((vote) => vote.postId === item.id)
                  ?.voteValue
              }
              userIsCreator={user?.uid === item.creatorId}
              onDeletePost={onDeletePost}
              onSelectPost={onSelectPost}
              onVote={onVote}
            />
          ))}
        </Stack>
      )}
    </>
  );
};
export default Post;

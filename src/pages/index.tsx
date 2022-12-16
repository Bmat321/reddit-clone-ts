import { Stack } from "@chakra-ui/react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Post, PostVote } from "../atoms/postAtom";
import CreatePostLink from "../components/community/CreatePostLink";
import PersonalHome from "../components/community/PersonalHome";
import Premium from "../components/community/Premium";
import Recommendations from "../components/community/Recommendations";
import PageContent from "../components/layout/PageContent";
import PostItem from "../components/post/PostItem";
import PostLoader from "../components/post/PostLoader";
import { auth, firestore } from "../firebase/authClient";
import useCommunityData from "../hooks/useCommunityData";
import usePosts from "../hooks/usePosts";

export default function Home() {
  const [user, loadingUser] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const {
    postStateValue,
    setPostStateValue,
    onDeletePost,
    onSelectPost,
    onVote,
  } = usePosts();
  const { communityStateValue } = useCommunityData();

  const buildUserHomeFeed = async () => {
    setLoading(true);
    try {
      if (communityStateValue.mySnippets.length) {
        // get the posts from users communities
        const myCommunityIds = communityStateValue.mySnippets.map(
          (snippet) => snippet.communityId
        );
        const postQueryRef = query(
          collection(firestore, "posts"),
          where("communityId", "in", myCommunityIds),
          limit(10)
        );
        const postDocs = await getDocs(postQueryRef);
        const posts = postDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPostStateValue((prev) => ({
          ...prev,
          posts: posts as Post[],
        }));
      } else {
        buildNoUserHomeFeed();
      }
    } catch (error) {
      console.log("buildUserHomeFeed", error);
    }
    setLoading(false);
  };

  const buildNoUserHomeFeed = useCallback(async () => {
    setLoading(true);
    try {
      const postQueryRef = query(
        collection(firestore, "posts"),
        orderBy("voteStatus", "desc")
      );
      const postDocs = await getDocs(postQueryRef);
      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));
    } catch (error) {
      console.log("buildNoUserHomeFeed", error);
    }
    setLoading(false);
  }, [setPostStateValue]);

  // const getUserPostVotes = async () => {
  //   setLoading(true);
  //   try {
  //     const postIds = postStateValue.posts.map((post) => post.id);
  //   const postVotesQuery = query(
  //     collection(firestore, `users/${user?.uid}/postVotes`),
  //     where("postId", "in", postIds)
  //   );
  //     const postVoteDocs = await getDocs(postVotesQuery);
  //     const postVotes = postVoteDocs.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }));
  //     setPostStateValue((prev) => ({
  //       ...prev,
  //       postVotes: postVotes as PostVote[],
  //     }));
  //   } catch (error) {
  //     console.log("getUserPostVotes", error);
  //   }
  //   setLoading(false);
  // };

  const getUserPostVotes = async () => {
    const postIds = postStateValue.posts.map((post) => post.id);
    const postVotesQuery = query(
      collection(firestore, `users/${user?.uid}/postVotes`),
      where("postId", "in", postIds)
    );
    const unsubscribe = onSnapshot(postVotesQuery, (querySnapshot) => {
      const postVotes = querySnapshot.docs.map((postVote) => ({
        id: postVote.id,
        ...postVote.data(),
      }));

      setPostStateValue((prev) => ({
        ...prev,
        postVotes: postVotes as PostVote[],
      }));
    });

    return () => unsubscribe();
  };
  useEffect(() => {
    if (communityStateValue.snippetsFetched) buildUserHomeFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityStateValue.snippetsFetched]);

  useEffect(() => {
    if (!user && !loadingUser) buildNoUserHomeFeed();
  }, [user, loadingUser, buildNoUserHomeFeed]);

  useEffect(() => {
    if (!user?.uid || !postStateValue.posts.length) return;
    getUserPostVotes();

    // Clear postVotes on dismount
    return () => {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postStateValue.posts, user?.uid]);
  // useEffect(() => {
  //   if (user && postStateValue.posts.length)  getUserPostVotes();

  //   return () => {
  //     setPostStateValue((prev) => ({
  //       ...prev,
  //       postVotes: [],
  //     }));
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [user, postStateValue.posts]);

  return (
    <PageContent>
      {/* post feed */}
      <>
        <CreatePostLink />
        {loading ? (
          <PostLoader />
        ) : (
          <Stack>
            {postStateValue.posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onDeletePost={onDeletePost}
                onVote={onVote}
                userVoteValue={
                  postStateValue.posts.find((item) => item.postId === post.id)
                    ?.voteStatus
                }
                onSelectPost={onSelectPost}
                userIsCreator={user?.uid === post.creatorId}
                homePage
              />
            ))}
          </Stack>
        )}
      </>

      {/* recommendation */}
      <>
        <Stack spacing={5}>
          <Recommendations />
          <Premium />
          <PersonalHome />
        </Stack>
      </>
    </PageContent>
  );
}

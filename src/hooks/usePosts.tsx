import {
  doc,
  deleteDoc,
  writeBatch,
  collection,
  query,
  where,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/AuthModalAtom";
import { Community, communityState } from "../atoms/CommunitiesAtom";
import { postState, Post, PostVote } from "../atoms/postAtom";
import { storage, firestore, auth } from "../firebase/authClient";

const usePosts = () => {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const [postStateValue, setPostStateValue] = useRecoilState(postState);
  const currentCommunity = useRecoilValue(communityState).currentCommunity;
  const setAuthModalState = useSetRecoilState(authModalState);

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => {
    event.stopPropagation();
    // check if the user is authenticated
    if (!user?.uid) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    try {
      const { voteStatus } = post;
      const existingVote = postStateValue.postVotes.find(
        (vote) => vote.postId === post.id
      );

      const batch = writeBatch(firestore);
      const updatedPost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      let updatedPostVotes = [...postStateValue.postVotes];
      let voteChange = vote;

      // new vote
      if (!existingVote) {
        // create new postVote document
        const postVoteRef = doc(
          collection(firestore, "users", `${user?.uid}/postVotes`)
        );

        const newVote: PostVote = {
          id: postVoteRef.id,
          postId: post.id!,
          communityId,
          voteValue: vote,
        };

        batch.set(postVoteRef, newVote);

        // add or substract 1 to/from the new post.voteValue
        // add or substract 1 to/from the new post.voteValue
        updatedPost.voteStatus = voteStatus + vote;
        updatedPostVotes = [...updatedPostVotes, newVote];
      } else {
        // existing vote have voted before
        const postVoteRef = doc(
          firestore,
          "users",
          `${user?.uid}/postVotes/${existingVote.id}`
        );

        // removing their vote (up => neutral, down=> neutral)
        if (existingVote.voteValue === vote) {
          // add or substract 1 to/from the new post.voteValue
          updatedPost.voteStatus = voteChange - vote;
          updatedPostVotes = updatedPostVotes.filter(
            (vote) => vote.id !== existingVote.id
          );

          // delete the post
          batch.delete(postVoteRef);

          voteChange *= -1;

          // Flipping their vote up and down
        } else {
          // add or substract 2 to/from the  post.voteValue
          updatedPost.voteStatus = voteStatus + 2 * vote;

          const voteIndex = postStateValue.postVotes.findIndex(
            (vote) => vote.id === existingVote.id
          );

          updatedPostVotes[voteIndex] = {
            ...existingVote,
            voteValue: vote,
          };

          // update the existing postVote document
          batch.update(postVoteRef, {
            voteValue: vote,
          });

          voteChange = 2 * vote;
        }

        if (postStateValue.selectedPost) {
          setPostStateValue((prev) => ({
            ...prev,
            selectedPost: updatedPost,
          }));
        }
      }
      // update the postRef document
      const postRef = doc(firestore, "posts", post.id!);
      batch.update(postRef, {
        voteStatus: voteChange + voteStatus,
      });

      await batch.commit();

      // update state with the updated value
      const postIndex = postStateValue.posts.findIndex(
        (item) => item.id === post.id
      );
      updatedPosts[postIndex] = updatedPost;
      setPostStateValue((prev) => ({
        ...prev,
        posts: updatedPosts,
        postVotes: updatedPostVotes,
      }));
    } catch (error: any) {
      console.log("Onvote error", error.message);
    }
  };
  const onSelectPost = (post: Post) => {
    setPostStateValue((prev) => ({
      ...prev,
      selectedPost: post,
    }));

    router.push(`/r/${post.communityId}/comments/${post.id}`);
  };
  const onDeletePost = async (post: Post): Promise<boolean> => {
    console.log("DELETING POST: ", post.id);

    try {
      // if post has an image url, delete it from storage
      if (post.imageURL) {
        const imageRef = ref(storage, `posts/${post.id}/image`);
        await deleteObject(imageRef);
      }

      // delete post from posts collection
      const postDocRef = doc(firestore, "posts", post.id);
      await deleteDoc(postDocRef);

      // Update post state
      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item.id !== post.id),
      }));

      /**
       * Cloud Function will trigger on post delete
       * to delete all comments with postId === post.id
       */
      return true;
    } catch (error) {
      console.log("THERE WAS AN ERROR", error);
      return false;
    }
  };

  const getCurrentCommunityVotes = useCallback(
    async (communityId: string) => {
      const postVotesQuery = query(
        collection(firestore, "users", `${user?.uid}/postVotes`),
        where("communityId", "==", communityId)
      );
      const postVotes = await getDocs(postVotesQuery);
      const postVote = postVotes.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPostStateValue((prev) => ({
        ...prev,
        postVotes: postVote as PostVote[],
      }));
    },
    [setPostStateValue, user?.uid]
  );

  useEffect(() => {
    if (!user || !currentCommunity?.id) return;
    getCurrentCommunityVotes(currentCommunity?.id);
  }, [user, currentCommunity, getCurrentCommunityVotes]);

  useEffect(() => {
    if (!user) {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    }
  }, [user, setPostStateValue]);

  return {
    postStateValue,
    setPostStateValue,
    onVote,
    onSelectPost,
    onDeletePost,
  };
};
export default usePosts;

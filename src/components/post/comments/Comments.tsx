import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import CommentInput from "./CommentInput";
import { User } from "firebase/auth";
import Post from "../Post";
import {
  collection,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../../../firebase/authClient";
import { useRecoilState, useSetRecoilState } from "recoil";
import { postState } from "../../../atoms/postAtom";
import CommentItem, { Comment } from "./CommentItem";

type CommentsProps = {
  user?: User;
  selectedPost: Post | null;
  communityId: string;
};

const Comments: React.FC<CommentsProps> = ({
  user,
  selectedPost,
  communityId,
}) => {
  // const [comment, setComment] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFetchLoading, setCommentFetchLoading] = useState(false);
  const [creatingLoading, setcreatingLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");
  const setPostState = useSetRecoilState(postState);

  const onCreateComments = async () => {
    setcreatingLoading(true);
    try {
      const batch = writeBatch(firestore);

      // create a comment document
      const commentsDocRef = doc(collection(firestore, "comments"));

      const newComment: Comment = {
        id: commentsDocRef.id,
        creatorId: user?.uid!,
        ccreatorDisplayNameText: user?.email!.split("@")[0]!,
        postId: selectedPost?.id!,
        postTitle: selectedPost?.title!,
        communityId,
        text: commentText,
        createdAt: serverTimestamp() as Timestamp,
      };

      batch.set(commentsDocRef, newComment);
      newComment.createdAt = { seconds: Date.now() / 1000 } as Timestamp;
      //    {
      //   id: commentsDocRef.id,
      //   creatorId: user?.uid,
      //   ccreatorDisplayNameText: user?.email!.split("@")[0],
      //   postId: selectedPost?.id,
      //   postTitle: selectedPost?.title,
      //   communityId,
      //   text: commentText,
      //   createdAt: serverTimestamp() as Timestamp,
      // } as Comment);

      // update the post numberOfComment +1
      const postDocRef = doc(firestore, "posts", selectedPost?.id!);

      batch.update(postDocRef, {
        numberOfComments: increment(1),
      });

      await batch.commit();

      // update client recoil state
      setCommentText("");
      setComments((prev) => [newComment, ...prev]);
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost,
          numberOfComments: prev.selectedPost?.numberOfComments! + 1,
        } as Post,
      }));
    } catch (error) {
      console.log("onCreateComments", error);
    }
    setcreatingLoading(false);
  };

  const onDeleteComment = useCallback(
    async (comment: Comment) => {
      setDeleteLoading(comment.id as string);
      try {
        if (!comment.id) throw "Comment has no ID";
        const batch = writeBatch(firestore);
        const commentDocRef = doc(firestore, "comments", comment.id);
        batch.delete(commentDocRef);

        batch.update(doc(firestore, "posts", comment.postId), {
          numberOfComments: increment(-1),
        });

        await batch.commit();

        setPostState((prev) => ({
          ...prev,
          selectedPost: {
            ...prev.selectedPost,
            numberOfComments: prev.selectedPost?.numberOfComments! - 1,
          } as Post,
          postUpdateRequired: true,
        }));

        setComments((prev) => prev.filter((item) => item.id !== comment.id));
        // return true;
      } catch (error: any) {
        console.log("Error deletig comment", error.message);
        // return false;
      }
      setDeleteLoading("");
    },
    [setComments, setPostState]
  );

  const getPostComments = useCallback(async () => {
    try {
      const commentsQuery = query(
        collection(firestore, "comments"),
        where("postId", "==", selectedPost?.id),
        orderBy("createdAt", "desc")
      );
      const commentDocs = await getDocs(commentsQuery);
      const comments = commentDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(comments as Comment[]);
    } catch (error: any) {
      console.log("getPostComments error", error.message);
    }
    setCommentFetchLoading(false);
  }, [selectedPost?.id]);

  useEffect(() => {


    getPostComments();
  }, [getPostComments, selectedPost?.id]);

  return (
    <Box bg="white" p={2} borderRadius="0px 0px 4px 4px">
      <Flex
        direction="column"
        pl={10}
        pr={4}
        mb={6}
        fontSize="10pt"
        width="100%"
      >
        <CommentInput
          commentText={commentText}
          creatingLoading={creatingLoading}
          user={user}
          onCreateComment={onCreateComments}
          setCommentText={setCommentText}
        />
      </Flex>
      <Stack spacing={6} p={2}>
        {commentFetchLoading ? (
          <>
            {[0, 1, 2].map((item) => (
              <Box key={item} padding="6" bg="white">
                <SkeletonCircle size="10" />
                <SkeletonText mt="4" noOfLines={2} spacing="4" />
              </Box>
            ))}
          </>
        ) : (
          <>
            {!!comments.length ? (
              <>
                {comments.map((item: Comment) => (
                  <CommentItem
                    key={item.id}
                    comment={item}
                    onDeleteComment={onDeleteComment}
                    isLoading={deleteLoading === (item.id as string)}
                    userId={user?.uid}
                  />
                ))}
              </>
            ) : (
              <Flex
                direction="column"
                justify="center"
                align="center"
                borderTop="1px solid"
                borderColor="gray.100"
                p={20}
              >
                <Text fontWeight={700} opacity={0.3}>
                  No Comments Yet
                </Text>
              </Flex>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};
export default Comments;

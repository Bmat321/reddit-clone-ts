import { TriangleUpIcon, ViewIcon } from "@chakra-ui/icons";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/AuthModalAtom";
import {
  Community,
  CommunitySnippet,
  communityState,
} from "../atoms/CommunitiesAtom";
import { auth, firestore } from "../firebase/authClient";

const useCommunityData = () => {
  const [communityStateValue, setCommunityStateValue] =
    useRecoilState(communityState);
  const setAuthModalState = useSetRecoilState(authModalState);
  const [user] = useAuthState(auth);
  const { communityId } = useRouter().query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onLeaveOrJoinCommunity = (
    communityData: Community,
    isJoined: boolean
  ) => {
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
    }
    if (isJoined) {
      leaveCommunity(communityData.id);
      return;
    }

    joinCommunity(communityData);
  };

  const getMySnippets = useCallback(async () => {
    setLoading(true);
    try {
      const snippetDoc = await getDocs(
        collection(firestore, `users/${user?.uid}/communitySnippets`)
      );
      const snippets = snippetDoc.docs.map((doc) => ({
        ...doc.data(),
      }));

      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: snippets as CommunitySnippet[],
        snippetsFetched: true,
      }));
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  }, [setCommunityStateValue, user?.uid]);

  const getCommunityData = useCallback(
    async (communityId: string) => {
      try {
        const communityDocRef = doc(firestore, "communities", communityId);
        const communityDoc = await getDoc(communityDocRef);

        setCommunityStateValue((prev) => ({
          ...prev,
          currentCommunity: {
            id: communityDoc.id,
            ...communityDoc.data(),
          } as Community,
        }));
      } catch (error) {
        console.log("getCommunityData", error);
      }
    },
    [setCommunityStateValue]
  );

  useEffect(() => {
    if (!user) {
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [],
        snippetsFetched: false,
      }));

      return;
    }
    getMySnippets();
  }, [getMySnippets, setCommunityStateValue, user]);

  useEffect(() => {
    if (communityId && !communityStateValue.currentCommunity) {
      getCommunityData(communityId as string);
    }
  }, [communityId, communityStateValue.currentCommunity, getCommunityData]);

  const joinCommunity = async (communityData: Community) => {
    try {
      const batch = writeBatch(firestore);

      const newSnippet: CommunitySnippet = {
        communityId: communityData.id,
        imageURL: communityData.imageURL || "",
        isModerator: user?.uid === communityData.creatorId,
      };

      batch.set(
        doc(
          firestore,
          `users/${user?.uid}/communitySnippets`,
          communityData.id
        ),
        newSnippet
      );
      batch.update(doc(firestore, "communities", communityData.id), {
        numberOfMembers: increment(1),
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: [...prev.mySnippets, newSnippet],
      }));
      await batch.commit();
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  const leaveCommunity = async (communityId: string) => {
    try {
      const batch = writeBatch(firestore);
      batch.delete(
        doc(firestore, `users/${user?.uid}/communitySnippets`, communityId)
      );
      batch.update(doc(firestore, "communities", communityId), {
        numberOfMembers: increment(-1),
      });
      setCommunityStateValue((prev) => ({
        ...prev,
        mySnippets: prev.mySnippets.filter(
          (item) => item.communityId !== communityId
        ),
      }));
      await batch.commit();
    } catch (error: any) {
      setError(error.message);
    }
    setLoading(false);
  };

  return {
    communityStateValue,
    onLeaveOrJoinCommunity,
    loading,
    error,
  };
};
export default useCommunityData;

import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { FaReddit } from "react-icons/fa";
import { useRecoilState, useRecoilValue } from "recoil";
import { communityState } from "../atoms/CommunitiesAtom";
import {
    defaultMenuItem,
  DirectoryMenuItem,
  directoryMenuState,
} from "../atoms/directoryMenuItem";

const useDirectory = () => {
  const [directoryState, setDirectoryState] =
    useRecoilState(directoryMenuState);
    const communityStateValue = useRecoilValue(communityState)
  const router = useRouter();

  const onSelectMenuItem = (menuItem: DirectoryMenuItem) => {
    setDirectoryState((prev) => ({
      ...prev,
      selectedMenuItem: menuItem,
    }));
    router.push(menuItem.link);
    if (directoryState.isOpen) return toggleMenuOpen();
  };

  const toggleMenuOpen = () => {
    setDirectoryState((prev) => ({
      ...prev,
      isOpen: !directoryState.isOpen,
    }));
  };


  useEffect(() => {
   
  const {currentCommunity} = communityStateValue

    if (currentCommunity) {
      setDirectoryState((prev) => ({
        ...prev, 
        selectedMenuItem: {
          displayText: `r/${currentCommunity.id}`,
          link: `r/${currentCommunity.id}`,
          icon: FaReddit,
          iconColor: "blue.500",
          imageURL: currentCommunity.imageURL,
        },
      }));
      return;
    }
    setDirectoryState((prev) => ({
      ...prev,
      selectedMenuItem: defaultMenuItem,
    }));
  }, [communityStateValue, setDirectoryState]);

  return { directoryState, toggleMenuOpen, onSelectMenuItem };
};
export default useDirectory;

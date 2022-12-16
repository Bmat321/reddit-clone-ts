import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { BsLink45Deg, BsMic } from "react-icons/bs";
import { BiPoll } from "react-icons/bi";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";

import TextInput from "./postform/TextInputs";
import ImageUpload from "./postform/ImageUpload";

import TableItems from "./TableItems";
import { User } from "@firebase/auth";
import { useRouter } from "next/router";
import { Post } from "../../atoms/postAtom";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { firestore, storage } from "../../firebase/authClient";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import useSelectFile from "../../hooks/useSelectFile";

type NewPostFormProps = {
  user: User;
  communityImageURL?: string
};

const formTabs: TableItems[] = [
  {
    title: "Post",
    icon: IoDocumentText,
  },
  {
    title: "Images & Video",
    icon: IoImageOutline,
  },
  {
    title: "Link",
    icon: BsLink45Deg,
  },
  {
    title: "Poll",
    icon: BiPoll,
  },
  {
    title: "Talk",
    icon: BsMic,
  },
];

export type TableItem = {
  title: string;
  icon: typeof Icon.arguments;
};

const NewPostForm: React.FC<NewPostFormProps> = ({ user, communityImageURL }) => {
  const route = useRouter();
  const [selectedTab, setSelectedTab] = useState(formTabs[0].title);
  const [textInputs, setTextInputs] = useState({
    title: "",
    body: "",
  });


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { onSelectFile, selectedFile, setSelectedFile } = useSelectFile();

  const handleCreatePost = async () => {
    const { communityId } = route.query;
    // Create new post object => typePost
    // const newPost: Post = {

    // };

    setLoading(true);

    try {
      // add post to db
      const postRef = await addDoc(collection(firestore, "posts"), {
        communityId: communityId as string,
        communityImageURL: communityImageURL || '',
        creatorId: user.uid,
        creatorDisplayName: user.email!.split("@")[0],
        title: textInputs.title,
        body: textInputs.body,
        numberOfComments: 0,
        voteStatus: 0,
        createdAt: serverTimestamp() as Timestamp,
      });

      // check for selected file
      if (selectedFile) {
        // store in storage and get downloaded URL
        const imageRef = ref(storage, `posts/${postRef.id}/image`);
        await uploadString(imageRef, selectedFile, "data_url");
        const downloadURL = await getDownloadURL(imageRef);

        // updte the postDoc by ading the downloadURL
        await updateDoc(postRef, {
          imageURL: downloadURL,
        });
      }
      route.back();
    } catch (error: any) {
      console.log("handleCreatePost error", error.message);
      setError(true);
    }
    setLoading(false);
  };

  const onTextChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {
      target: { name, value },
    } = event;
    setTextInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Flex direction="column" bg="white" borderRadius={4} mt={2}>
      <Flex width="100%">
        {formTabs.map((item, index) => (
          <TableItems
            item={item}
            key={index}
            selected={item.title === selectedTab}
            setSelectedTab={setSelectedTab}
          />
        ))}
      </Flex>
      <Flex p={4}>
        {selectedTab === "Post" && (
          <TextInput
            textInputs={textInputs}
            onChange={onTextChange}
            handleCreatePost={handleCreatePost}
            loading={loading}
          />
        )}

        {selectedTab === "Images & Video" && (
          <ImageUpload
            selectedFile={selectedFile}
            onSelectImage={onSelectFile}
            setSelectedTab={setSelectedTab}
            setSelectedFile={setSelectedFile}
          />
        )}
      </Flex>
      {error && (
        <Alert status="error">
          <AlertIcon />
          <Text mr={2}>{error}</Text>
        </Alert>
      )}
    </Flex>
  );
};
export default NewPostForm;

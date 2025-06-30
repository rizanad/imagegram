//@ts-nocheck
import { useEffect, useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaBookmark,
  FaRegBookmark,
  FaEllipsisH,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { auth } from "../../firebaseConfig";
import { useProfile } from "../../context/profileContext";

interface PostProps {
  userId: string;
  username: string;
  userImage: string;
  imageUrl: string;
  caption: string;
  likes: React.ReactNode;
  comments: React.ReactNode;
  timestamp: string;
}

const Post = ({
  userId,
  username,
  userImage,
  imageUrl,
  caption,
  likes,
  comments,
  timestamp,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [displayUserImage, setDisplayUserImage] = useState("");

  const { profilePicUrl } = useProfile();

  useEffect(() => {
    if (userId === auth.currentUser?.uid) {
      setDisplayUserImage(profilePicUrl || "");
    }
  }, [userId]);

  return (
    <div className="bg-white border rounded-lg mb-6">
      <div className="flex items-center p-3">
        <img
          src={userImage}
          alt={username}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-semibold ml-3 flex-1">{username}</span>
        <FaEllipsisH className="cursor-pointer" />
      </div>

      <div className="w-full aspect-square bg-gray-100">
        <img
          src={imageUrl}
          alt={caption}
          className="w-full h-full object-cover"
          onClick={() => setIsLiked(!isLiked)}
        />
      </div>

      <div className="p-3">
        <div className="flex justify-between mb-2">
          <div className="flex space-x-4">
            {likes}

            {comments}

            <FiSend className="text-xl" />
          </div>

          <button onClick={() => setIsSaved(!isSaved)}>
            {isSaved ? (
              <FaBookmark className="text-xl" />
            ) : (
              <FaRegBookmark className="text-xl" />
            )}
          </button>
        </div>

        <p className="mt-1">
          <span className="font-semibold mr-2">{username}</span>
          {caption}
        </p>

        <p className="text-gray-500 mt-1">View all {comments} comments</p>

        <p className="text-gray-400 text-xs mt-2">{timestamp}</p>
      </div>
    </div>
  );
};

export default Post;

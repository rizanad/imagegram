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

  const [displayUserImage, setDisplayUserImage] = useState(userImage);

  const { profilePicUrl } = useProfile();

  useEffect(() => {
    if (userId === auth.currentUser?.uid) {
      setDisplayUserImage(profilePicUrl || userImage);
    } else {
      setDisplayUserImage(userImage);
    }
  }, [userId, profilePicUrl, userImage]);

  return (
    <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg mb-8 overflow-hidden transition-transform hover:scale-[1.01]">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/10">
        <img
          src={displayUserImage}
          alt={username}
          className="w-10 h-10 rounded-full border-2 border-purple-400 object-cover"
        />
        <span className="font-semibold ml-4 text-white text-lg flex-1">
          {username}
        </span>
        <FaEllipsisH className="cursor-pointer text-gray-300 hover:text-white text-xl" />
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-gray-200/30 flex items-center justify-center">
        <img
          src={imageUrl}
          alt={caption}
          className="w-full h-full object-cover rounded-none"
          onClick={() => setIsLiked(!isLiked)}
        />
      </div>

      {/* Actions & Content */}
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div className="flex space-x-6 items-center">
            {likes}
            {comments}
            <FiSend className="text-xl text-gray-300 hover:text-purple-400 transition-colors duration-200 cursor-pointer" />
          </div>
          <button onClick={() => setIsSaved(!isSaved)}>
            {isSaved ? (
              <FaBookmark className="text-xl text-purple-400" />
            ) : (
              <FaRegBookmark className="text-xl text-gray-300 hover:text-purple-400 transition-colors duration-200" />
            )}
          </button>
        </div>

        <p className="mt-2 text-white">
          <span className="font-semibold mr-2 text-purple-300">{username}</span>
          {caption}
        </p>

        <div className="mt-2">
          {/* Comments summary (handled by comments component) */}
        </div>

        <p className="text-gray-400 text-xs mt-3">{timestamp}</p>
      </div>
    </div>
  );
};

export default Post;

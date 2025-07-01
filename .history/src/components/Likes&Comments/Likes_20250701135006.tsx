//@ts-nocheck

import { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import {
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const Likes = ({ postId }: any) => {
  const userId = auth.currentUser?.uid;
  const [likes, setLikes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", postId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const likes = Array.isArray(data.likes) ? data.likes : [];
        setLikes(likes);
      }
    });
    return () => unsub();
  }, [postId]);

  const isLiked = Array.isArray(likes) && likes.includes(userId);

  const handleLike = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    const updatedLikes = isLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];
    setLikes(updatedLikes);

    try {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
      });
    } catch (err) {
      toast.error("Error updating likes");
      console.log(err);
      setLikes(likes);
    }
    setIsProcessing(false);
  };

  return (
    <div>
      <div
        className="flex items-center space-x-2 cursor-pointer group select-none"
        onClick={handleLike}
      >
        {isLiked ? (
          <FaHeart className="text-pink-500 text-2xl drop-shadow-md transition-transform duration-150 group-active:scale-90" />
        ) : (
          <FaRegHeart className="text-gray-300 text-2xl hover:text-pink-400 transition-colors duration-200 group-hover:scale-110 group-active:scale-90" />
        )}
        <p className="text-sm font-semibold text-white group-hover:text-pink-400 transition-colors duration-200">
          {likes.length} {likes.length === 1 ? "like" : "likes"}
        </p>
      </div>
    </div>
  );
};

export default Likes;

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
import { trackUserInteraction } from "../../lib/recommendationEngine";

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

      // Track user interaction for recommendations
      if (userId) {
        await trackUserInteraction(userId, postId, "like");
      }
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
        className="flex items-center space-x-1 cursor-pointer"
        onClick={handleLike}
      >
        {isLiked ? (
          <FaHeart className="text-red-500 text-xl" />
        ) : (
          <FaRegHeart className="text-xl" />
        )}
        <p className="text-sm font-semibold">{likes.length} likes</p>
      </div>
    </div>
  );
};

export default Likes;

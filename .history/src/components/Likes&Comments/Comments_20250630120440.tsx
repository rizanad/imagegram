import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { FaRegComment } from "react-icons/fa";
import { trackUserInteraction } from "../../lib/recommendationEngine";

interface Comment {
  username: string;
  text: string;
  createdAt?: any;
}

interface CommentProps {
  postId: string;
}

const Comments = ({ postId }: CommentProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => doc.data() as Comment);
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === "") return;

    const comment = {
      username: auth.currentUser?.displayName || "Unknown",
      text: newComment,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "posts", postId, "comments"), comment);

      // Track user interaction for recommendations
      if (auth.currentUser?.uid) {
        await trackUserInteraction(auth.currentUser.uid, postId, "comment");
      }

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-black">
          <FaRegComment size={18} />
          {comments.length > 0 && (
            <p className="text-sm">View all {comments.length} comments</p>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md text-black">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 text-black">
          {comments.map((c, i) => (
            <div key={i}>
              <span className="font-semibold mr-2">{c.username}</span>
              {c.text}
            </div>
          ))}
        </div>

        <DialogFooter className="pt-4">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          />
          <Button onClick={handleAddComment}>Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Comments;

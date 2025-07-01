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

    await addDoc(collection(db, "posts", postId, "comments"), comment);
    setNewComment("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-purple-400 transition-colors duration-200">
          <FaRegComment size={20} />
          {comments.length > 0 && (
            <p className="text-sm text-white/80 group-hover:text-purple-400 transition-colors duration-200">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </p>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl text-white">
        <DialogHeader>
          <DialogTitle className="text-purple-300">Comments</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-center">
              No comments yet. Be the first!
            </p>
          ) : (
            comments.map((c, i) => (
              <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                <span className="font-semibold mr-2 text-purple-200">
                  {c.username}
                </span>
                <span className="text-white/90">{c.text}</span>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-4 flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-purple-400 focus:border-purple-400 rounded-lg"
          />
          <Button
            onClick={handleAddComment}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Comments;

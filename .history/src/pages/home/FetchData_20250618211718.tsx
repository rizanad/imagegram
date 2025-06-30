//@ts-nocheck
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import newAvatar from "../../assets/newAvatar.jpg";

export type PostType = {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
};

const FetchData = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultImage = newAvatar;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsCol = collection(db, "posts");
        const q = query(postsCol, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        // Fetch all posts with their authors' profile pictures
        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Fetch the author's profile picture
            // let authorProfilePic = defaultImage;
            // try {
            //   const profileDoc = await getDoc(doc(db, "profile", data.userId));
            //   if (profileDoc.exists()) {
            //     authorProfilePic = profileDoc.data()?.photoUrl || defaultImage;
            //   }
            // } catch (error) {
            //   console.error("Error fetching profile picture:", error);
            // }

            // Format timestamp
            const timestamp =
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate().toLocaleString()
                : "No Date";

            return {
              id: doc.id,
              userId: data.userId,
              username: data.username || "Unknown User",
              userImage: data.userImage || defaultImage,
              imageUrl: data.imageUrl || "",
              caption: data.content || "",
              likes: data.likes || 0,
              comments: data.comments || 0,
              timestamp,
            };
          })
        );

        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return { loading, posts };
};

export default FetchData;

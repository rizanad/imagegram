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
          snapshot.docs.map(async (postDoc) => {
            const postData = postDoc.data();

            // Initialize with default values
            let userImage = defaultImage;
            let username = postData.username || "Unknown User";

            // Fetch the author's profile from 'profile' collection
            try {
              const profileDocRef = doc(db, "profile", postData.userId);
              const profileDoc = await getDoc(profileDocRef);

              if (profileDoc.exists()) {
                const profileData = profileDoc.data();
                userImage = profileData?.photoUrl || defaultImage;
                // Update username from profile if available
                username = profileData?.username || username;
              }
            } catch (error) {
              console.error("Error fetching profile data:", error);
            }

            // Format timestamp
            const timestamp =
              postData.timestamp instanceof Timestamp
                ? postData.timestamp.toDate().toLocaleString()
                : "No Date";

            return {
              id: postDoc.id,
              userId: postData.userId,
              username,
              userImage,
              imageUrl: postData.imageUrl || "",
              caption: postData.content || "",
              likes: postData.likes || 0,
              comments: postData.comments || 0,
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

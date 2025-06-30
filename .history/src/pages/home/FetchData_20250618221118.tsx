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

        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (postDoc) => {
            const data = postDoc.data();

            let authorProfilePic = defaultImage;
            try {
              const profileDocRef = doc(db, "profile", data.userId);
              const profileSnap = await getDoc(profileDocRef);

              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                if (profileData.photoUrl) {
                  authorProfilePic = profileData.photoUrl;
                }
              } else {
                if (data.userImage) {
                  authorProfilePic = data.userImage;
                }
              }
            } catch (error) {
              console.error(
                "Error fetching profile picture for user",
                data.userId,
                ":",
                error
              );
            }

            const timestamp =
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate().toLocaleString()
                : "No Date";

            const post = {
              id: postDoc.id,
              userId: data.userId,
              username: data.username || "Unknown User",
              userImage: authorProfilePic,
              imageUrl: data.imageUrl || "",
              caption: data.content || "",
              likes: data.likes || 0,
              comments: data.comments || 0,
              timestamp,
            };
            return post;
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

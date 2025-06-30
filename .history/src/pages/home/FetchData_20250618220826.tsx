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
            const data = postDoc.data();
            console.log(
              "Processing post for user:",
              data.userId,
              "Username:",
              data.username
            );

            // Fetch the author's profile picture
            let authorProfilePic = defaultImage;
            try {
              const profileDocRef = doc(db, "profile", data.userId);
              const profileSnap = await getDoc(profileDocRef);
              console.log(
                "Profile doc exists:",
                profileSnap.exists(),
                "for user:",
                data.userId
              );

              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                console.log(
                  "Profile data for user",
                  data.userId,
                  ":",
                  profileData
                );

                // Check if photoUrl exists in the profile data
                if (profileData.photoUrl) {
                  authorProfilePic = profileData.photoUrl;
                  console.log(
                    "Using profile pic from profile doc:",
                    authorProfilePic
                  );
                } else {
                  console.log(
                    "No photoUrl in profile doc, using default image"
                  );
                }
              } else {
                // If no profile doc exists, try to get the userImage from the post data
                if (data.userImage) {
                  authorProfilePic = data.userImage;
                  console.log(
                    "Using userImage from post data:",
                    authorProfilePic
                  );
                } else {
                  console.log(
                    "No profile doc and no userImage in post, using default image"
                  );
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

            // Format timestamp
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
            console.log("Created post object for user", data.userId, ":", post);
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

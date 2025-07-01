import { useEffect, useState } from "react";
import { auth } from "../../firebaseConfig";
import {
  getPersonalizedRecommendations,
  trackUserInteraction,
} from "../../lib/recommendationEngine";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Post from "../post";
import Likes from "../Likes&Comments/Likes";
import Comments from "../Likes&Comments/Comments";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export interface RecommendedPost {
  id: string;
  userId: string;
  username: string;
  userImage: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  recommendationReason: string;
  recommendationScore: number;
}

const Recommendations = () => {
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        fetchRecommendations(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchRecommendations = async (userId: string) => {
    try {
      setLoading(true);

      // Get personalized recommendations
      const recommendations = await getPersonalizedRecommendations(userId, 10);

      if (recommendations.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch post details for recommended posts
      const postsData = await Promise.all(
        recommendations.map(async (rec) => {
          const postDoc = await getDoc(doc(db, "posts", rec.postId));
          if (postDoc.exists()) {
            const data = postDoc.data();

            // Get user data for the post author
            let username = "Unknown User";
            let userImage = "https://i.pravatar.cc/150?img=5";

            try {
              const userDoc = await getDoc(doc(db, "users", data.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                username = userData.displayName || "Unknown User";
                userImage =
                  userData.photoURL || "https://i.pravatar.cc/150?img=5";
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }

            return {
              id: postDoc.id,
              userId: data.userId,
              username,
              userImage,
              imageUrl: data.imageUrl || "",
              caption: data.content || "",
              likes: Array.isArray(data.likes) ? data.likes.length : 0,
              comments: Array.isArray(data.comments) ? data.comments.length : 0,
              timestamp:
                data.timestamp?.toDate?.()?.toLocaleString() || "No Date",
              recommendationReason: rec.reason,
              recommendationScore: rec.score,
            };
          }
          return null;
        })
      );

      // Filter out null values and set state
      const validPosts = postsData.filter(
        (post) => post !== null
      ) as RecommendedPost[];
      setRecommendedPosts(validPosts);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostInteraction = async (
    postId: string,
    interactionType: "like" | "comment" | "save" | "view"
  ) => {
    if (currentUser) {
      await trackUserInteraction(currentUser.uid, postId, interactionType);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-2 text-gray-600">Finding posts for you...</span>
        </div>
      </div>
    );
  }

  if (recommendedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Recommendations Header */}
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaSparkles className="text-purple-600 text-lg" />
            <h2 className="text-lg font-semibold text-gray-800">
              Recommended for you
            </h2>
            <span className="text-sm text-gray-500">
              ({recommendedPosts.length} posts)
            </span>
          </div>
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showRecommendations ? (
              <>
                <FaEyeSlash className="text-sm" />
                <span className="text-sm">Hide</span>
              </>
            ) : (
              <>
                <FaEye className="text-sm" />
                <span className="text-sm">Show</span>
              </>
            )}
          </button>
        </div>

        {showRecommendations && (
          <div className="mt-3 text-sm text-gray-600">
            <p>Based on your likes, follows, and interests</p>
          </div>
        )}
      </div>

      {/* Recommended Posts */}
      {showRecommendations && (
        <div className="space-y-6">
          {recommendedPosts.map((post) => (
            <div key={post.id} className="relative">
              {/* Recommendation Badge */}
              <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                <FaSparkles className="inline mr-1" />
                Recommended
              </div>

              {/* Recommendation Reason Tooltip */}
              <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs max-w-xs">
                {post.recommendationReason}
              </div>

              <Post
                userId={post.userId}
                username={post.username}
                userImage={post.userImage}
                imageUrl={post.imageUrl}
                caption={post.caption}
                likes={<Likes postId={post.id} />}
                comments={<Comments postId={post.id} />}
                timestamp={post.timestamp}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;

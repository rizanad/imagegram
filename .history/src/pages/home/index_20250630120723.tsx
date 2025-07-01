//@ts-nocheck
import Layout from "../../components/layout";
import Post from "../../components/post";
import UserList from "../../components/userList";
import FetchData, { PostType } from "./FetchData";
import { auth } from "../../firebaseConfig";
import { useEffect } from "react";
import { useProfile } from "../../context/profileContext";
import newAvatar from "../../assets/newAvatar.jpg";
import Likes from "../../components/Likes&Comments/Likes";
import Comments from "../../components/Likes&Comments/Comments";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Recommendations from "../../components/Recommendations";
import UserPreferences from "../../components/UserPreferences";

const Home = () => {
  const { loading, posts } = FetchData();
  const { profilePicUrl, loadingProfilePic, refreshProfilePic } = useProfile();

  const defaultImage = newAvatar;

  // Debugging
  useEffect(() => {
    console.log("Home component - Profile pic URL:", profilePicUrl);
    console.log("Home component - Posts count:", posts.length);
  }, [profilePicUrl, posts]);

  const debugUsers = async () => {
    try {
      console.log("=== MANUAL DEBUG ===");
      const usersSnapshot = await getDocs(collection(db, "users"));
      console.log("Total users in database:", usersSnapshot.docs.length);
      usersSnapshot.forEach((doc) => {
        console.log("User:", doc.id, doc.data());
      });
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  const handleFollowUpdate = () => {
    // Refresh profile data when a follow action occurs
    refreshProfilePic();
  };

  if (loading || loadingProfilePic) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center min-h-screen w-full bg-gray-50 text-black overflow-hidden">
        <div className="flex w-full max-w-[1100px] pt-4 px-4">
          {/* Posts Feed */}
          <div className="flex-1 max-w-[700px] mr-8 overflow-y-auto h-[calc(100vh-4rem)] pb-4 pr-2">
            <div className="space-y-6">
              {/* Recommendations Section */}
              <Recommendations />

              {/* Regular Posts Feed */}
              {posts.map((post: PostType) => {
                return (
                  <Post
                    key={post.id}
                    userId={post.userId}
                    username={post.username}
                    userImage={post.userImage}
                    imageUrl={post.imageUrl}
                    caption={post.caption}
                    likes={<Likes postId={post.id} />}
                    comments={
                      <Comments
                        postId={post.id}
                        initialComments={post.comments}
                      />
                    }
                    timestamp={post.timestamp}
                  />
                );
              })}
            </div>
          </div>

          {/* Sidebar - Current User Profile */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white border rounded-lg p-4 sticky top-4">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={profilePicUrl || defaultImage}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {auth.currentUser?.displayName || "User"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {auth.currentUser?.email}
                  </p>
                </div>
              </div>

              {/* User Preferences */}
              <div className="border-t pt-4 mb-4">
                <UserPreferences />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Suggested for you
                </h4>
                <UserList onFollowUpdate={handleFollowUpdate} />
              </div>

              {/* Debug Button - Remove in production */}
              <button
                onClick={debugUsers}
                className="mt-4 w-full bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Debug Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;

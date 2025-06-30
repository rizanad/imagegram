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

const Home = () => {
  const { loading, posts } = FetchData();
  const { profilePicUrl, loadingProfilePic } = useProfile();

  const defaultImage = newAvatar;

  // Debugging
  useEffect(() => {}, [profilePicUrl, posts]);

  if (loading || loadingProfilePic) {
    return (
      <Layout>
        <div className="flex justify-center min-h-screen w-full bg-gray-50 text-black overflow-hidden animate-pulse">
          <div className="flex w-full max-w-[1100px] pt-4 px-4">
            <div className="flex-1 max-w-[700px] mr-8 overflow-y-auto h-[700px] pb-4 pr-2 space-y-6">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-md shadow-md p-4"
                >
                  <div className="flex items-center space-x-10 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-400"></div>
                    <div className="h-4 bg-gray-400 rounded w-32"></div>
                  </div>
                  <div className="bg-gray-400 rounded-md h-[400px]"></div>
                  <div className="mt-3 space-y-2">
                    <div className="h-10 bg-gray-400 rounded w-[650px]"></div>
                    <div className="h-3 bg-gray-400 rounded w-full"></div>
                    <div className="h-3 bg-gray-400 rounded w-5/6"></div>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="h-4 bg-gray-400 rounded w-16"></div>
                      <div className="h-4 bg-gray-400 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block w-[293px] sticky top-4 self-start h-fit">
              <div className="flex items-center mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border p-[2px] bg-gray-300"></div>
                <div className="ml-4">
                  <div className="font-semibold text-sm text-black bg-gray-300 rounded w-32 h-4"></div>
                </div>
              </div>
              <div className="bg-gray-300 rounded-md shadow-md p-3">
                <div className="h-5 bg-gray-400 rounded w-full mb-2"></div>
                <ul>
                  {[1, 2, 3, 4].map((index) => (
                    <li
                      key={index}
                      className="flex items-center space-x-3 py-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-400"></div>
                      <div className="h-4 bg-gray-400 rounded w-24"></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
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
                  clg
                );
              })}
            </div>
          </div>

          {/* Sidebar - Current User Profile */}
          <div className="hidden md:block w-[293px] sticky top-4 self-start h-fit">
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 rounded-full overflow-hidden border p-[2px]">
                <img
                  src={profilePicUrl || defaultImage}
                  alt="Profile"
                  className="h-full  w-full rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                  }}
                />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-sm text-black">
                  {auth.currentUser?.displayName || "Your Username"}
                </p>
              </div>
            </div>
            <UserList />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home;

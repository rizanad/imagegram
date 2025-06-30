//@ts-nocheck
import { useEffect, useState } from "react";
import Layout from "../../components/layout";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/button";
// import ReactTooltip from "react-tooltip";
import { Tooltip } from "react-tooltip";
import FollowersModal from "../../components/FollowersModal";

interface Post {
  id: string;
  imageUrl: string;
  // Add other post fields you might have
}

interface UserProfileData {
  username: string;
  bio: string;
  profilePic: string;
  followers: number;
  following: number;
}

const publicKey = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userData, setUserData] = useState<UserProfileData>({
    username: "",
    bio: "",
    profilePic: "",
    followers: 0,
    following: 0,
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [editProfileImageFile, setEditProfileImageFile] = useState<File | null>(
    null
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [updateProfileError, setUpdateProfileError] = useState<string | null>(
    null
  );

  const [open, setOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState();
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">(
    "followers"
  );

  const selectedPostIndex = posts.findIndex((post) => post === selectedPost);
  const isAtFirstPost = selectedPostIndex === 0;
  const isAtLastPost = selectedPostIndex === posts.length - 1;

  function handleLeftClick() {
    const selectedPostIndex = posts.findIndex((post) => post === selectedPost);

    if (selectedPostIndex === -1 || selectedPostIndex === 0) {
      return;
    } else {
      setSelectedPost(posts[selectedPostIndex - 1]);
    }
  }

  function handleRightClick() {
    const selectedPostIndex = posts.findIndex((post) => post === selectedPost);
    if (selectedPostIndex === posts.length - 1) {
      return;
    } else {
      setSelectedPost(posts[selectedPostIndex + 1]);
    }
  }

  function handleImageClick(post: any, index: number) {
    setSelectedPost(post);
    setOpen(true);
    console.log(index);
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(postsQuery);
        const userPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];
        setPosts(userPosts);
        console.log(userPosts);

        // Fetch user profile data from the 'profile' collection
        const profileDocRef = doc(db, "profile", user.uid);
        const profileSnap = await getDoc(profileDocRef);

        // Fetch real follower and following counts
        const followersSnapshot = await getDocs(
          collection(db, `users/${user.uid}/followers`)
        );
        const followingSnapshot = await getDocs(
          collection(db, `users/${user.uid}/following`)
        );

        const followersCount = followersSnapshot.docs.length;
        const followingCount = followingSnapshot.docs.length;

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          setUserData({
            username: user.displayName || "Username",
            bio: profileData.bio || "",
            profilePic: profileData.photoUrl || "",
            followers: followersCount,
            following: followingCount,
          });
          setEditBio(profileData.bio || "");
          setEditProfileImage(profileData.photoUrl || null);
        } else {
          // If no profile document exists, set initial data
          setUserData({
            username: user.displayName || "Username",
            bio: "",
            profilePic: "",
            followers: followersCount,
            following: followingCount,
          });
          setEditBio("");
          setEditProfileImage(null);
        }
      } catch (err) {
        console.error("Error Fetching Data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditProfileImage(userData.profilePic || null); // Reset preview
    setEditProfileImageFile(null);
    setEditBio(userData.bio); // Reset bio
    setUpdateProfileError(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditProfileImageFile(file);
      setEditProfileImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveEditImage = () => {
    setEditProfileImage(null);
    setEditProfileImageFile(null);
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    setUpdateProfileError(null);

    const user = auth.currentUser;
    if (!user) return;

    let uploadedImageUrl: string | null = null;

    if (editProfileImageFile) {
      try {
        const formData = new FormData();
        formData.append("file", editProfileImageFile);
        formData.append("UPLOADCARE_PUB_KEY", publicKey);

        const uploadResponse = await fetch(
          `https://upload.uploadcare.com/base/`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload profile image");
        }

        const uploadData = await uploadResponse.json();
        uploadedImageUrl = `https://ucarecdn.com/${uploadData.file}/`;
      } catch (error: any) {
        console.error("Error uploading profile image:", error);
        setUpdateProfileError("Failed to upload profile image.");
        setIsUpdatingProfile(false);
        return;
      }
    }

    try {
      const profileDocRef = doc(db, "profile", user.uid);
      const updateData: { bio: string; photoUrl: string } = {
        bio: editBio,
        photoUrl: uploadedImageUrl || userData.profilePic || "", // Use uploaded if available, else existing, else empty
      };

      // Use setDoc with merge: true to create if it doesn't exist, update if it does
      await setDoc(profileDocRef, updateData, { merge: true });

      setUserData({
        ...userData,
        bio: editBio,
        profilePic: updateData.photoUrl,
      });
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setUpdateProfileError("Failed to update profile information.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this post?"
    );
    if (!confirm) return;

    if (!postId) {
      toast.error("Invalid post ID");

      return;
    }

    setIsDeleting(true);
    try {
      const postDocRef = doc(db, "posts", postId);
      await deleteDoc(postDocRef);
      toast.success("Post deleted successfully");

      // Optionally remove post from UI without refetching
      setPosts((prev) => prev.filter((post) => post.id !== postId));

      if (isAtFirstPost) {
        setSelectedPost(posts[selectedPostIndex + 1]);
      } else if (isAtLastPost) {
        setSelectedPost(posts[selectedPostIndex - 1]);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Couldn't delete the post");
    } finally {
      setIsDeleting(false);
    }
  };
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center m-12 animate-pulse">
          {/* Skeleton Profile Header */}
          <div className="flex gap-16 w-full px-4">
            {/* Skeleton Profile Picture */}
            <div className="w-32 h-32 rounded-full bg-gray-300 border-2 border-gray-300"></div>

            {/* Skeleton Profile Stats and Edit Button */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-300 rounded w-48"></div>
                <div className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded w-24"></div>
              </div>
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded w-10 mx-auto"></div>
                  <div className="h-3 bg-gray-300 rounded w-14 mx-auto mt-1"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded w-10 mx-auto"></div>
                  <div className="h-3 bg-gray-300 rounded w-20 mx-auto mt-1"></div>
                </div>
                <div className="text-center">
                  <div className="h-4 bg-gray-300 rounded w-10 mx-auto"></div>
                  <div className="h-3 bg-gray-300 rounded w-20 mx-auto mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Bio Section */}
          <section className="w-full px-4 mt-6">
            <div className="h-5 bg-gray-300 rounded w-32"></div>
            <div className="h-3 bg-gray-300 rounded w-full mt-2"></div>
            <div className="h-3 bg-gray-300 rounded w-4/5 mt-1"></div>
          </section>

          {/* Skeleton Posts Grid */}
          <section className="w-full mt-10 border-t border-gray-300">
            <div className="text-center py-4 font-semibold bg-gray-300 rounded-sm w-32 mx-auto"></div>
            <div className="grid grid-cols-3 gap-1 mt-4">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden bg-gray-300"
                ></div>
              ))}
            </div>
          </section>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col items-center m-12 ">
        {/* Profile Header */}
        <div className="flex gap-16 w-full px-4">
          {/* Profile Picture */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-300">
            <img
              src={userData.profilePic || "/default-profile.jpg"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Profile Stats and Edit Button */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold">{userData.username}</h1>
              <button
                onClick={openEditModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Edit Profile
              </button>
            </div>
            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <p className="font-bold">{posts.length}</p>
                <p className="text-sm">Posts</p>
              </div>
              <div
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setModalType("followers");
                  setModalOpen(true);
                }}
              >
                <p className="font-bold">{userData.followers}</p>
                <p className="text-sm">Followers</p>
              </div>
              <div
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  setModalType("following");
                  setModalOpen(true);
                }}
              >
                <p className="font-bold">{userData.following}</p>
                <p className="text-sm">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <section className="w-full px-4 mt-6">
          <h3 className="font-bold">{userData.username}</h3>
          <p className="text-sm mt-1">{userData.bio}</p>
        </section>

        {/* Posts Grid */}
        <section className="w-full mt-10 border-t border-gray-300">
          <h1 className="text-center py-4 font-semibold">Your Posts</h1>
          {posts.length === 0 ? (
            <div className="flex justify-center py-10">
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post, index) => (
                <div
                  key={index}
                  className="aspect-square overflow-hidden"
                  onClick={() => handleImageClick(post, index)}
                >
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover hover:opacity-80 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[80vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden ">
              {selectedPost && (
                <div className="flex flex-col sm:flex-row h-full w-full">
                  {/* Left Side - Image (Larger Display) */}
                  <div className="relative w-full sm:w-[60%] h-[50%] sm:h-full flex items-center justify-center bg-gray-100">
                    {/* Navigation Buttons */}
                    {!isAtFirstPost && (
                      <button
                        onClick={handleLeftClick}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-300 shadow-lg transition-all"
                        aria-label="Previous post"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                    )}

                    <img
                      src={selectedPost.imageUrl}
                      alt="Post"
                      className="max-h-full max-w-full object-contain p-4"
                      style={{ maxHeight: "calc(90vh - 32px)" }}
                    />
                  </div>

                  {/* Right Side - Post Info */}
                  <div className="relative w-full sm:w-[40%] h-[50%] sm:h-full p-4 flex flex-col overflow-y-auto bg-white text-black">
                    <div className="flex items-center gap-3">
                      <img
                        src={userData.profilePic || "/default-profile.jpg"}
                        alt=""
                        className="w-12 h-12 object-cover rounded-full"
                      />
                      <span className="font-medium">
                        {userData.username || "Username"}
                      </span>
                    </div>

                    <div className="border-t mt-4 space-y-4">
                      <div>
                        <h3 className="font-semibold mt-3">📝 Caption</h3>
                        <p className="mt-1">
                          {selectedPost.content || "No caption."}
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <span>❤️ {selectedPost.likes || 0} Likes</span>
                        <span>
                          💬 {selectedPost.comments?.length || 0} Comments
                        </span>
                      </div>

                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">All Comments</h3>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                          {selectedPost.comments?.length > 0 ? (
                            selectedPost.comments.map((comment, index) => (
                              <div key={index} className="text-sm">
                                <strong>{comment.user}:</strong> {comment.text}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">No comments yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isAtLastPost && (
                      <button
                        onClick={handleRightClick}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-gray-200 shadow-lg transition-all"
                        aria-label="Next post"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                      </button>
                    )}

                    {/* Delete Button - Fixed at bottom right */}
                    <div className="mt-auto pt-4  flex justify-end">
                      <Button
                        data-tooltip-id="Delete"
                        data-tooltip-content="Delete Post"
                        variant="destructive"
                        onClick={() => handleDeletePost(selectedPost.id)}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        <Trash2 />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                      <Tooltip
                        id="Delete"
                        place="top"
                        delayShow={500}
                        opacity={1}
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </section>

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white rounded-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

              <div className="mb-4">
                <label
                  htmlFor="editProfileImage"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Profile Photo:
                </label>
                <input
                  type="file"
                  id="editProfileImage"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {editProfileImage && (
                  <div className="mt-2 relative">
                    <img
                      src={editProfileImage}
                      alt="Profile preview"
                      className="max-h-40 rounded-full object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label
                  htmlFor="editBio"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Bio:
                </label>
                <textarea
                  id="editBio"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-none h-24"
                  placeholder="Write your bio here..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              {updateProfileError && (
                <p className="text-red-500 text-xs italic mb-2">
                  {updateProfileError}
                </p>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={closeEditModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={auth.currentUser?.uid || ""}
        type={modalType}
        count={
          modalType === "followers" ? userData.followers : userData.following
        }
      />
    </Layout>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUserAuth } from "../../context/userAuthContext";

type UserData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

const UserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const { user } = useUserAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUsersAndFollowing = async () => {
      setLoading(true);
      try {
        console.log("Fetching users and following status...");

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs
          .map((doc) => doc.data() as UserData)
          .filter((u) => u.uid !== user.uid); // Exclude current user

        console.log("All users found:", allUsers.length);
        console.log("Current user:", user.uid);

        // If no users found, create some dummy users for testing
        if (allUsers.length === 0) {
          console.log("No users found, creating dummy users for testing...");
          const dummyUsers = [
            {
              uid: "dummy1",
              email: "user1@example.com",
              displayName: "John Doe",
              photoURL: "https://i.pravatar.cc/150?img=1",
            },
            {
              uid: "dummy2",
              email: "user2@example.com",
              displayName: "Jane Smith",
              photoURL: "https://i.pravatar.cc/150?img=2",
            },
            {
              uid: "dummy3",
              email: "user3@example.com",
              displayName: "Mike Johnson",
              photoURL: "https://i.pravatar.cc/150?img=3",
            },
          ];
          setUsers(dummyUsers);
          setLoading(false);
          return;
        }

        // Fetch whom the current user is following
        const followingSnapshot = await getDocs(
          collection(db, `users/${user.uid}/following`)
        );
        const followingIds = followingSnapshot.docs.map((doc) => doc.id);
        setFollowing(followingIds);

        console.log("Following IDs:", followingIds);

        // Filter out users that are already being followed
        const suggestedUsers = allUsers.filter(
          (u) => !followingIds.includes(u.uid)
        );

        console.log("Suggested users:", suggestedUsers);
        setUsers(suggestedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        // Fallback to dummy users on error
        const dummyUsers = [
          {
            uid: "dummy1",
            email: "user1@example.com",
            displayName: "John Doe",
            photoURL: "https://i.pravatar.cc/150?img=1",
          },
          {
            uid: "dummy2",
            email: "user2@example.com",
            displayName: "Jane Smith",
            photoURL: "https://i.pravatar.cc/150?img=2",
          },
        ];
        setUsers(dummyUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndFollowing();
  }, [user]);

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;

    try {
      const currentUserRef = doc(db, "users", user.uid);
      const targetUserRef = doc(db, "users", targetUserId);

      // Add target to current user's following list
      await setDoc(doc(collection(currentUserRef, "following"), targetUserId), {
        uid: targetUserId,
      });

      // Add current user to target's followers list
      await setDoc(doc(collection(targetUserRef, "followers"), user.uid), {
        uid: user.uid,
      });

      // Update UI
      setFollowing([...following, targetUserId]);
      setUsers(users.filter((u) => u.uid !== targetUserId));
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="font-semibold text-gray-500 mb-4">Suggestions For You</h2>
      {loading ? (
        <p className="text-gray-400">Loading suggestions...</p>
      ) : users.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">No new users to suggest.</p>
          <p className="text-gray-300 text-xs mt-1">
            Try creating some posts to see other users!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.uid} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {u.photoURL ? (
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-semibold">
                      {u.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">
                    {u.displayName || "Unknown User"}
                  </p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleFollow(u.uid)}
                className="text-blue-500 font-semibold text-sm hover:text-blue-600 transition-colors"
              >
                Follow
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;

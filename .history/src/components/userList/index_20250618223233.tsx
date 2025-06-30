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

  useEffect(() => {
    if (!user) return;

    const fetchUsersAndFollowing = async () => {
      try {
        console.log("Fetching users and following status...");

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsers = usersSnapshot.docs
          .map((doc) => doc.data() as UserData)
          .filter((u) => u.uid !== user.uid); // Exclude current user

        console.log("All users found:", allUsers.length);
        console.log("Current user:", user.uid);

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
    <div>
      <h2 className="font-semibold text-gray-500 mb-4">Suggestions For You</h2>
      {users.length === 0 ? (
        <p>No new users to suggest.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.uid} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {u.photoURL && (
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <p className="font-semibold text-sm">{u.displayName}</p>
              </div>
              <button
                onClick={() => handleFollow(u.uid)}
                className="text-blue-500 font-semibold text-sm"
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

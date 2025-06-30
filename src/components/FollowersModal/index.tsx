import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useNavigate } from "react-router-dom";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  count: number;
}

const FollowersModal = ({
  isOpen,
  onClose,
  userId,
  type,
  count,
}: FollowersModalProps) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch the user IDs from the followers/following subcollection
        const userRefsSnapshot = await getDocs(
          collection(db, `users/${userId}/${type}`)
        );
        const userIds = userRefsSnapshot.docs.map((doc) => doc.id);

        // Fetch the actual user data for each ID
        const userDataPromises = userIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            return userDoc.data() as UserData;
          }
          return null;
        });

        const userData = await Promise.all(userDataPromises);
        const validUsers = userData.filter(
          (user) => user !== null
        ) as UserData[];
        setUsers(validUsers);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  const handleUserClick = (user: UserData) => {
    onClose();
    // Navigate to the user's profile
    // You might want to create a user profile route like /profile/:userId
    navigate(`/profile/${user.uid}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === "followers" ? "Followers" : "Following"} ({count})
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.uid}
                  onClick={() => handleUserClick(user)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {user.displayName || "Unknown User"}
                    </p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;

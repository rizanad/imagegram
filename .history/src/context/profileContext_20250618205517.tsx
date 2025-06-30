import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface ProfileContextType {
  profilePicUrl: string | null;
  loadingProfilePic: boolean;
  refreshProfilePic: () => Promise<void>; // Allow manual refresh
}

const ProfileContext = createContext<ProfileContextType>({
  profilePicUrl: null,
  loadingProfilePic: true,
  refreshProfilePic: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [loadingProfilePic, setLoadingProfilePic] = useState(true);

  // Fetch profile pic (reusable function)
  const fetchProfilePic = async (user: User | null) => {
    setLoadingProfilePic(true);
    try {
      if (user) {
        const profileDocRef = doc(db, "profile", user.uid);
        const profileSnap = await getDoc(profileDocRef);

        if (profileSnap.exists()) {
          setProfilePicUrl(profileSnap.data()?.photoUrl || null);
        } else {
          setProfilePicUrl(null); // No profile doc found
        }
      } else {
        setProfilePicUrl(null); // User logged out
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfilePicUrl(null); // Fallback on error
    } finally {
      setLoadingProfilePic(false);
    }
  };

  // Manual refresh function
  const refreshProfilePic = async () => {
    await fetchProfilePic(auth.currentUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, fetchProfilePic);
    return unsubscribe; // Cleanup on unmount
  }, []);

  return (
    <ProfileContext.Provider
      value={{ profilePicUrl, loadingProfilePic, refreshProfilePic }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

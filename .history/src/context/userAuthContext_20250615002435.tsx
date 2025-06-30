import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
  updateProfile,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebaseConfig";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// Type for context
type AuthContextData = {
  user: User | null;
  logIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  logOut: () => Promise<void>;
  googleSignIn: () => Promise<any>;
  setDisplayNameFromEmail: () => Promise<void>;
};

const logIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

const signUp = async (email: string, password: string, username: string) => {
  try {
    const safeUsername = username || "";

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(userCredential.user, {
      displayName: safeUsername,
    });

    await userCredential.user.getIdToken(true);

    // Save user to Firestore
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: safeUsername,
      photoURL: user.photoURL || "",
    });
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

const logOut = async () => {
  return await signOut(auth);
};

const googleSignIn = async () => {
  const googleAuthProvider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, googleAuthProvider);
  const user = result.user;

  //  Save user to Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0],
    photoURL: user.photoURL || "",
  });

  return result;
};

const setDisplayNameFromEmail = async () => {
  const user = auth.currentUser;

  if (user && !user.displayName && user.email) {
    const displayName = user.email.split("@")[0];

    try {
      await updateProfile(user, {
        displayName: displayName,
      });

      //  Update in Firestore too
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL || "",
      });

      console.log("Display name updated from email:", displayName);
    } catch (error) {
      console.error("Error updating display name from email:", error);
    }
  }
};

// Create Context
export const userAuthContext = createContext<AuthContextData>({
  user: null,
  logIn,
  signUp,
  logOut,
  googleSignIn,
  setDisplayNameFromEmail,
});

export const UserAuthContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("User state changed:", currentUser);
      setUser(currentUser);

      if (currentUser && !currentUser.displayName && currentUser.email) {
        setDisplayNameFromEmail();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <userAuthContext.Provider
      value={{
        user,
        logIn,
        signUp,
        logOut,
        googleSignIn,
        setDisplayNameFromEmail,
      }}
    >
      {children}
    </userAuthContext.Provider>
  );
};

// Hook to use context
export const useUserAuth = () => {
  return useContext(userAuthContext);
};

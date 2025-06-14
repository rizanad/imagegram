import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebaseConfig";

const ProtectedRoutes = () => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setTimeout(() => {
        toast.error("You need to be logged in to access this page.");
      }, 1000);
    }
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoutes;

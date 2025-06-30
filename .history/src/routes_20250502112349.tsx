import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/home";
import Profile from "./pages/profile";
import Login from "./pages/login/login";
import SignUp from "./pages/signUp";
import Error from "./pages/error";

import ProtectedRoutes from "./components/ProtectedRoutes/ProtectedRoutes";
import CreatePosts from "./pages/createPosts";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: "/",
        element: <Home />,
        errorElement: <Error />,
      },
      {
        path: "/create-posts",
        element: <CreatePosts />,
        errorElement: <Error />,
      },
      {
        path: "/profile",
        element: <Profile />,
        errorElement: <Error />,
      },

      {
        path: "/profile",
        element: <Profile />,
        errorElement: <Error />,
      },
    ],
  },

  {
    path: "/login",
    element: <Login />,
    errorElement: <Error />,
  },
  {
    path: "/signup",
    element: <SignUp />,
    errorElement: <Error />,
  },
  {},
]);
export default router;

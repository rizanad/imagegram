import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { UserAuthContextProvider } from "./context/userAuthContext";
import { ProfileProvider } from "./context/profileContext";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <UserAuthContextProvider>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
      <ToastContainer />
    </UserAuthContextProvider>
  );
};

export default App;

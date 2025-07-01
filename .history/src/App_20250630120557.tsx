import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { UserAuthContextProvider } from "./context/userAuthContext";
import { ProfileProvider } from "./context/profileContext";
import { RecommendationProvider } from "./context/recommendationContext";
import { ToastContainer } from "react-toastify";

const App = () => {
  return (
    <UserAuthContextProvider>
      <ProfileProvider>
        <RecommendationProvider>
          <RouterProvider router={router} />
        </RecommendationProvider>
      </ProfileProvider>
      <ToastContainer />
    </UserAuthContextProvider>
  );
};

export default App;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/userAuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState<string | null>(null);
  const { logIn } = useUserAuth();

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // setError(null);
    try {
      await logIn(email, password);
      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error("Error signing in:", err);
      toast.error("Failed to log in.");
      // setError("Failed to log in. Please try again.");
    }
  }

  return (
    <div className="text-white h-screen flex flex-col justify-center items-center">
      <h1 className="text-center text-3xl">Log In</h1>
      <form
        className="flex flex-col gap-4 items-start mt-3 bg-gray-800 p-16 rounded-md"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="email">Email:</label>
          <br />
          <input
            type="email"
            required
            className="border border-white focus:outline-none p-1 w-80"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <br />
          <input
            type="password"
            required
            className="border border-white focus:outline-none p-1 w-80"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <button
            type="submit"
            className="bg-white text-black cursor-pointer p-1 mt-2 hover:bg-gray-300 rounded-md w-80"
          >
            Log In
          </button>
        </div>

        <div className="text-sm text-gray-400 mt-2">
          Don't have an account?{" "}
          <a href="/signup" className="text-white underline">
            Sign Up
          </a>
        </div>
      </form>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default Login;

import { useState } from "react";
import { useUserAuth } from "../../context/userAuthContext";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signUp, googleSignIn } = useUserAuth();

  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      toast.error("Username is required!");
      return;
    }

    try {
      await signUp(email, password, username);
      toast.success("Account created successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to create an account.";
      toast.error(errorMessage);
      console.log("Error signing up:", err);
      setError("Failed to create an account. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      await googleSignIn();
      toast.success("Google sign-in successful!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      console.log("Error signing in with Google:", err);
      const errorMessage = err?.message || "Failed to create an account.";
      toast.error(errorMessage);
      setError("Failed to sign in with Google. Please try again.");
    }
  }

  return (
    <div className=" text-white h-screen flex flex-col justify-center items-center">
      <h1 className="text-center text-3xl">Sign Up</h1>
      <form
        className="flex flex-col gap-4  items-start mt-3 bg-gray-800 p-16 rounded-md"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="username">Username:</label>
          <br />
          <input
            type="text"
            required
            className="border border-white focus:outline-none p-1 w-80"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
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
            Sign Up
          </button>
          <br />

          <h1 className="text-center">OR</h1>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="bg-white text-black cursor-pointer p-1 mt-2 hover:bg-gray-300 rounded-md w-80"
          >
            Sign up with Google
          </button>
        </div>

        <div className="text-sm text-gray-400 mt-2 ">
          Already have an account?{" "}
          <a href="/login" className="text-white underline  ">
            Login
          </a>
        </div>
      </form>
      <ToastContainer position="top-center" />
    </div>
  );
};

export default SignUp;

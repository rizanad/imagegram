import { useState, useEffect } from "react";
import Layout from "../../components/layout";
import { auth, db } from "../../firebaseConfig";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import { useProfile } from "../../context/profileContext";

const publicKey = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY;
const defaultImage = "https://i.pravatar.cc/150?img=5";

function buildMarkovChains(captions: string[]) {
  const secondOrder: Record<string, Record<string, number>> = {};
  const thirdOrder: Record<string, Record<string, number>> = {};

  captions.forEach((caption) => {
    const words = caption.toLowerCase().split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length - 2; i++) {
      const secondKey = `${words[i]} ${words[i + 1]}`;
      const nextWord = words[i + 2];
      if (!secondOrder[secondKey]) secondOrder[secondKey] = {};
      secondOrder[secondKey][nextWord] =
        (secondOrder[secondKey][nextWord] || 0) + 1;

      if (i < words.length - 3) {
        const thirdKey = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        const nextThirdWord = words[i + 3];
        if (!thirdOrder[thirdKey]) thirdOrder[thirdKey] = {};
        thirdOrder[thirdKey][nextThirdWord] =
          (thirdOrder[thirdKey][nextThirdWord] || 0) + 1;
      }
    }
  });

  return { secondOrder, thirdOrder };
}

function generateCaption(
  secondOrder: Record<string, Record<string, number>>,
  thirdOrder: Record<string, Record<string, number>>,
  seedWords: string[],
  maxWords = 15
): string {
  let caption = [...seedWords];

  while (caption.length < maxWords) {
    let nextWord = "";
    const thirdKey = caption.slice(-3).join(" ");
    const secondKey = caption.slice(-2).join(" ");

    let candidates: Record<string, number> | undefined = thirdOrder[thirdKey];

    if (!candidates) {
      candidates = secondOrder[secondKey];
    }

    if (!candidates) break;

    const total = Object.values(candidates).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;

    for (const [word, count] of Object.entries(candidates)) {
      rand -= count;
      if (rand <= 0) {
        nextWord = word;
        break;
      }
    }

    if (!nextWord) break;
    caption.push(nextWord);
    if (nextWord.endsWith(".")) break;
  }

  return caption.join(" ");
}

const CreatePosts = () => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState("public");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [captionSuggestion, setCaptionSuggestion] = useState("");
  const [secondOrderChain, setSecondOrderChain] = useState<
    Record<string, Record<string, number>>
  >({});
  const [thirdOrderChain, setThirdOrderChain] = useState<
    Record<string, Record<string, number>>
  >({});

  const { profilePicUrl } = useProfile();
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    async function fetchCaptionsAndBuildChain() {
      const snapshot = await getDocs(collection(db, "posts"));
      const pastCaptions: string[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.content) pastCaptions.push(data.content);
      });
      const { secondOrder, thirdOrder } = buildMarkovChains(pastCaptions);
      setSecondOrderChain(secondOrder);
      setThirdOrderChain(thirdOrder);
    }
    fetchCaptionsAndBuildChain();
  }, []);

  useEffect(() => {
    if (!content.trim()) {
      setCaptionSuggestion("");
      return;
    }
    const words = content.trim().toLowerCase().split(/\s+/);
    if (words.length >= 3 && thirdOrderChain[words.slice(0, 3).join(" ")]) {
      setCaptionSuggestion(
        generateCaption(secondOrderChain, thirdOrderChain, words.slice(0, 3))
      );
    } else if (
      words.length >= 2 &&
      secondOrderChain[words.slice(0, 2).join(" ")]
    ) {
      setCaptionSuggestion(
        generateCaption(secondOrderChain, thirdOrderChain, words.slice(0, 2))
      );
    } else {
      setCaptionSuggestion("");
    }
  }, [content, secondOrderChain, thirdOrderChain]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!content.trim()) {
      toast.error("Post Content is Required");
      return;
    }
    setIsPosting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("UPLOADCARE_PUB_KEY", publicKey);
        const uploadResponse = await fetch(
          `https://upload.uploadcare.com/base/`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadData = await uploadResponse.json();
        imageUrl = `https://ucarecdn.com/${uploadData.file}/`;
      }

      // Get the user's profile picture
      let userProfilePic = defaultImage;
      if (user) {
        try {
          console.log("Fetching profile picture for user:", user.uid);
          const profileDoc = await getDoc(doc(db, "profile", user.uid));
          console.log("Profile doc exists:", profileDoc.exists());

          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            console.log("Profile data:", profileData);

            if (profileData.photoUrl) {
              userProfilePic = profileData.photoUrl;
              console.log(
                "Using profile pic from profile doc:",
                userProfilePic
              );
            } else {
              console.log("No photoUrl in profile doc, using default image");
            }
          } else {
            console.log("No profile doc found, using default image");
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }

      console.log("Creating post with userImage:", userProfilePic);
      await addDoc(collection(db, "posts"), {
        content,
        imageUrl,
        comments: [],
        likes: [],
        timestamp: serverTimestamp(),
        userId: user?.uid,
        username: user?.displayName || "Unknown User",
        userImage: userProfilePic,
        privacy,
      });

      toast.success("Post created successfully!");
      setContent("");
      setImage(null);
      setPrivacy("public");
      setImageFile(null);
    } catch (err) {
      console.error("Error uploading post: ", err);
      toast.error("Failed to create post.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen">
        <form
          className="bg-white w-[800px] h-auto rounded-2xl p-8"
          onSubmit={handleSubmit}
        >
          <h1 className="text-gray-600 font-semibold text-center text-xl">
            Create Post
          </h1>

          <textarea
            className="w-full h-48 p-2 mt-5 border border-gray-300 rounded text-black resize-none focus:outline-none focus:ring-1 focus:ring-blue-200 transition duration-200"
            placeholder="Write your post here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {captionSuggestion && (
            <div
              className="mt-2 p-2 bg-gray-100 rounded cursor-pointer text-blue-600 hover:bg-blue-50"
              onClick={() => setContent(captionSuggestion)}
              title="Click to use this caption suggestion"
            >
              Suggested caption: <em>{captionSuggestion}</em>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <div className="flex flex-col">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {image && (
                <div className="mt-2 relative">
                  <img
                    src={image}
                    alt="Uploaded preview"
                    className="max-h-60 rounded-lg object-contain border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImageFile(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="privacy" className="text-black text-sm">
                Post Privacy:
              </label>
              <select
                id="privacy"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="w-[130px] h-8 px-2 py-1 border border-gray-300 rounded text-sm text-black focus:outline-none focus:ring-1 focus:ring-blue-300"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-11">
            <button
              type="button"
              onClick={() => {
                setContent("");
                setImage(null);
                setImageFile(null);
                setPrivacy("public");
              }}
              className="bg-red-500 text-white px-2 py-2 rounded-sm hover:bg-red-600 transition duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-5 py-2 rounded-sm hover:bg-blue-600 transition duration-200 cursor-pointer"
              disabled={isPosting}
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-center" />
    </Layout>
  );
};

export default CreatePosts;

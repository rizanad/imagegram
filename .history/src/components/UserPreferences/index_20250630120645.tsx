import { useState, useEffect } from "react";
import { useRecommendations } from "../../context/recommendationContext";
import { auth } from "../../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { FaCog, FaSave, FaCheck } from "react-icons/fa";

const INTEREST_CATEGORIES = [
  { id: "food", label: "Food & Cooking", icon: "🍕" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "fashion", label: "Fashion & Style", icon: "👗" },
  { id: "beauty", label: "Beauty & Makeup", icon: "💄" },
  { id: "fitness", label: "Fitness & Health", icon: "💪" },
  { id: "art", label: "Art & Design", icon: "🎨" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "photography", label: "Photography", icon: "📸" },
  { id: "nature", label: "Nature & Outdoors", icon: "🌿" },
  { id: "pets", label: "Pets & Animals", icon: "🐕" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "lifestyle", label: "Lifestyle", icon: "🏠" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "diy", label: "DIY & Crafts", icon: "🔨" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "books", label: "Books & Reading", icon: "📚" },
  { id: "movies", label: "Movies & TV", icon: "🎬" },
  { id: "cars", label: "Cars & Vehicles", icon: "🚗" },
];

const UserPreferences = () => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { updateUserPreferences } = useRecommendations();

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userPrefsDoc = await getDoc(doc(db, "userPreferences", user.uid));
      if (userPrefsDoc.exists()) {
        const data = userPrefsDoc.data();
        setSelectedInterests(data.interests || []);
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  };

  const saveUserPreferences = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, "userPreferences", user.uid), {
        userId: user.uid,
        interests: selectedInterests,
        updatedAt: new Date(),
      });

      updateUserPreferences(selectedInterests);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Error saving user preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSave = async () => {
    await saveUserPreferences();
    setIsOpen(false);
  };

  if (!auth.currentUser) return null;

  return (
    <>
      {/* Preferences Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        title="Customize your recommendations"
      >
        <FaCog className="text-sm" />
        <span className="text-sm">Preferences</span>
      </button>

      {/* Preferences Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Customize Recommendations
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Select your interests to get better recommendations:
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {INTEREST_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleInterest(category.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedInterests.includes(category.id)
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">
                        {category.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <FaCheck className="text-sm" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="text-sm" />
                      <span>Save Preferences</span>
                    </>
                  )}
                </button>
              </div>

              {selectedInterests.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Selected:</strong> {selectedInterests.length}{" "}
                    interests
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserPreferences;

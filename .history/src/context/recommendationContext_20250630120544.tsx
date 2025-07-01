import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { auth } from "../firebaseConfig";
import {
  getPersonalizedRecommendations,
  trackUserInteraction,
  UserBehavior,
} from "../lib/recommendationEngine";

interface RecommendationContextType {
  recommendations: any[];
  loading: boolean;
  userPreferences: string[];
  refreshRecommendations: () => Promise<void>;
  updateUserPreferences: (preferences: string[]) => void;
  trackInteraction: (
    postId: string,
    interactionType: "like" | "comment" | "save" | "view"
  ) => Promise<void>;
  showRecommendations: boolean;
  toggleRecommendations: () => void;
}

const RecommendationContext = createContext<
  RecommendationContextType | undefined
>(undefined);

export const useRecommendations = () => {
  const context = useContext(RecommendationContext);
  if (context === undefined) {
    throw new Error(
      "useRecommendations must be used within a RecommendationProvider"
    );
  }
  return context;
};

interface RecommendationProviderProps {
  children: ReactNode;
}

export const RecommendationProvider: React.FC<RecommendationProviderProps> = ({
  children,
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const refreshRecommendations = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const recs = await getPersonalizedRecommendations(user.uid, 10);
      setRecommendations(recs);
    } catch (error) {
      console.error("Error refreshing recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPreferences = (preferences: string[]) => {
    setUserPreferences(preferences);
    // Refresh recommendations when preferences change
    refreshRecommendations();
  };

  const trackInteraction = async (
    postId: string,
    interactionType: "like" | "comment" | "save" | "view"
  ) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await trackUserInteraction(user.uid, postId, interactionType);
      // Refresh recommendations after interaction to improve future recommendations
      setTimeout(() => {
        refreshRecommendations();
      }, 1000);
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  const toggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshRecommendations();
      } else {
        setRecommendations([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: RecommendationContextType = {
    recommendations,
    loading,
    userPreferences,
    refreshRecommendations,
    updateUserPreferences,
    trackInteraction,
    showRecommendations,
    toggleRecommendations,
  };

  return (
    <RecommendationContext.Provider value={value}>
      {children}
    </RecommendationContext.Provider>
  );
};

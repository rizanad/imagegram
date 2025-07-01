import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  arrayUnion,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";

export interface UserBehavior {
  userId: string;
  likedPosts: string[];
  commentedPosts: string[];
  savedPosts: string[];
  followedUsers: string[];
  lastActivity: Date;
}

export interface PostFeatures {
  postId: string;
  userId: string;
  caption: string;
  tags: string[];
  category: string;
  engagement: number;
  timestamp: Date;
}

export interface RecommendationScore {
  postId: string;
  score: number;
  reason: string;
}

// Content analysis and feature extraction
export const extractPostFeatures = (caption: string): string[] => {
  const words = caption
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // Common social media tags and categories
  const categories = [
    "food",
    "travel",
    "fashion",
    "beauty",
    "fitness",
    "art",
    "music",
    "photography",
    "nature",
    "pets",
    "technology",
    "lifestyle",
    "sports",
    "cooking",
    "diy",
    "crafts",
    "gaming",
    "books",
    "movies",
    "cars",
  ];

  const tags = words.filter(
    (word) =>
      categories.includes(word) || word.startsWith("#") || word.length > 4
  );

  return [...new Set(tags)];
};

// Calculate content similarity between two posts
export const calculateContentSimilarity = (
  caption1: string,
  caption2: string
): number => {
  const features1 = extractPostFeatures(caption1);
  const features2 = extractPostFeatures(caption2);

  if (features1.length === 0 && features2.length === 0) return 0;

  const intersection = features1.filter((f) => features2.includes(f));
  const union = [...new Set([...features1, ...features2])];

  return intersection.length / union.length;
};

// Get user behavior data
export const getUserBehavior = async (
  userId: string
): Promise<UserBehavior> => {
  try {
    // Get user's liked posts
    const postsSnapshot = await getDocs(collection(db, "posts"));
    const likedPosts: string[] = [];
    const commentedPosts: string[] = [];

    postsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        data.likes &&
        Array.isArray(data.likes) &&
        data.likes.includes(userId)
      ) {
        likedPosts.push(doc.id);
      }
    });

    // Get user's followed users
    const followingSnapshot = await getDocs(
      collection(db, `users/${userId}/following`)
    );
    const followedUsers = followingSnapshot.docs.map((doc) => doc.id);

    return {
      userId,
      likedPosts,
      commentedPosts,
      savedPosts: [], // TODO: Implement saved posts
      followedUsers,
      lastActivity: new Date(),
    };
  } catch (error) {
    console.error("Error getting user behavior:", error);
    return {
      userId,
      likedPosts: [],
      commentedPosts: [],
      savedPosts: [],
      followedUsers: [],
      lastActivity: new Date(),
    };
  }
};

// Find users with similar tastes (collaborative filtering)
export const findSimilarUsers = async (
  userId: string,
  userBehavior: UserBehavior
): Promise<string[]> => {
  try {
    const allUsersSnapshot = await getDocs(collection(db, "users"));
    const similarUsers: { userId: string; similarity: number }[] = [];

    for (const userDoc of allUsersSnapshot.docs) {
      const otherUserId = userDoc.id;
      if (otherUserId === userId) continue;

      const otherUserBehavior = await getUserBehavior(otherUserId);

      // Calculate similarity based on liked posts overlap
      const likedOverlap = userBehavior.likedPosts.filter((postId) =>
        otherUserBehavior.likedPosts.includes(postId)
      ).length;

      // Calculate similarity based on followed users overlap
      const followedOverlap = userBehavior.followedUsers.filter((followedId) =>
        otherUserBehavior.followedUsers.includes(followedId)
      ).length;

      const similarity = likedOverlap * 0.7 + followedOverlap * 0.3;

      if (similarity > 0) {
        similarUsers.push({ userId: otherUserId, similarity });
      }
    }

    // Sort by similarity and return top users
    return similarUsers
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map((user) => user.userId);
  } catch (error) {
    console.error("Error finding similar users:", error);
    return [];
  }
};

// Content-based recommendations
export const getContentBasedRecommendations = async (
  userId: string,
  userBehavior: UserBehavior
): Promise<RecommendationScore[]> => {
  try {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    const recommendations: RecommendationScore[] = [];

    // Get posts the user has already interacted with
    const userLikedPosts = new Set(userBehavior.likedPosts);
    const userCommentedPosts = new Set(userBehavior.commentedPosts);

    // Analyze user's preferred content
    const userPreferredFeatures = new Map<string, number>();

    for (const postId of userBehavior.likedPosts) {
      const postDoc = postsSnapshot.docs.find((doc) => doc.id === postId);
      if (postDoc) {
        const features = extractPostFeatures(postDoc.data().content || "");
        features.forEach((feature) => {
          userPreferredFeatures.set(
            feature,
            (userPreferredFeatures.get(feature) || 0) + 1
          );
        });
      }
    }

    // Score all posts based on content similarity
    for (const postDoc of postsSnapshot.docs) {
      const postId = postDoc.id;
      const postData = postDoc.data();

      // Skip posts user has already interacted with
      if (userLikedPosts.has(postId) || userCommentedPosts.has(postId)) {
        continue;
      }

      // Skip user's own posts
      if (postData.userId === userId) {
        continue;
      }

      const postFeatures = extractPostFeatures(postData.content || "");
      let contentScore = 0;

      // Calculate content similarity score
      postFeatures.forEach((feature) => {
        const userPreference = userPreferredFeatures.get(feature) || 0;
        contentScore += userPreference;
      });

      // Normalize score
      if (postFeatures.length > 0) {
        contentScore = contentScore / postFeatures.length;
      }

      if (contentScore > 0) {
        recommendations.push({
          postId,
          score: contentScore,
          reason: "Based on your interests",
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error getting content-based recommendations:", error);
    return [];
  }
};

// Collaborative filtering recommendations
export const getCollaborativeRecommendations = async (
  userId: string,
  similarUsers: string[]
): Promise<RecommendationScore[]> => {
  try {
    const recommendations: RecommendationScore[] = [];
    const userLikedPosts = new Set();

    // Get current user's liked posts
    const userBehavior = await getUserBehavior(userId);
    userBehavior.likedPosts.forEach((postId) => userLikedPosts.add(postId));

    // Get posts liked by similar users
    const similarUserLikes = new Map<string, number>();

    for (const similarUserId of similarUsers) {
      const similarUserBehavior = await getUserBehavior(similarUserId);

      similarUserBehavior.likedPosts.forEach((postId) => {
        if (!userLikedPosts.has(postId)) {
          similarUserLikes.set(postId, (similarUserLikes.get(postId) || 0) + 1);
        }
      });
    }

    // Convert to recommendations
    similarUserLikes.forEach((count, postId) => {
      recommendations.push({
        postId,
        score: count,
        reason: `Liked by ${count} users similar to you`,
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error getting collaborative recommendations:", error);
    return [];
  }
};

// Trending posts recommendations
export const getTrendingRecommendations = async (): Promise<
  RecommendationScore[]
> => {
  try {
    const postsSnapshot = await getDocs(
      query(collection(db, "posts"), orderBy("likes", "desc"), limit(50))
    );

    const recommendations: RecommendationScore[] = [];
    const now = new Date();

    postsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const likes = Array.isArray(data.likes) ? data.likes.length : 0;
      const comments = Array.isArray(data.comments) ? data.comments.length : 0;

      // Calculate trending score based on engagement and recency
      const engagement = likes + comments * 2;
      const recency =
        now.getTime() - (data.timestamp?.toDate?.() || now).getTime();
      const recencyScore = Math.max(0, 1 - recency / (7 * 24 * 60 * 60 * 1000)); // 7 days

      const trendingScore = engagement * recencyScore;

      recommendations.push({
        postId: doc.id,
        score: trendingScore,
        reason: "Trending now",
      });
    });

    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("Error getting trending recommendations:", error);
    return [];
  }
};

// Main recommendation function
export const getPersonalizedRecommendations = async (
  userId: string,
  limit: number = 20
): Promise<RecommendationScore[]> => {
  try {
    const userBehavior = await getUserBehavior(userId);
    const similarUsers = await findSimilarUsers(userId, userBehavior);

    // Get different types of recommendations
    const contentBased = await getContentBasedRecommendations(
      userId,
      userBehavior
    );
    const collaborative = await getCollaborativeRecommendations(
      userId,
      similarUsers
    );
    const trending = await getTrendingRecommendations();

    // Combine and weight recommendations
    const allRecommendations = new Map<string, RecommendationScore>();

    // Content-based recommendations (weight: 0.4)
    contentBased.forEach((rec) => {
      allRecommendations.set(rec.postId, {
        ...rec,
        score: rec.score * 0.4,
      });
    });

    // Collaborative recommendations (weight: 0.4)
    collaborative.forEach((rec) => {
      const existing = allRecommendations.get(rec.postId);
      if (existing) {
        existing.score += rec.score * 0.4;
        existing.reason = `${existing.reason} and ${rec.reason}`;
      } else {
        allRecommendations.set(rec.postId, {
          ...rec,
          score: rec.score * 0.4,
        });
      }
    });

    // Trending recommendations (weight: 0.2)
    trending.forEach((rec) => {
      const existing = allRecommendations.get(rec.postId);
      if (existing) {
        existing.score += rec.score * 0.2;
        existing.reason = `${existing.reason} and ${rec.reason}`;
      } else {
        allRecommendations.set(rec.postId, {
          ...rec,
          score: rec.score * 0.2,
        });
      }
    });

    // Convert to array and sort
    const finalRecommendations = Array.from(allRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return finalRecommendations;
  } catch (error) {
    console.error("Error getting personalized recommendations:", error);
    return [];
  }
};

// Track user interaction for better recommendations
export const trackUserInteraction = async (
  userId: string,
  postId: string,
  interactionType: "like" | "comment" | "save" | "view"
) => {
  try {
    const userBehaviorRef = doc(db, "userBehavior", userId);
    const userBehaviorDoc = await getDoc(userBehaviorRef);

    if (userBehaviorDoc.exists()) {
      const data = userBehaviorDoc.data();
      const updates: any = {
        lastActivity: new Date(),
      };

      switch (interactionType) {
        case "like":
          updates.likedPosts = arrayUnion(postId);
          break;
        case "comment":
          updates.commentedPosts = arrayUnion(postId);
          break;
        case "save":
          updates.savedPosts = arrayUnion(postId);
          break;
        case "view":
          updates.viewedPosts = arrayUnion(postId);
          break;
      }

      await updateDoc(userBehaviorRef, updates);
    } else {
      // Create new user behavior document
      const newBehavior: UserBehavior = {
        userId,
        likedPosts: interactionType === "like" ? [postId] : [],
        commentedPosts: interactionType === "comment" ? [postId] : [],
        savedPosts: interactionType === "save" ? [postId] : [],
        followedUsers: [],
        lastActivity: new Date(),
      };

      await updateDoc(userBehaviorRef, newBehavior);
    }
  } catch (error) {
    console.error("Error tracking user interaction:", error);
  }
};

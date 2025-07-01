# ImageGram Recommendation System

## Overview

The ImageGram recommendation system provides personalized post recommendations similar to Instagram's algorithm. It combines multiple recommendation techniques to deliver relevant content to users based on their behavior and preferences.

## Features

### 🎯 **Personalized Recommendations**
- Content-based filtering based on post captions and user interests
- Collaborative filtering to find users with similar tastes
- Trending posts based on engagement and recency
- User behavior tracking (likes, comments, follows)

### 🎨 **Smart Content Analysis**
- Automatic feature extraction from post captions
- Category detection (food, travel, fashion, etc.)
- Hashtag and keyword analysis
- Content similarity scoring

### 👥 **User Behavior Tracking**
- Like interactions
- Comment interactions
- Follow relationships
- View tracking (future enhancement)
- Save/bookmark tracking (future enhancement)

### ⚙️ **Customizable Preferences**
- Interest category selection
- Preference management interface
- Real-time recommendation updates

## How It Works

### 1. **Content-Based Filtering**
The system analyzes post captions to extract features and categories:
- Extracts keywords and hashtags
- Identifies content categories (food, travel, fashion, etc.)
- Calculates similarity between posts
- Scores posts based on user's historical preferences

### 2. **Collaborative Filtering**
Finds users with similar tastes:
- Analyzes overlap in liked posts
- Considers follow relationships
- Identifies users with similar behavior patterns
- Recommends posts liked by similar users

### 3. **Trending Algorithm**
Identifies popular content:
- Combines like and comment counts
- Applies time decay (newer posts get higher scores)
- Calculates engagement rate
- Balances popularity with recency

### 4. **Hybrid Scoring**
Combines all recommendation types:
- Content-based: 40% weight
- Collaborative: 40% weight
- Trending: 20% weight
- Final score determines recommendation order

## Database Structure

### Collections

#### `userBehavior`
```javascript
{
  userId: string,
  likedPosts: string[],
  commentedPosts: string[],
  savedPosts: string[],
  followedUsers: string[],
  lastActivity: Date
}
```

#### `userPreferences`
```javascript
{
  userId: string,
  interests: string[],
  updatedAt: Date
}
```

#### `posts` (existing)
Enhanced with recommendation tracking:
```javascript
{
  // ... existing fields
  likes: string[], // Array of user IDs
  comments: Comment[],
  timestamp: Timestamp
}
```

## API Functions

### Core Recommendation Functions

#### `getPersonalizedRecommendations(userId, limit)`
Main function that combines all recommendation types and returns scored posts.

#### `getContentBasedRecommendations(userId, userBehavior)`
Analyzes user's liked posts to find similar content.

#### `getCollaborativeRecommendations(userId, similarUsers)`
Finds posts liked by users with similar tastes.

#### `getTrendingRecommendations()`
Identifies currently trending posts based on engagement.

#### `trackUserInteraction(userId, postId, interactionType)`
Records user interactions for future recommendations.

### Utility Functions

#### `extractPostFeatures(caption)`
Extracts keywords and categories from post captions.

#### `calculateContentSimilarity(caption1, caption2)`
Calculates similarity between two post captions.

#### `findSimilarUsers(userId, userBehavior)`
Finds users with similar interests and behavior.

## Usage

### Basic Implementation

```javascript
import { getPersonalizedRecommendations } from './lib/recommendationEngine';

// Get recommendations for a user
const recommendations = await getPersonalizedRecommendations(userId, 10);
```

### Tracking User Interactions

```javascript
import { trackUserInteraction } from './lib/recommendationEngine';

// Track when user likes a post
await trackUserInteraction(userId, postId, 'like');

// Track when user comments on a post
await trackUserInteraction(userId, postId, 'comment');
```

### Using the Recommendation Context

```javascript
import { useRecommendations } from './context/recommendationContext';

const MyComponent = () => {
  const { 
    recommendations, 
    loading, 
    refreshRecommendations,
    trackInteraction 
  } = useRecommendations();

  // Use recommendations data
  return (
    <div>
      {recommendations.map(rec => (
        <Post key={rec.postId} {...rec} />
      ))}
    </div>
  );
};
```

## Components

### `Recommendations`
Main component that displays recommended posts with:
- Loading states
- Recommendation badges
- Reason tooltips
- Show/hide functionality

### `UserPreferences`
Allows users to customize their interests:
- Category selection interface
- Preference saving
- Real-time updates

## Configuration

### Interest Categories
The system supports 18 predefined categories:
- Food & Cooking 🍕
- Travel ✈️
- Fashion & Style 👗
- Beauty & Makeup 💄
- Fitness & Health 💪
- Art & Design 🎨
- Music 🎵
- Photography 📸
- Nature & Outdoors 🌿
- Pets & Animals 🐕
- Technology 💻
- Lifestyle 🏠
- Sports ⚽
- DIY & Crafts 🔨
- Gaming 🎮
- Books & Reading 📚
- Movies & TV 🎬
- Cars & Vehicles 🚗

### Scoring Weights
- Content-based filtering: 40%
- Collaborative filtering: 40%
- Trending algorithm: 20%

## Performance Considerations

### Optimization Strategies
- Caching recommendation results
- Batch processing for large datasets
- Incremental updates
- Background processing for heavy computations

### Scalability
- Indexed queries for user behavior
- Efficient similarity calculations
- Pagination for large recommendation sets
- Rate limiting for API calls

## Future Enhancements

### Planned Features
- **Image Analysis**: AI-powered image content analysis
- **Advanced ML**: Machine learning models for better predictions
- **Real-time Updates**: Live recommendation updates
- **A/B Testing**: Algorithm performance testing
- **Analytics Dashboard**: Recommendation performance metrics

### Potential Improvements
- **Deep Learning**: Neural networks for content understanding
- **Multi-modal Analysis**: Combining text, image, and user behavior
- **Contextual Recommendations**: Time and location-based suggestions
- **Social Graph Analysis**: Advanced relationship mapping

## Troubleshooting

### Common Issues

#### No Recommendations Appearing
- Check if user has liked any posts
- Verify user preferences are set
- Ensure sufficient content exists in the database

#### Poor Recommendation Quality
- Increase user interaction data
- Adjust scoring weights
- Add more content categories
- Improve content analysis algorithms

#### Performance Issues
- Implement caching
- Optimize database queries
- Use pagination
- Consider background processing

## Contributing

When contributing to the recommendation system:

1. **Test thoroughly** with different user scenarios
2. **Maintain performance** - avoid expensive operations
3. **Update documentation** for new features
4. **Follow existing patterns** for consistency
5. **Add proper error handling** for robustness

## License

This recommendation system is part of the ImageGram project and follows the same licensing terms. 
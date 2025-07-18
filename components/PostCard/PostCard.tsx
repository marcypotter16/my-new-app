// Description: A reusable React Native component to display a post card with user information, text, and optional image and actions.

import { darkThemeColors, lightThemeColors } from '@/constants';
import { useTheme } from '@/hooks/ThemeContext';
import Post from '@/models/post';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import PostActionIcon from './PostActionIcon';

type Props = {
  post: Post;
};


const PostCard = ({ post }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const colorScheme = theme === 'dark' ? darkThemeColors : lightThemeColors;
  const [showLikeTooltip, setLikeTooltip] = React.useState(false);
  return (
    <View style={getStyles(theme).card}>
      <View style={getStyles(theme).header}>
        <Image source={{ uri: post.userProfilePicture }} style={getStyles(theme).avatar} />
        <Text style={getStyles(theme).name}>{post.userName}</Text>
      </View>
      <Text style={getStyles(theme).text}>{post.text}</Text>
      {post.image ? <Image source={{ uri: post.image }} style={getStyles(theme).postImage} /> : null}
      {post.showActions && (
        <View style={getStyles(theme).actions}>
          <PostActionIcon name="musical-notes-outline" 
            onPress={() => console.log("Liked!")}
            color={getStyles(theme).text.color} />
          <PostActionIcon name="chatbubble-outline" 
            onPress={() => console.log("Commented!") /* This will have to be implemented (AYRTON) */ }
            color={getStyles(theme).text.color} /> {/* The icon outline color will match the theme! */ }
          <PostActionIcon name="paper-plane-outline" 
            onPress={() => console.log("Message the author!")}
            color={getStyles(theme).text.color} />
          <PostActionIcon name="share-social-outline" 
            onPress={() => console.log("Shared!")} 
            color={getStyles(theme).text.color} />
          <PostActionIcon name="bookmark-outline" 
            onPress={() => console.log("Saved!")}
            color={getStyles(theme).text.color} />
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: 'light' | 'dark') => 
  StyleSheet.create({
  card: {
    backgroundColor: theme === 'dark' ? darkThemeColors.surface : lightThemeColors.surface,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text,
  },
  text: {
    fontSize: 15,
    marginVertical: 8,
    color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'space-around',
  },
  action: {
    fontSize: 14,
    color: theme === 'dark' ? darkThemeColors.primary : lightThemeColors.primary,
  },
  tooltip: {
    position: 'absolute',
    bottom: 25,
    left: 115,
    backgroundColor: 'black',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
  },
});

export default PostCard;

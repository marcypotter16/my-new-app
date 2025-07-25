import ProfileScreenPostCard, { ProfileScreenPost } from "@/components/PostCard/ProfileScreenPostCard";
import { darkThemeColors, lightThemeColors } from "@/constants";
import { useAuth } from "@/hooks/AuthContext";
import { useTheme } from "@/hooks/ThemeContext";
import { useRedirectIfUnauthenticated } from "@/hooks/useRedirectIfNotAuthenticated";
import { supabase } from "@/supabase";
import { showError } from "@/utils/ErrorUtils";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	FlatList,
	Image,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Toast from "react-native-toast-message";


async function uploadProfilePic(file: Blob, userId: string): Promise<string> {
	const filePath = `user_${userId}.jpg`;

	const {
		data: { user },
		error: getUserError,
	} = await supabase.auth.getUser();
	console.log(user, getUserError);

	const { data: uploadData, error: uploadError } = await supabase.storage
		.from("avatars")
		.upload(filePath, file, {
			cacheControl: "3600",
			upsert: true,
		});

	if (uploadError) {
		showError(uploadError, "Error in uploading profile pic")
		throw uploadError;
	}

	const response = supabase.storage.from("avatars").getPublicUrl(filePath);

	return response.data.publicUrl;
}

export default function ProfileScreen() {
	const { isLoading } = useRedirectIfUnauthenticated();
	const { user } = useAuth();
	const { theme } = useTheme()
	const [ showZoomedAvatar, setShowZoomedAvatar ] = useState(false);
	const [ posts, setPosts ] = useState<ProfileScreenPost[] | null>(null)
	const [ refreshPostsTrigger, setRefreshPostsTrigger ] = useState<number>(0)

	useEffect(() => {
		const fetchPosts = async () => {
			const { data: postData, error } = await supabase
				.from("posts")
				.select(`
					id,
					content,
					created_at,
					post_media (
						id,
						media_path,
						type
					)
				`)
				.eq("user_id", user!.id);

			if (error) {
				console.error("Error fetching posts:", error);
				return;
			}

			// Generate signed URLs for each media file
			const updatedPosts = await Promise.all(
				postData.map(async (post) => {
					const updatedMedia = await Promise.all(
						post.post_media.map(async (media) => {
							console.log("media url", media.media_path)
							const { data: signed, error: urlError } = await supabase
								.storage
								.from("post-media-bucket")
								.createSignedUrl(media.media_path, 60); // expires in 60s

							if (urlError) {
								showError(urlError, "Error in creating signed url")
								console.error(urlError)
							}
							return {
								...media,
								url: signed?.signedUrl ?? "", // fallback to empty if failed
							};
						})
					);

					return {
						...post,
						post_media: updatedMedia,
					};
				})
			);

			setPosts(updatedPosts);
		};

		fetchPosts();
	}, [ refreshPostsTrigger ]);


	if (isLoading || !user) return <Text>Loading...</Text>;

	const handlePickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: [ "images" ],
			allowsEditing: true,
			base64: false,
			quality: 0.8,
		});

		if (!result.canceled) {
			const uri = result.assets[ 0 ].uri;
			const response = await fetch(uri);
			const blob = await response.blob();
			const url = await uploadProfilePic(blob, user!.id!.toString());

			// Update DB only if avatar_url is currently null or empty
			if (!user.avatar_url) {
				console.log(url, user.id)
				const { error: updateError } = await supabase
					.from("users")
					.update({ avatar_url: url })
					.eq("id", user.id);

				if (updateError) {
					console.error("Failed to update avatar_url:", updateError.message);
				}
			}

			// Reload page
			router.replace("/(tabs)/profile");
		} else {
			Toast.show({
				type: "info",
				text1: "Image picking canceled",
			});
			console.log("Image picking canceled");
		}
	};

	return (
		// This is all provvisionary data, replace with real user and posts data
		<ScrollView style={styles(theme).container}>
			{/* Profile Header */}
			<View style={styles(theme).header}>
				<TouchableOpacity
					onPress={() => setShowZoomedAvatar(true)}
					style={styles(theme).avatarContainer}
				>
					<Image
						source={
							user?.avatar_url
								? { uri: user.avatar_url }
								: require("../../../assets/images/default-profile.jpg")
						}
						style={styles(theme).avatar}
					/>
					<TouchableOpacity style={styles(theme).plusButton} onPress={handlePickImage}>
						<Ionicons name="add-circle" size={24} color="#007AFF" />
					</TouchableOpacity>
				</TouchableOpacity>
				<Text style={styles(theme).name}>{user?.name}</Text>
				<Text style={styles(theme).username}>@{user?.user_name}</Text>
				<Text style={styles(theme).instrument}>{user?.instrument}</Text>
				{/* {user.bio && <Text style={styles.bio}>{user?.bio}</Text>} */}
				{/* {user.rating && <Text style={styles.rating}>⭐ {user.rating.toFixed(1)}</Text>} */}
				{/* Zoom Modal */}
				<Modal
					visible={showZoomedAvatar}
					transparent={true}
					animationType="fade"
				>
					<TouchableOpacity
						style={styles(theme).modalOverlay}
						onPress={() => setShowZoomedAvatar(false)}
					>
						<Image
							source={
								user?.avatar_url
									? { uri: user.avatar_url }
									: require("../../../assets/images/default-profile.jpg")
							}
							style={styles(theme).zoomedImage}
							resizeMode="contain"
						/>
					</TouchableOpacity>
				</Modal>
			</View>

			{/* Media Posts */}
			<Text style={styles(theme).sectionTitle}>Posts</Text>
			<FlatList
				data={posts}
				renderItem={({ item }) => <ProfileScreenPostCard post={item}
					/* onPostDeleted triggers a change in the trigger, which triggers useEffect and refreshes the posts */
					onPostDeleted={() => setRefreshPostsTrigger((prev) => prev + 1)} />}
				keyExtractor={(item) => item.id}
				numColumns={3}
				scrollEnabled={true}
				style={{
					paddingHorizontal: 20

				}}
			/>

			{/* Reviews Preview */}
			<View style={styles(theme).reviewSection}>
				<Text style={styles(theme).sectionTitle}>Reviews</Text>
				{/* {user.reviews?.slice(0, 2).map((review: Review) => (
					<View key={review.id} style={styles(theme).reviewCard}>
						<Text style={styles(theme).reviewAuthor}>{review.authorName}</Text>
						<Text style={styles(theme).reviewText}>{review.content}</Text>
						<Text style={styles(theme).reviewRating}>⭐ {review.rating}</Text>
					</View>
				))} */}
				<Link href="/(tabs)/profile/reviews" asChild>
					<TouchableOpacity>
						<Text style={styles(theme).link}>View all reviews</Text>
					</TouchableOpacity>
				</Link>
			</View>
		</ScrollView>
	);
}

const styles = (theme: 'light' | 'dark') => StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: theme === 'dark' ? darkThemeColors.background : lightThemeColors.background
	},
	header: {
		alignItems: "center",
		marginBottom: 20,
		color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text
	},
	avatarContainer: {
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
	},
	plusButton: {
		position: "absolute",
		bottom: 5,
		right: 5,
		backgroundColor: "#fff",
		borderRadius: 12,
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
		elevation: 3,
	},
	name: {
		fontSize: 22,
		fontWeight: "bold",
		color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text,
	},
	username: {
		color: theme === 'dark' ? darkThemeColors.text_dim : lightThemeColors.text_dim,
	},
	instrument: {
		fontSize: 16,
		marginTop: 4,
		color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text
	},
	bio: {
		textAlign: "center",
		marginTop: 8,
		marginBottom: 4,
	},
	rating: {
		fontSize: 16,
		color: "#f5a623",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 16,
		marginBottom: 8,
		color: theme === 'dark' ? darkThemeColors.text : lightThemeColors.text
	},
	reviewSection: {
		marginTop: 12,
	},
	reviewCard: {
		backgroundColor: "#f1f1f1",
		padding: 10,
		borderRadius: 8,
		marginBottom: 8,
	},
	reviewAuthor: {
		fontWeight: "bold",
	},
	reviewText: {
		marginTop: 4,
		marginBottom: 4,
	},
	reviewRating: {
		color: "#f5a623",
	},
	link: {
		color: "#007AFF",
		textAlign: "right",
		marginTop: 8,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "#000000aa",
		alignItems: "center",
		justifyContent: "center",
	},
	zoomedImage: {
		width: "90%",
		height: "70%",
	},
});

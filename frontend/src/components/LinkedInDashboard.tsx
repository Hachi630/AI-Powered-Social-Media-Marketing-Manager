import {
  Layout,
  Typography,
  Grid,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Spin,
  Empty,
  Modal,
  Input,
  Upload,
  message,
  Progress,
  Select,
  Avatar,
  Space,
  List,
  DatePicker,
  Form,
  Segmented,
  Tooltip,
} from "antd";
import {
  LinkedinOutlined,
  UserOutlined,
  TeamOutlined,
  EyeOutlined,
  SyncOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  PictureOutlined,
  DeleteOutlined,
  FileImageOutlined,
  BankOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  VideoCameraOutlined,
  LikeOutlined,
  HeartOutlined,
  TrophyOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  SmileOutlined,
  CommentOutlined,
  TwitterOutlined,
  FacebookOutlined,
} from "@ant-design/icons";
import { useState, useCallback, useEffect } from "react";
import dayjs from "dayjs";
import Header from "./Header";
import styles from "./Dashboard.module.css";
import {
  getLinkedInMetrics,
  getLinkedInAuthUrl,
  disconnectLinkedIn,
  createLinkedInPost,
  initializeImageUpload,
  uploadImageToLinkedIn,
  createLinkedInPostWithImage,
  fileToBase64,
  getAdministeredOrganizations,
  Organization,
  // Events
  LinkedInEvent,
  getMyLinkedInEvents,
  getOrganizationLinkedInEvents,
  createLinkedInEvent,
  deleteLinkedInEventService,
  // New features
  createLinkedInPostWithLink,
  initializeVideoUpload,
  uploadVideoToLinkedIn as uploadVideo,
  createLinkedInPostWithVideo,
  videoFileToBase64,
  ReactionType,
} from "../services/linkedinService";
import {
  getTwitterStatus,
  getTwitterAuthUrl,
  disconnectTwitter,
} from "../services/twitterService";
import {
  getFacebookStatus,
  getInstagramStatus,
  getFacebookAuthUrl,
  getInstagramAuthUrl,
  disconnectFacebook,
  disconnectInstagram,
} from "../services/socialService";
import { User } from "../services/authService";

interface LinkedInDashboardProps {
  isLoggedIn?: boolean;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  user?: User | null;
  jwt?: string;
  userId?: string;
}

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function LinkedInDashboard({
  isLoggedIn = false,
  onLoginSuccess,
  onLogout,
  user,
  jwt,
  userId,
}: LinkedInDashboardProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Twitter states
  const [twitterStatus, setTwitterStatus] = useState<any>(null);
  const [loadingTwitter, setLoadingTwitter] = useState(true);
  const [disconnectingTwitter, setDisconnectingTwitter] = useState(false);

  // Facebook/Instagram states
  const [facebookStatus, setFacebookStatus] = useState<any>(null);
  const [instagramStatus, setInstagramStatus] = useState<any>(null);
  const [loadingFacebook, setLoadingFacebook] = useState(true);
  const [loadingInstagram, setLoadingInstagram] = useState(true);
  const [facebookAuthUrl, setFacebookAuthUrl] = useState<string | null>(null);
  const [instagramAuthUrl, setInstagramAuthUrl] = useState<string | null>(null);
  const [disconnectingFacebook, setDisconnectingFacebook] = useState(false);
  const [disconnectingInstagram, setDisconnectingInstagram] = useState(false);

  // Post creation states
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Enhanced post type states
  const [postType, setPostType] = useState<"text" | "image" | "video" | "link">(
    "text"
  );
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");

  // Organization/Company Page states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedPostTarget, setSelectedPostTarget] =
    useState<string>("personal"); // "personal" or org ID

  // Events states
  const [events, setEvents] = useState<LinkedInEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventOrg, setSelectedEventOrg] = useState<string>("all"); // "all" or org ID
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm] = Form.useForm();

  // Load LinkedIn metrics
  useEffect(() => {
    const loadMetrics = async () => {
      if (!jwt) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getLinkedInMetrics(jwt);
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load LinkedIn metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [jwt]);

  // Load Twitter status
  useEffect(() => {
    const loadTwitterStatus = async () => {
      if (!jwt) {
        setLoadingTwitter(false);
        return;
      }
      setLoadingTwitter(true);
      try {
        const data = await getTwitterStatus(jwt);
        setTwitterStatus(data);
      } catch (error) {
        console.error("Failed to load Twitter status:", error);
      } finally {
        setLoadingTwitter(false);
      }
    };
    loadTwitterStatus();
  }, [jwt]);

  // Handle Twitter OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const twitterParam = params.get("twitter");

    if (twitterParam === "connected") {
      const note = params.get("note");
      if (note === "rate_limited") {
        message.warning("Twitter account connected successfully! However, user info cannot be fetched due to rate limit. It will be available after the rate limit resets.", 8);
      } else {
        message.success("Twitter account connected successfully!");
      }
      // Reload Twitter status
      if (jwt) {
        getTwitterStatus(jwt).then(setTwitterStatus);
      }
      // Clean up URL
      const newParams = new URLSearchParams(params);
      newParams.delete("twitter");
      newParams.delete("note");
      const newUrl = newParams.toString()
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (twitterParam === "error") {
      const reason = params.get("reason");
      const resetTimestamp = params.get("reset");
      let errorMessage = "Twitter connection failed";

      // Provide user-friendly error messages
      switch (reason) {
        case "rate_limited":
          const resetTime = resetTimestamp ? new Date(parseInt(resetTimestamp) * 1000) : null;
          const resetTimeStr = resetTime ? resetTime.toLocaleString() : "24 hours";
          errorMessage = `Twitter API rate limit reached (25 requests per 24 hours). This is a Twitter API limitation, not a code issue. Please wait until ${resetTimeStr} and try again. Your tokens are saved and will work once the rate limit resets.`;
          message.warning(errorMessage, 10); // Show for 10 seconds
          break;
        case "callback_url_not_approved":
          errorMessage =
            "Twitter connection failed: Callback URL not approved. Please configure the callback URL in your Twitter Developer Portal app settings.";
          message.error(errorMessage);
          break;
        case "callback_url_error":
          errorMessage =
            "Twitter connection failed: Callback URL configuration error. Please check your TWITTER_CALLBACK_URL setting.";
          message.error(errorMessage);
          break;
        case "api_credentials_error":
          errorMessage =
            "Twitter connection failed: API credentials error. Please check your TWITTER_API_KEY and TWITTER_API_SECRET in backend/.env";
          message.error(errorMessage);
          break;
        case "oauth_init_failed":
          errorMessage =
            "Twitter connection failed: OAuth initialization failed. Please check your Twitter API credentials and callback URL configuration.";
          message.error(errorMessage);
          break;
        default:
          errorMessage = `Twitter connection failed: ${reason || "Unknown error"}`;
          message.error(errorMessage);
      }

      message.error(errorMessage);
      // Clean up URL
      window.history.replaceState({}, "", "/socialdashboard");
    }
  }, [jwt]);

  // Load Facebook/Instagram status
  useEffect(() => {
    const loadSocialStatus = async () => {
      if (!jwt) {
        setLoadingFacebook(false);
        setLoadingInstagram(false);
        return;
      }
      
      // Load Facebook status
      setLoadingFacebook(true);
      try {
        const fbData = await getFacebookStatus(jwt);
        setFacebookStatus(fbData);
      } catch (error) {
        console.error("Failed to load Facebook status:", error);
      } finally {
        setLoadingFacebook(false);
      }

      // Load Instagram status
      setLoadingInstagram(true);
      try {
        const igData = await getInstagramStatus(jwt);
        setInstagramStatus(igData);
      } catch (error) {
        console.error("Failed to load Instagram status:", error);
      } finally {
        setLoadingInstagram(false);
      }

      // Get Facebook/Instagram auth URL
      try {
        const authData = await getInstagramAuthUrl(jwt);
        console.log("Facebook/Instagram auth URL response:", authData);
        if (authData.success && authData.authUrl) {
          setFacebookAuthUrl(authData.authUrl);
        } else {
          console.error("Failed to get auth URL:", authData.error);
          message.error(authData.error || "Failed to get Facebook/Instagram auth URL");
        }
      } catch (error) {
        console.error("Failed to get Facebook/Instagram auth URL:", error);
        message.error("Failed to get Facebook/Instagram auth URL");
      }
    };
    loadSocialStatus();
  }, [jwt]);

  // Handle Facebook/Instagram OAuth callback (like Twitter)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const facebookParam = params.get("facebook");
    const instagramParam = params.get("instagram");
    
    if (facebookParam === "connected" || instagramParam === "connected") {
      message.success(
        facebookParam === "connected" && instagramParam === "connected"
          ? "Successfully connected Facebook and Instagram!"
          : facebookParam === "connected"
          ? "Successfully connected Facebook!"
          : "Successfully connected Instagram!"
      );
      
      // Reload Facebook/Instagram status
      if (jwt) {
        if (facebookParam === "connected") {
          getFacebookStatus(jwt).then(setFacebookStatus);
          // IMPORTANT: Also refresh Instagram status after Facebook connection
          // Facebook-only connection should have removed Instagram connection
          // This ensures the UI reflects the correct state
          getInstagramStatus(jwt).then(setInstagramStatus).catch((err) => {
            console.error("Failed to refresh Instagram status after Facebook connection:", err);
            // If refresh fails, set Instagram to disconnected to ensure UI is correct
            setInstagramStatus({ connected: false });
          });
        }
        if (instagramParam === "connected") {
          getInstagramStatus(jwt).then(setInstagramStatus);
          // Also refresh Facebook status after Instagram connection
          // Instagram connection also connects Facebook Page
          getFacebookStatus(jwt).then(setFacebookStatus).catch((err) => {
            console.error("Failed to refresh Facebook status after Instagram connection:", err);
          });
        }
      }
      
      // Clean up URL
      const newParams = new URLSearchParams(params);
      newParams.delete("facebook");
      newParams.delete("instagram");
      const newUrl = newParams.toString()
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else if (facebookParam === "error" || instagramParam === "error") {
      const reason = params.get("reason");
      
      // Skip showing error for invalid_state (common during OAuth flow, not a real error)
      if (reason === "invalid_state") {
        // Silently clean up URL without showing error message
        const newParams = new URLSearchParams(params);
        newParams.delete("facebook");
        newParams.delete("instagram");
        newParams.delete("reason");
        const newUrl = newParams.toString()
          ? `${window.location.pathname}?${newParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        return;
      }
      
      let errorMessage = "Facebook/Instagram connection failed";
      
      // Provide user-friendly error messages
      switch (reason) {
        case "user_denied":
          errorMessage = "Connection was cancelled. Please try again.";
          break;
        case "missing_params":
          errorMessage = "Missing required parameters. Please try again.";
          break;
        case "user_not_found":
          errorMessage = "User not found. Please log in again.";
          break;
        default:
          errorMessage = reason || "Connection failed. Please try again.";
      }
      
      message.error(errorMessage);
      
      // Clean up URL
      const newParams = new URLSearchParams(params);
      newParams.delete("facebook");
      newParams.delete("instagram");
      newParams.delete("reason");
      const newUrl = newParams.toString()
        ? `${window.location.pathname}?${newParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    if (facebookParam === "connected" || instagramParam === "connected") {
      message.success("Facebook/Instagram account connected successfully!");
      // Reload status
      if (jwt) {
        getFacebookStatus(jwt).then(setFacebookStatus);
        getInstagramStatus(jwt).then(setInstagramStatus);
      }
      // Clean up URL
      window.history.replaceState({}, "", "/socialdashboard");
    } else if (facebookParam === "error" || instagramParam === "error") {
      const reason = params.get("reason");
      message.error(`Facebook/Instagram connection failed: ${reason || "Unknown error"}`);
      // Clean up URL
      window.history.replaceState({}, "", "/socialdashboard");
    }
  }, [jwt]);

  // Load administered organizations when connected
  useEffect(() => {
    const loadOrganizations = async () => {
      if (!jwt || !metrics?.connected) return;

      setLoadingOrgs(true);
      try {
        const result = await getAdministeredOrganizations(jwt);
        if (result.success) {
          setOrganizations(result.organizations);
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setLoadingOrgs(false);
      }
    };
    loadOrganizations();
  }, [jwt, metrics?.connected]);

  // Load events when connected
  useEffect(() => {
    const loadEvents = async () => {
      if (!jwt || !metrics?.connected) return;

      setLoadingEvents(true);
      try {
        const result = await getMyLinkedInEvents(jwt);
        if (result.success) {
          setEvents(result.events);
        }
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, [jwt, metrics?.connected]);

  const handleRefreshMetrics = async () => {
    if (!jwt) return;
    setLoading(true);
    try {
      const data = await getLinkedInMetrics(jwt);
      setMetrics(data);
    } catch (error) {
      console.error("Failed to refresh LinkedIn metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    Modal.confirm({
      title: "Disconnect LinkedIn",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to disconnect your LinkedIn account? You will need to reconnect to see your LinkedIn analytics again.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!jwt) return;
        setDisconnecting(true);
        try {
          const result = await disconnectLinkedIn(jwt);
          if (result.success) {
            // Reset metrics to show disconnected state
            setMetrics({ connected: false });
          } else {
            console.error("Failed to disconnect LinkedIn:", result.error);
          }
        } catch (error) {
          console.error("Failed to disconnect LinkedIn:", error);
        } finally {
          setDisconnecting(false);
        }
      },
    });
  };

  const handleDisconnectTwitter = () => {
    Modal.confirm({
      title: "Disconnect Twitter",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to disconnect your Twitter account? You will need to reconnect to post tweets.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!jwt) return;
        setDisconnectingTwitter(true);
        try {
          const result = await disconnectTwitter(jwt);
          if (result.success) {
            // Reset status to show disconnected state
            setTwitterStatus({ connected: false });
            message.success("Twitter account disconnected successfully");
          } else {
            message.error(result.error || "Failed to disconnect Twitter");
          }
        } catch (error) {
          console.error("Failed to disconnect Twitter:", error);
          message.error("Failed to disconnect Twitter account");
        } finally {
          setDisconnectingTwitter(false);
        }
      },
    });
  };

  const handleDisconnectFacebook = () => {
    Modal.confirm({
      title: "Disconnect Facebook",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to disconnect your Facebook account? You will need to reconnect to share posts.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!jwt) return;
        setDisconnectingFacebook(true);
        try {
          const result = await disconnectFacebook(jwt);
          if (result.success) {
            // Reset status to show disconnected state
            setFacebookStatus({ connected: false });
            message.success("Facebook account disconnected successfully");
          } else {
            message.error(result.error || "Failed to disconnect Facebook");
          }
        } catch (error) {
          console.error("Failed to disconnect Facebook:", error);
          message.error("Failed to disconnect Facebook account");
        } finally {
          setDisconnectingFacebook(false);
        }
      },
    });
  };

  const handleDisconnectInstagram = () => {
    Modal.confirm({
      title: "Disconnect Instagram",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to disconnect your Instagram account? You will need to reconnect to share posts.",
      okText: "Disconnect",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        if (!jwt) return;
        setDisconnectingInstagram(true);
        try {
          const result = await disconnectInstagram(jwt);
          if (result.success) {
            // Reset status to show disconnected state
            setInstagramStatus({ connected: false });
            message.success("Instagram account disconnected successfully");
          } else {
            message.error(result.error || "Failed to disconnect Instagram");
          }
        } catch (error) {
          console.error("Failed to disconnect Instagram:", error);
          message.error("Failed to disconnect Instagram account");
        } finally {
          setDisconnectingInstagram(false);
        }
      },
    });
  };

  // Handle image selection
  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    return false; // Prevent auto upload
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Create LinkedIn post
  const handleCreatePost = async () => {
    if (!jwt || !postText.trim()) {
      message.error("Please enter some text for your post");
      return;
    }

    // Validate based on post type
    if (postType === "link" && !linkUrl.trim()) {
      message.error("Please enter a URL for your link post");
      return;
    }
    if (postType === "video" && !selectedVideo) {
      message.error("Please select a video for your video post");
      return;
    }
    if (postType === "image" && !selectedImage) {
      message.error("Please select an image for your image post");
      return;
    }

    setPosting(true);
    setUploadProgress(0);

    // Determine if posting to organization or personal
    const organizationId =
      selectedPostTarget !== "personal" ? selectedPostTarget : undefined;
    const targetName = organizationId
      ? organizations.find((org) => org.id === organizationId)?.name ||
        "Company Page"
      : "Personal Profile";

    try {
      if (postType === "image" && selectedImage) {
        // Post with image
        setUploadProgress(10);

        // Step 1: Initialize image upload (with organization if selected)
        const initResult = await initializeImageUpload(jwt, organizationId);
        if (
          !initResult.success ||
          !initResult.uploadUrl ||
          !initResult.imageUrn
        ) {
          throw new Error(
            initResult.error || "Failed to initialize image upload"
          );
        }
        setUploadProgress(30);

        // Step 2: Convert image to base64 and upload
        const base64Data = await fileToBase64(selectedImage);
        const uploadResult = await uploadImageToLinkedIn(
          jwt,
          initResult.uploadUrl,
          base64Data
        );
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload image");
        }
        setUploadProgress(70);

        // Step 3: Create post with image
        const postResult = await createLinkedInPostWithImage(
          jwt,
          postText.trim(),
          initResult.imageUrn,
          organizationId
        );
        if (!postResult.success) {
          throw new Error(postResult.error || "Failed to create post");
        }
        setUploadProgress(100);

        message.success(`🎉 Post with image published to ${targetName}!`);
      } else if (postType === "video" && selectedVideo) {
        // Post with video
        setUploadProgress(10);

        // Step 1: Initialize video upload
        const initResult = await initializeVideoUpload(
          jwt,
          selectedVideo.size,
          organizationId
        );
        if (
          !initResult.success ||
          !initResult.uploadUrl ||
          !initResult.videoUrn
        ) {
          throw new Error(
            initResult.error || "Failed to initialize video upload"
          );
        }
        setUploadProgress(30);

        // Step 2: Convert video to base64 and upload
        const base64Data = await videoFileToBase64(selectedVideo);
        const uploadResult = await uploadVideo(
          jwt,
          initResult.uploadUrl,
          base64Data
        );
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Failed to upload video");
        }
        setUploadProgress(70);

        // Step 3: Create post with video
        const postResult = await createLinkedInPostWithVideo(
          jwt,
          postText.trim(),
          initResult.videoUrn,
          organizationId
        );
        if (!postResult.success) {
          throw new Error(postResult.error || "Failed to create post");
        }
        setUploadProgress(100);

        message.success(`🎉 Video post published to ${targetName}!`);
      } else if (postType === "link" && linkUrl) {
        // Post with link
        setUploadProgress(50);
        const result = await createLinkedInPostWithLink(
          jwt,
          postText.trim(),
          linkUrl.trim(),
          linkTitle.trim() || undefined,
          linkDescription.trim() || undefined,
          organizationId
        );
        if (!result.success) {
          throw new Error(result.error || "Failed to create post");
        }
        setUploadProgress(100);
        message.success(`🎉 Link post published to ${targetName}!`);
      } else {
        // Text-only post
        setUploadProgress(50);
        const result = await createLinkedInPost(
          jwt,
          postText.trim(),
          organizationId
        );
        if (!result.success) {
          throw new Error(result.error || "Failed to create post");
        }
        setUploadProgress(100);
        message.success(`🎉 Post published to ${targetName}!`);
      }

      // Reset form
      setPostText("");
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      setPostType("text");
      setPostModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create LinkedIn post:", error);
      message.error(
        error.message || "Failed to create post. Please try again."
      );
    } finally {
      setPosting(false);
      setUploadProgress(0);
    }
  };

  // Handle video selection
  const handleVideoSelect = (file: File) => {
    // Check file size (max 200MB for LinkedIn)
    if (file.size > 200 * 1024 * 1024) {
      message.error("Video must be smaller than 200MB");
      return false;
    }
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    return false;
  };

  // Clear video selection
  const handleVideoClear = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
  };

  // Load events for a specific organization
  const handleLoadOrgEvents = async (orgId: string) => {
    if (!jwt) return;
    setSelectedEventOrg(orgId);
    setLoadingEvents(true);
    try {
      if (orgId === "all") {
        const result = await getMyLinkedInEvents(jwt);
        if (result.success) {
          setEvents(result.events);
        }
      } else {
        const result = await getOrganizationLinkedInEvents(jwt, orgId);
        if (result.success) {
          setEvents(result.events);
        }
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Create a new event
  const handleCreateEvent = async (values: any) => {
    if (!jwt) return;

    setCreatingEvent(true);
    try {
      const result = await createLinkedInEvent(jwt, {
        organizationId: values.organizationId,
        name: values.name,
        description: values.description,
        startAt: values.startAt.valueOf(),
        endAt: values.endAt?.valueOf(),
        eventUrl: values.eventUrl,
        eventType: values.eventType,
        locale: "en_US",
      });

      if (result.success) {
        message.success("Event created successfully!");
        setCreateEventModalOpen(false);
        eventForm.resetFields();
        // Reload events
        handleLoadOrgEvents(selectedEventOrg);
      } else {
        message.error(result.error || "Failed to create event");
      }
    } catch (error: any) {
      console.error("Failed to create event:", error);
      message.error(error.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Delete an event
  const handleDeleteEvent = async (eventId: string) => {
    if (!jwt) return;

    Modal.confirm({
      title: "Delete Event",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to delete this event? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const result = await deleteLinkedInEventService(jwt, eventId);
          if (result.success) {
            message.success("Event deleted successfully");
            setEvents(events.filter((e) => e.id !== eventId));
          } else {
            message.error(result.error || "Failed to delete event");
          }
        } catch (error: any) {
          console.error("Failed to delete event:", error);
          message.error(error.message || "Failed to delete event");
        }
      },
    });
  };

  // Generate auth URL with userId for proper token association
  // If userId is not available yet, we still show the button but it won't work until user data loads
  const authUrl = userId ? getLinkedInAuthUrl(userId) : undefined;
  const twitterAuthUrl = userId ? getTwitterAuthUrl(userId) : undefined;

  // Debug: Log what we have
  console.log(
    "LinkedInDashboard - userId:",
    userId,
    "isLoggedIn:",
    isLoggedIn,
    "user:",
    user
  );

  const renderMetricsContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
          <Typography.Paragraph style={{ marginTop: 16, color: "#666" }}>
            Loading LinkedIn metrics...
          </Typography.Paragraph>
        </div>
      );
    }

    if (!jwt || !isLoggedIn) {
      return (
        <Empty
          image={
            <LinkedinOutlined style={{ fontSize: 64, color: "#0077B5" }} />
          }
          description={
            <Typography.Text type="secondary">
              Please log in to view your LinkedIn analytics
            </Typography.Text>
          }
        />
      );
    }

    const isConnected = metrics?.connected === true;
    const profile = metrics?.profile;

    return (
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "0 16px" : screens.xl ? "0 32px" : "0 24px",
        }}
      >
        {/* Header Section */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Typography.Title
              level={2}
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <LinkedinOutlined style={{ color: "#0077B5" }} />
              Social Dashboard
            </Typography.Title>
            <Typography.Text type="secondary">
              Track your LinkedIn presence and engagement
            </Typography.Text>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {isConnected && (
              <>
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleRefreshMetrics}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  icon={<DisconnectOutlined />}
                  onClick={handleDisconnect}
                  loading={disconnecting}
                  danger
                >
                  Disconnect
                </Button>
              </>
            )}
            {!isConnected && (
              <Button
                type="default"
                icon={<LinkedinOutlined style={{ color: "#ffffff" }} />}
                disabled={!authUrl}
                onClick={() => {
                  if (!authUrl) {
                    console.error(
                      "Cannot connect: userId not available. userId:",
                      userId,
                      "user:",
                      user
                    );
                    alert(
                      "Please wait for user data to load, or try refreshing the page."
                    );
                    return;
                  }
                  // Redirect to LinkedIn OAuth
                  window.location.href = authUrl;
                }}
                style={{
                  backgroundColor: "#0077B5",
                  borderColor: "#0077B5",
                  color: "#ffffff",
                  fontWeight: 500,
                }}
              >
                <span style={{ color: "#ffffff" }}>
                  {authUrl ? "Connect LinkedIn" : "Loading..."}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card - Show when connected */}
        {isConnected && profile && (
          <Card
            style={{ marginBottom: 24, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {profile.picture && (
                <img
                  src={profile.picture}
                  alt={profile.name}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {profile.name}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {profile.email}
                </Typography.Text>
                <br />
                <Tag color="success" style={{ marginTop: 8 }}>
                  ● Connected
                </Tag>
              </div>
            </div>
          </Card>
        )}

        {/* Create Post Card - Show when connected */}
        {isConnected && (
          <Card
            style={{
              marginBottom: 24,
              borderRadius: 12,
              border: "2px dashed #0077B5",
            }}
            styles={{ body: { padding: 24 } }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SendOutlined style={{ fontSize: 24, color: "#fff" }} />
              </div>
              <div>
                <Typography.Text strong style={{ fontSize: 18 }}>
                  Share on LinkedIn
                </Typography.Text>
                <br />
                <Typography.Text type="secondary">
                  Create a post to share with your network
                </Typography.Text>
              </div>
            </div>

            {/* Post Target Selector (Personal vs Organization) */}
            <div style={{ marginBottom: 16 }}>
              <Typography.Text
                type="secondary"
                style={{ display: "block", marginBottom: 8 }}
              >
                Post to:
              </Typography.Text>
              <Select
                value={selectedPostTarget}
                onChange={setSelectedPostTarget}
                style={{ width: "100%", maxWidth: isMobile ? "100%" : 300 }}
                loading={loadingOrgs}
              >
                <Select.Option value="personal">
                  <Space>
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#0077B5" }}
                    />
                    <span>Personal Profile</span>
                    {profile && (
                      <Typography.Text type="secondary">
                        ({profile.name})
                      </Typography.Text>
                    )}
                  </Space>
                </Select.Option>
                {organizations.map((org) => (
                  <Select.Option key={org.id} value={org.id}>
                    <Space>
                      {org.logoUrl ? (
                        <Avatar size="small" src={org.logoUrl} />
                      ) : (
                        <Avatar
                          size="small"
                          icon={<BankOutlined />}
                          style={{ backgroundColor: "#00A0DC" }}
                        />
                      )}
                      <span>{org.name}</span>
                      <Tag color="blue" style={{ marginLeft: 4 }}>
                        Company
                      </Tag>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
              {organizations.length === 0 && !loadingOrgs && (
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginTop: 4, fontSize: 12 }}
                >
                  <strong>Company pages not available:</strong> Posting to
                  company pages requires <code>w_organization_social</code>{" "}
                  scope which needs LinkedIn app verification. You can post to
                  your personal profile.
                </Typography.Text>
              )}
            </div>

            {/* Post Type Selector */}
            <div style={{ marginBottom: 16 }}>
              <Typography.Text
                type="secondary"
                style={{ display: "block", marginBottom: 8 }}
              >
                Post type:
              </Typography.Text>
              <Segmented
                value={postType}
                onChange={(value) => {
                  setPostType(value as "text" | "image" | "video" | "link");
                  // Clear media when switching types
                  if (value !== "image") {
                    handleRemoveImage();
                  }
                  if (value !== "video") {
                    handleVideoClear();
                  }
                  if (value !== "link") {
                    setLinkUrl("");
                    setLinkTitle("");
                    setLinkDescription("");
                  }
                }}
                options={[
                  {
                    label: (
                      <Tooltip title="Text Post">
                        <span>
                          <SendOutlined /> Text
                        </span>
                      </Tooltip>
                    ),
                    value: "text",
                  },
                  {
                    label: (
                      <Tooltip title="Image Post">
                        <span>
                          <PictureOutlined /> Image
                        </span>
                      </Tooltip>
                    ),
                    value: "image",
                  },
                  {
                    label: (
                      <Tooltip title="Video Post">
                        <span>
                          <VideoCameraOutlined /> Video
                        </span>
                      </Tooltip>
                    ),
                    value: "video",
                  },
                  {
                    label: (
                      <Tooltip title="Link Post">
                        <span>
                          <LinkOutlined /> Link
                        </span>
                      </Tooltip>
                    ),
                    value: "link",
                  },
                ]}
                style={{ marginBottom: 8 }}
              />
            </div>

            <Input.TextArea
              placeholder="What do you want to talk about?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              maxLength={3000}
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ marginBottom: 16, borderRadius: 8 }}
            />

            {/* Link Fields */}
            {postType === "link" && (
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="Enter URL (e.g., https://example.com)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  prefix={<LinkOutlined />}
                  style={{ marginBottom: 8, borderRadius: 8 }}
                />
                <Input
                  placeholder="Link title (optional)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  style={{ marginBottom: 8, borderRadius: 8 }}
                />
                <Input
                  placeholder="Link description (optional)"
                  value={linkDescription}
                  onChange={(e) => setLinkDescription(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            {/* Image Upload Section */}
            {postType === "image" && (
              <div style={{ marginBottom: 16 }}>
                {imagePreview ? (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        border: "1px solid #d9d9d9",
                      }}
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      shape="circle"
                      onClick={handleRemoveImage}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(255,255,255,0.9)",
                      }}
                    />
                  </div>
                ) : (
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageSelect}
                    disabled={posting}
                  >
                    <div
                      style={{
                        border: "2px dashed #d9d9d9",
                        borderRadius: 8,
                        padding: 24,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "border-color 0.3s",
                      }}
                    >
                      <PictureOutlined
                        style={{ fontSize: 32, color: "#0077B5" }}
                      />
                      <div style={{ marginTop: 8 }}>
                        Click or drag image to upload
                      </div>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        Supports: JPG, PNG, GIF (Max 8MB)
                      </Typography.Text>
                    </div>
                  </Upload>
                )}
              </div>
            )}

            {/* Video Upload Section */}
            {postType === "video" && (
              <div style={{ marginBottom: 16 }}>
                {videoPreview ? (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <video
                      src={videoPreview}
                      controls
                      style={{
                        maxWidth: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        border: "1px solid #d9d9d9",
                      }}
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      shape="circle"
                      onClick={handleVideoClear}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(255,255,255,0.9)",
                      }}
                    />
                    <Typography.Text
                      type="secondary"
                      style={{ display: "block", marginTop: 8 }}
                    >
                      {selectedVideo?.name} (
                      {(selectedVideo?.size || 0 / 1024 / 1024).toFixed(2)} MB)
                    </Typography.Text>
                  </div>
                ) : (
                  <Upload
                    accept="video/*"
                    showUploadList={false}
                    beforeUpload={handleVideoSelect}
                    disabled={posting}
                  >
                    <div
                      style={{
                        border: "2px dashed #d9d9d9",
                        borderRadius: 8,
                        padding: 24,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "border-color 0.3s",
                      }}
                    >
                      <VideoCameraOutlined
                        style={{ fontSize: 32, color: "#0077B5" }}
                      />
                      <div style={{ marginTop: 8 }}>
                        Click or drag video to upload
                      </div>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        Supports: MP4, MOV (Max 200MB)
                      </Typography.Text>
                    </div>
                  </Upload>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {posting && uploadProgress > 0 && (
              <Progress
                percent={uploadProgress}
                status="active"
                strokeColor={{ from: "#0077B5", to: "#00A0DC" }}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Reactions Info */}
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: "rgba(0, 119, 181, 0.05)",
                borderRadius: 8,
                border: "1px solid rgba(0, 119, 181, 0.1)",
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <strong>Available with w_member_social:</strong>
              </Typography.Text>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                <Tag icon={<LikeOutlined />} color="blue">
                  Like
                </Tag>
                <Tag icon={<TrophyOutlined />} color="gold">
                  Celebrate
                </Tag>
                <Tag icon={<HeartOutlined />} color="red">
                  Love
                </Tag>
                <Tag icon={<BulbOutlined />} color="green">
                  Insightful
                </Tag>
                <Tag icon={<QuestionCircleOutlined />} color="purple">
                  Curious
                </Tag>
                <Tag icon={<CommentOutlined />} color="cyan">
                  Comment
                </Tag>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleCreatePost}
                loading={posting}
                disabled={
                  !postText.trim() ||
                  (postType === "link" && !linkUrl.trim()) ||
                  (postType === "video" && !selectedVideo) ||
                  (postType === "image" && !selectedImage)
                }
                style={{
                  borderRadius: 8,
                  backgroundColor: "#0077B5",
                  borderColor: "#0077B5",
                }}
              >
                {posting ? "Publishing..." : "Post to LinkedIn"}
              </Button>
            </div>
          </Card>
        )}

        {/* Metrics Cards */}
        <Row gutter={[24, 24]}>
          {/* Followers Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Followers
                </Typography.Text>
              </div>
              {metrics?.followers?.available ? (
                <Statistic
                  value={metrics.followers.value}
                  valueStyle={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "#0077B5",
                  }}
                />
              ) : isConnected ? (
                <div>
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 12 }}
                  >
                    {metrics?.followers?.reason ||
                      "Requires LinkedIn Marketing API permissions"}
                  </Typography.Text>
                  <Tag color="warning">API Limited</Tag>
                </div>
              ) : (
                <div>
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 12 }}
                  >
                    Connect LinkedIn to see your follower count
                  </Typography.Text>
                  {authUrl ? (
                    <Button
                      type="link"
                      onClick={() => {
                        if (!authUrl) {
                          console.error(
                            "Cannot connect: userId not available. userId:",
                            userId,
                            "user:",
                            user
                          );
                          alert(
                            "Please wait for user data to load, or try refreshing the page."
                          );
                          return;
                        }
                        // Redirect to LinkedIn OAuth
                        window.location.href = authUrl;
                      }}
                      style={{ padding: 0, color: "#0077B5" }}
                    >
                      Connect now →
                    </Button>
                  ) : (
                    <Tag color="default">Not Available</Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* Connections Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, #00A0DC 0%, #0077B5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TeamOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Connections
                </Typography.Text>
              </div>
              {metrics?.connections?.available ? (
                <Statistic
                  value={metrics.connections.value}
                  valueStyle={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: "#00A0DC",
                  }}
                />
              ) : isConnected ? (
                <div>
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 12 }}
                  >
                    {metrics?.connections?.reason ||
                      "Requires special LinkedIn API permissions"}
                  </Typography.Text>
                  <Tag color="warning">API Limited</Tag>
                </div>
              ) : (
                <div>
                  <Typography.Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 12 }}
                  >
                    Your total network connections
                  </Typography.Text>
                  <Tag color="default">Not Connected</Tag>
                </div>
              )}
            </Card>
          </Col>

          {/* Profile Views Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ height: "100%", borderRadius: 12 }}
              styles={{ body: { padding: 24 } }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, #86868B 0%, #636366 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <EyeOutlined style={{ fontSize: 24, color: "#fff" }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Profile Views
                </Typography.Text>
              </div>
              <div>
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 12 }}
                >
                  90-day profile view analytics
                </Typography.Text>
                <Tag color="warning">Not supported by LinkedIn API</Tag>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Connection Status */}
        <Card
          style={{ marginTop: 24, borderRadius: 12 }}
          styles={{ body: { padding: 24 } }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text strong style={{ fontSize: 16 }}>
                LinkedIn Connection Status
              </Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {isConnected
                  ? "Your LinkedIn account is connected and syncing data"
                  : "Connect your LinkedIn account to start tracking your social metrics"}
              </Typography.Text>
            </Col>
            <Col>
              {isConnected ? (
                <Tag
                  color="success"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ● Connected
                </Tag>
              ) : (
                <Tag
                  color="default"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ○ Not Connected
                </Tag>
              )}
            </Col>
          </Row>
        </Card>

        {/* Twitter Connection Section */}
        <Card
          style={{ marginTop: 24, borderRadius: 12 }}
          styles={{ body: { padding: 24 } }}
        >
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <TwitterOutlined style={{ color: "#1DA1F2" }} />
                Twitter/X Connection
              </Typography.Title>
              <Typography.Text type="secondary">
                Connect your Twitter account to post tweets from your calendar
              </Typography.Text>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {twitterStatus?.connected && (
                <>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={async () => {
                      if (!jwt) return;
                      setLoadingTwitter(true);
                      try {
                        const data = await getTwitterStatus(jwt);
                        setTwitterStatus(data);
                        message.success("Twitter status refreshed");
                      } catch (error) {
                        console.error(
                          "Failed to refresh Twitter status:",
                          error
                        );
                        message.error("Failed to refresh Twitter status");
                      } finally {
                        setLoadingTwitter(false);
                      }
                    }}
                    loading={loadingTwitter}
                  >
                    Refresh
                  </Button>
                  <Button
                    icon={<DisconnectOutlined />}
                    onClick={handleDisconnectTwitter}
                    loading={disconnectingTwitter}
                    danger
                  >
                    Disconnect
                  </Button>
                </>
              )}
              {!twitterStatus?.connected && (
                <Button
                  type="default"
                  icon={<TwitterOutlined style={{ color: "#ffffff" }} />}
                  disabled={!twitterAuthUrl}
                  onClick={() => {
                    if (!twitterAuthUrl) {
                      console.error(
                        "Cannot connect: userId not available. userId:",
                        userId,
                        "user:",
                        user
                      );
                      alert(
                        "Please wait for user data to load, or try refreshing the page."
                      );
                      return;
                    }
                    // Redirect to Twitter OAuth
                    window.location.href = twitterAuthUrl;
                  }}
                  style={{
                    backgroundColor: "#1DA1F2",
                    borderColor: "#1DA1F2",
                    color: "#ffffff",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#ffffff" }}>
                    {twitterAuthUrl ? "Connect Twitter" : "Loading..."}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Twitter Profile Card - Show when connected */}
          {twitterStatus?.connected && twitterStatus?.profile && (
            <Card
              style={{
                marginBottom: 24,
                borderRadius: 12,
                backgroundColor: "#f8f9fa",
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TwitterOutlined style={{ fontSize: 32, color: "#fff" }} />
                </div>
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    @{twitterStatus.profile.username}
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {twitterStatus.profile.name}
                  </Typography.Text>
                  <br />
                  <Tag color="success" style={{ marginTop: 8 }}>
                    ● Connected
                  </Tag>
                </div>
              </div>
            </Card>
          )}

          {/* Twitter Connection Status */}
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Twitter Connection Status
              </Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {twitterStatus?.connected
                  ? "Your Twitter account is connected and ready to post tweets"
                  : "Connect your Twitter account to enable posting tweets from your calendar"}
              </Typography.Text>
            </Col>
            <Col>
              {twitterStatus?.connected ? (
                <Tag
                  color="success"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ● Connected
                </Tag>
              ) : (
                <Tag
                  color="default"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ○ Not Connected
                </Tag>
              )}
            </Col>
          </Row>
        </Card>

        {/* Facebook Connection Section */}
        <Card
          style={{ marginTop: 24, borderRadius: 12 }}
          styles={{ body: { padding: 24 } }}
        >
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <FacebookOutlined style={{ color: "#1877F2" }} />
                Facebook Connection
              </Typography.Title>
              <Typography.Text type="secondary">
                Connect your Facebook Page to share posts from your calendar. Personal accounts can also use this.
              </Typography.Text>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {facebookStatus?.connected && (
                <>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={async () => {
                      if (!jwt) return;
                      setLoadingFacebook(true);
                      try {
                        const fbData = await getFacebookStatus(jwt);
                        setFacebookStatus(fbData);
                        message.success("Facebook status refreshed");
                      } catch (error) {
                        console.error("Failed to refresh Facebook status:", error);
                        message.error("Failed to refresh Facebook status");
                      } finally {
                        setLoadingFacebook(false);
                      }
                    }}
                    loading={loadingFacebook}
                  >
                    Refresh
                  </Button>
                  <Button
                    icon={<DisconnectOutlined />}
                    onClick={handleDisconnectFacebook}
                    loading={disconnectingFacebook}
                    danger
                  >
                    Disconnect
                  </Button>
                </>
              )}
              {!facebookStatus?.connected && (
                <Button
                  type="default"
                  icon={<FacebookOutlined style={{ color: "#ffffff" }} />}
                  loading={!facebookAuthUrl && loadingFacebook}
                  onClick={async () => {
                    // If auth URL is not loaded, try to load it first
                    if (!facebookAuthUrl) {
                      if (!jwt) {
                        message.error("Please login first");
                        return;
                      }
                      message.loading("Loading auth URL...", 1);
                      try {
                        const authData = await getFacebookAuthUrl(jwt);
                        console.log("Facebook auth URL response:", authData);
                        if (authData.success && authData.authUrl) {
                          setFacebookAuthUrl(authData.authUrl);
                          // Redirect immediately after getting URL
                          window.location.href = authData.authUrl;
                        } else {
                          console.error("Failed to get Facebook auth URL:", authData.error);
                          message.error(authData.error || "Failed to get Facebook auth URL");
                        }
                      } catch (error) {
                        console.error("Failed to get Facebook auth URL:", error);
                        message.error("Failed to get Facebook auth URL. Please check your connection.");
                      }
                      return;
                    }
                    // Redirect to Facebook OAuth
                    console.log("Redirecting to Facebook OAuth:", facebookAuthUrl);
                    window.location.href = facebookAuthUrl;
                  }}
                  style={{
                    backgroundColor: "#1877F2",
                    borderColor: "#1877F2",
                    color: "#ffffff",
                    fontWeight: 500,
                  }}
                >
                  <span style={{ color: "#ffffff" }}>
                    {facebookAuthUrl ? "Connect Facebook" : "Connect Facebook"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Facebook Connection Status */}
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Facebook Connection Status
              </Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {facebookStatus?.connected
                  ? "Your Facebook Page is connected and ready to share posts"
                  : "Connect your Facebook Page to enable sharing posts from your calendar"}
              </Typography.Text>
            </Col>
            <Col>
              {facebookStatus?.connected ? (
                <Tag
                  color="success"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ● Connected
                </Tag>
              ) : (
                <Tag
                  color="default"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ○ Not Connected
                </Tag>
              )}
            </Col>
          </Row>
        </Card>

        {/* Instagram Connection Section */}
        <Card
          style={{ marginTop: 24, borderRadius: 12 }}
          styles={{ body: { padding: 24 } }}
        >
          <div
            style={{
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20, color: "#E4405F" }}>📷</span>
                Instagram Connection
              </Typography.Title>
              <Typography.Text type="secondary">
                Connect your Instagram Business/Creator account. Requires a Facebook Page (will be connected automatically).
              </Typography.Text>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {instagramStatus?.connected && (
                <>
                  <Button
                    icon={<SyncOutlined />}
                    onClick={async () => {
                      if (!jwt) return;
                      setLoadingInstagram(true);
                      try {
                        const igData = await getInstagramStatus(jwt);
                        setInstagramStatus(igData);
                        message.success("Instagram status refreshed");
                      } catch (error) {
                        console.error("Failed to refresh Instagram status:", error);
                        message.error("Failed to refresh Instagram status");
                      } finally {
                        setLoadingInstagram(false);
                      }
                    }}
                    loading={loadingInstagram}
                  >
                    Refresh
                  </Button>
                  <Button
                    icon={<DisconnectOutlined />}
                    onClick={handleDisconnectInstagram}
                    loading={disconnectingInstagram}
                    danger
                  >
                    Disconnect
                  </Button>
                </>
              )}
              {!instagramStatus?.connected && (
                <Button
                  type="default"
                  style={{
                    backgroundColor: "#E4405F",
                    borderColor: "#E4405F",
                    color: "#ffffff",
                    fontWeight: 500,
                  }}
                  loading={!instagramAuthUrl && loadingInstagram}
                  onClick={async () => {
                    // If auth URL is not loaded, try to load it first
                    if (!instagramAuthUrl) {
                      if (!jwt) {
                        message.error("Please login first");
                        return;
                      }
                      message.loading("Loading auth URL...", 1);
                      try {
                        const authData = await getInstagramAuthUrl(jwt);
                        console.log("Instagram auth URL response:", authData);
                        if (authData.success && authData.authUrl) {
                          setInstagramAuthUrl(authData.authUrl);
                          // Redirect immediately after getting URL
                          window.location.href = authData.authUrl;
                        } else {
                          console.error("Failed to get Instagram auth URL:", authData.error);
                          message.error(authData.error || "Failed to get Instagram auth URL");
                        }
                      } catch (error) {
                        console.error("Failed to get Instagram auth URL:", error);
                        message.error("Failed to get Instagram auth URL. Please check your connection.");
                      }
                      return;
                    }
                    // Redirect to Instagram OAuth
                    console.log("Redirecting to Instagram OAuth:", instagramAuthUrl);
                    window.location.href = instagramAuthUrl;
                  }}
                >
                  <span style={{ color: "#ffffff" }}>
                    {instagramAuthUrl ? "Connect Instagram" : "Connect Instagram"}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Instagram Connection Status */}
          <Row align="middle" justify="space-between">
            <Col>
              <Typography.Text strong style={{ fontSize: 16 }}>
                Instagram Connection Status
              </Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {instagramStatus?.connected
                  ? "Your Instagram account is connected and ready to share posts"
                  : "Connect your Instagram Business/Creator account to enable sharing posts from your calendar. Note: Requires a Facebook Page."}
              </Typography.Text>
            </Col>
            <Col>
              {instagramStatus?.connected ? (
                <Tag
                  color="success"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ● Connected
                </Tag>
              ) : (
                <Tag
                  color="default"
                  style={{ padding: "4px 12px", fontSize: 14 }}
                >
                  ○ Not Connected
                </Tag>
              )}
            </Col>
          </Row>
        </Card>

        {/* Events Section */}
        {isConnected && (
          <Card
            style={{ marginTop: 24, borderRadius: 12 }}
            styles={{ body: { padding: 24 } }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CalendarOutlined style={{ fontSize: 20, color: "#0077B5" }} />
                <span>LinkedIn Events</span>
                <Tag color="orange">Requires Community Management API</Tag>
              </div>
            }
            extra={
              organizations.length > 0 ? (
                <Space>
                  <Select
                    value={selectedEventOrg}
                    onChange={handleLoadOrgEvents}
                    style={{ width: 200 }}
                    loading={loadingOrgs}
                  >
                    <Select.Option value="all">All My Events</Select.Option>
                    {organizations.map((org) => (
                      <Select.Option key={org.id} value={org.id}>
                        {org.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateEventModalOpen(true)}
                    style={{
                      backgroundColor: "#0077B5",
                      borderColor: "#0077B5",
                    }}
                  >
                    Create Event
                  </Button>
                </Space>
              ) : null
            }
          >
            {/* Show API requirement notice */}
            {events.length === 0 && !loadingEvents && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #fff7e6 0%, #fff2d9 100%)",
                  padding: 20,
                  borderRadius: 8,
                  marginBottom: 16,
                  border: "1px solid #ffd591",
                }}
              >
                <Typography.Text
                  strong
                  style={{
                    display: "block",
                    marginBottom: 8,
                    color: "#d48806",
                  }}
                >
                  ⚠️ LinkedIn API Access Required
                </Typography.Text>
                <Typography.Text type="secondary">
                  To access LinkedIn Events, your app needs the{" "}
                  <strong>Community Management API</strong> product enabled in
                  the LinkedIn Developer Portal. This product provides access to{" "}
                  <code>r_events</code> and <code>rw_events</code> scopes.
                </Typography.Text>
                <br />
                <br />
                <Typography.Text type="secondary">
                  <strong>To enable Events access:</strong>
                  <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                    <li>
                      Go to{" "}
                      <a
                        href="https://www.linkedin.com/developers/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn Developer Portal
                      </a>
                    </li>
                    <li>
                      Select your app → <strong>Products</strong> tab
                    </li>
                    <li>
                      Request access to{" "}
                      <strong>"Community Management API"</strong>
                    </li>
                    <li>Once approved, reconnect your LinkedIn account</li>
                  </ol>
                </Typography.Text>
              </div>
            )}

            {loadingEvents ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin />
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginTop: 12 }}
                >
                  Loading events...
                </Typography.Text>
              </div>
            ) : events.length === 0 ? (
              <Empty
                image={
                  <CalendarOutlined
                    style={{ fontSize: 48, color: "#d9d9d9" }}
                  />
                }
                description={
                  <div>
                    <Typography.Text type="secondary">
                      No events found
                    </Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {organizations.length > 0
                        ? "Create an event to get started"
                        : "You need admin access to an organization to manage events"}
                    </Typography.Text>
                  </div>
                }
              >
                {organizations.length > 0 && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateEventModalOpen(true)}
                    style={{
                      backgroundColor: "#0077B5",
                      borderColor: "#0077B5",
                    }}
                  >
                    Create Your First Event
                  </Button>
                )}
              </Empty>
            ) : (
              <List
                dataSource={events}
                renderItem={(event) => (
                  <List.Item
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background:
                              "linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CalendarOutlined
                            style={{ fontSize: 24, color: "#fff" }}
                          />
                        </div>
                      }
                      title={
                        <Space>
                          <Typography.Text strong>{event.name}</Typography.Text>
                          {event.eventType && (
                            <Tag
                              color={
                                event.eventType === "ONLINE" ? "blue" : "green"
                              }
                            >
                              {event.eventType === "ONLINE" ? (
                                <GlobalOutlined />
                              ) : (
                                <EnvironmentOutlined />
                              )}{" "}
                              {event.eventType}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          {event.description && (
                            <Typography.Paragraph
                              ellipsis={{ rows: 2 }}
                              style={{ margin: 0, marginBottom: 4 }}
                            >
                              {event.description}
                            </Typography.Paragraph>
                          )}
                          <Space size="middle">
                            {event.startAt && (
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                <CalendarOutlined />{" "}
                                {dayjs(event.startAt).format(
                                  "MMM D, YYYY h:mm A"
                                )}
                              </Typography.Text>
                            )}
                            {event.organizerName && (
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                <BankOutlined /> {event.organizerName}
                              </Typography.Text>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}

        {/* Create Event Modal */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CalendarOutlined style={{ color: "#0077B5" }} />
              Create LinkedIn Event
            </div>
          }
          open={createEventModalOpen}
          onCancel={() => {
            setCreateEventModalOpen(false);
            eventForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form
            form={eventForm}
            layout="vertical"
            onFinish={handleCreateEvent}
            initialValues={{
              eventType: "ONLINE",
            }}
          >
            <Form.Item
              name="organizationId"
              label="Organization"
              rules={[
                { required: true, message: "Please select an organization" },
              ]}
            >
              <Select placeholder="Select organization">
                {organizations.map((org) => (
                  <Select.Option key={org.id} value={org.id}>
                    <Space>
                      {org.logoUrl ? (
                        <Avatar size="small" src={org.logoUrl} />
                      ) : (
                        <Avatar
                          size="small"
                          icon={<BankOutlined />}
                          style={{ backgroundColor: "#00A0DC" }}
                        />
                      )}
                      {org.name}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="name"
              label="Event Name"
              rules={[{ required: true, message: "Please enter event name" }]}
            >
              <Input placeholder="Enter event name" maxLength={100} />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <Input.TextArea
                placeholder="Describe your event..."
                maxLength={1000}
                showCount
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={12}>
                <Form.Item
                  name="startAt"
                  label="Start Date & Time"
                  rules={[
                    { required: true, message: "Please select start time" },
                  ]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Select start date/time"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={12}>
                <Form.Item name="endAt" label="End Date & Time">
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: "100%" }}
                    placeholder="Select end date/time"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="eventType" label="Event Type">
              <Select>
                <Select.Option value="ONLINE">
                  <Space>
                    <GlobalOutlined /> Online Event
                  </Space>
                </Select.Option>
                <Select.Option value="IN_PERSON">
                  <Space>
                    <EnvironmentOutlined /> In-Person Event
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="eventUrl" label="Event URL">
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setCreateEventModalOpen(false);
                    eventForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creatingEvent}
                  style={{ backgroundColor: "#0077B5", borderColor: "#0077B5" }}
                >
                  Create Event
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  return (
    <Layout className={`${styles.dashboard} ${styles.dashboardLight}`}>
      <Header
        isLoggedIn={isLoggedIn}
        onLoginSuccess={onLoginSuccess}
        onLogout={onLogout}
        user={user}
      />
      <Layout className={styles.dashboardLayout}>
        <Content
          className={`${styles.content} ${styles.contentLight} ${styles.socialDashboardContent}`}
          style={{
            padding: isMobile ? "24px 0" : "32px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          {renderMetricsContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

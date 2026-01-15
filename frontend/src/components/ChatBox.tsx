import {
  ArrowUpOutlined,
  PlusOutlined,
  CalendarOutlined,
  PictureOutlined,
  UploadOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Tooltip,
  message,
  Spin,
  Dropdown,
  MenuProps,
} from "antd";
import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatBox.module.css";
import { chatService, ChatMessage } from "../services/chatService";
import { uploadService } from "../services/uploadService";
import ImageGenerationModal from "./ImageGenerationModal";
import ContentPlanModal from "./ContentPlanModal";
import { getImageUrl } from "../utils/imageUtils";

const { TextArea } = Input;

interface ChatBoxProps {
  conversationId?: string | null;
  onConversationChange?: (conversationId: string | null) => void;
  onTypingStatusChange?: (typing: boolean) => void;
  onContentChange?: (hasMessages: boolean) => void;
  onInsertContent?: () => void; // Callback when content is inserted
}

export default function ChatBox({
  conversationId,
  onConversationChange,
  onTypingStatusChange,
  onContentChange,
  onInsertContent,
}: ChatBoxProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(conversationId || null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [contentPlanModalOpen, setContentPlanModalOpen] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; name: string; type: string; size: number }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializingRef = useRef(false);
  const previousHasMessagesRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Edit message state (from main branch)
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(
    null
  );
  const [editingMessageContent, setEditingMessageContent] =
    useState<string>("");
  const [editingMessageImages, setEditingMessageImages] = useState<string[]>(
    []
  );
  const [editingMessageFiles, setEditingMessageFiles] = useState<
    Array<{ url: string; name: string; type: string; size: number }>
  >([]);

  // Store pending ELO message in ref
  const pendingELOMessageRef = useRef<string | null>(null);

  // Load conversation when conversationId changes
  useEffect(() => {
    // Only load if conversationId is different from current one
    // This prevents reloading when we just created a new conversation
    if (conversationId && conversationId !== currentConversationId) {
      // Skip if we're currently initializing (sending a message that creates a new conversation)
      if (!isInitializingRef.current) {
        loadConversation(conversationId);
      }
    } else if (!conversationId && currentConversationId && !isInitializingRef.current) {
      // Reset to new conversation only if we had a conversation before
      // and we're not in the middle of initializing
      // Only clear messages if we're actually switching to a new conversation (not loading)
      if (!loading) {
        setMessages([]);
        setCurrentConversationId(null);
      }
    }
  }, [conversationId, currentConversationId, loading]);

  // Inform parent when typing state changes
  const updateTypingStatus = useCallback(
    (typing: boolean) => {
      if (onTypingStatusChange) {
        onTypingStatusChange(typing);
      }
    },
    [onTypingStatusChange]
  );

  useEffect(() => {
    if (onContentChange) {
      // Only notify parent if messages actually exist
      // Don't reset to false during loading to prevent title from flashing
      const hasActualMessages = messages.length > 0;
      // Only call onContentChange if the value actually changed
      // This prevents unnecessary re-renders and UI jumps
      if (hasActualMessages !== previousHasMessagesRef.current) {
        previousHasMessagesRef.current = hasActualMessages;
        onContentChange(hasActualMessages);
      }
    }
  }, [messages.length, onContentChange]);

  const loadConversation = async (id: string) => {
    // Don't reload if we're already loading or if it's the same conversation
    // Also don't reload if we're currently initializing a new conversation
    if (loading || id === currentConversationId || isInitializingRef.current) {
      return;
    }
    
    setLoading(true);
    // Don't clear messages immediately - wait until new messages are loaded
    // This prevents the title from flashing when switching conversations
    try {
      const result = await chatService.getConversation(id);
      if (result.success && result.conversation) {
        setMessages(result.conversation.messages);
        setCurrentConversationId(id);
      } else {
        message.error(result.message || "Failed to load conversation");
        // Only clear messages if loading failed
        setMessages([]);
      }
    } catch {
      message.error("An error occurred while loading conversation");
      // Only clear messages if loading failed
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const isEmpty =
    !inputMessage.trim() &&
    uploadedImages.length === 0 &&
    uploadedFiles.length === 0;

  // Check if message contains content plan intent
  const hasContentPlanIntent = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const keywords = [
      "generate",
      "create",
      "plan",
      "content plan",
      "marketing plan",
      "calendar",
      "schedule",
      "campaign",
      "social media",
      "post schedule",
    ];
    return keywords.some((keyword) => lowerMessage.includes(keyword));
  };

  // Check if conversation history contains "calendar" keyword
  const hasCalendarInHistory = (): boolean => {
    const allMessages = messages.map(msg => 
      msg.content ? msg.content.toLowerCase() : ''
    ).join(' ');
    return allMessages.includes('calendar');
  };

  const handleSend = async () => {
    // Allow sending if there's text or images
    const hasContent = inputMessage.trim() || uploadedImages.length > 0;
    if (!hasContent || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content:
        inputMessage.trim() ||
        (uploadedImages.length > 0 || uploadedFiles.length > 0
          ? `Uploaded ${uploadedImages.length > 0 ? `${uploadedImages.length} image(s)` : ""}${uploadedImages.length > 0 && uploadedFiles.length > 0 ? " and " : ""}${uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : ""}`
          : ""),
      images: uploadedImages.length > 0 ? [...uploadedImages] : undefined,
      files:
        uploadedFiles.length > 0
          ? uploadedFiles.map((f) => ({
              url: f.url,
              name: f.name,
              type: f.type,
              size: f.size,
            }))
          : undefined,
      timestamp: new Date(),
    };

    // Add user message to the list immediately
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    const currentImages = [...uploadedImages];
    const currentFiles = [...uploadedFiles];
    setLastUserMessage(currentInput);
    setInputMessage("");
    setUploadedImages([]);
    setUploadedFiles([]);
    updateTypingStatus(false);
    setLoading(true);
    isInitializingRef.current = true;

    // Scroll to bottom after adding user message (ensure DOM is updated)
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    try {
      const response = await chatService.sendMessage(
        currentInput ||
          (currentImages.length > 0 || currentFiles.length > 0
            ? `Uploaded ${currentImages.length > 0 ? `${currentImages.length} image(s)` : ""}${currentImages.length > 0 && currentFiles.length > 0 ? " and " : ""}${currentFiles.length > 0 ? `${currentFiles.length} file(s)` : ""}`
            : ""),
        currentConversationId || undefined,
        currentImages.length > 0 ? currentImages : undefined,
        currentFiles.length > 0 ? currentFiles : undefined
      );

      if (response.success && response.response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Scroll to bottom after receiving assistant response
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // Update conversation ID if it's a new conversation
        if (response.conversationId) {
          // Only update if it's a new conversation or different from current
          if (!currentConversationId || response.conversationId !== currentConversationId) {
            // Update currentConversationId first to prevent useEffect from reloading
            setCurrentConversationId(response.conversationId);
            // Mark that we're done initializing
            isInitializingRef.current = false;
            // Notify parent immediately - no need for setTimeout as state is already updated
            if (onConversationChange) {
              onConversationChange(response.conversationId);
            }
          } else {
            isInitializingRef.current = false;
          }
        } else {
          isInitializingRef.current = false;
        }
      } else {
        isInitializingRef.current = false;
        message.error(response.message || "Failed to get response");
        // Remove the last user message if sending failed
        setMessages((prev) => prev.slice(0, -1));
        // Restore input message, images and files
        setInputMessage(currentInput);
        setUploadedImages(currentImages);
        setUploadedFiles(currentFiles);
      }
    } catch {
      isInitializingRef.current = false;
      message.error("An error occurred while sending message");
      setMessages((prev) => prev.slice(0, -1));
      setInputMessage(currentInput);
      setUploadedImages(currentImages);
      setUploadedFiles(currentFiles);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContentPlanModal = () => {
    // Extract goal from conversation history
    // Combine all user messages and assistant messages that mention calendar
    const conversationText = messages
      .map(msg => msg.content || '')
      .join(' ');
    setContentPlanModalOpen(true);
  };

  // Get conversation goal from history for ContentPlanModal
  const getConversationGoal = (): string => {
    // Combine all messages to extract the goal
    const allText = messages
      .map(msg => msg.content || '')
      .join(' ');
    // Extract relevant parts that mention calendar, plan, or content
    return allText || lastUserMessage || '';
  };

  const handleContentPlanSuccess = () => {
    message.success("Content plan sent to calendar successfully");
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    updateTypingStatus(Boolean(value.trim()));
  };

  const handleFocus = () => {
    if (inputMessage.trim().length > 0) {
      updateTypingStatus(true);
    }
  };

  const handleBlur = () => {
    updateTypingStatus(false);
  };

  // Reset typing status when component unmounts
  useEffect(() => {
    return () => {
      updateTypingStatus(false);
    };
  }, [updateTypingStatus]);

  // Listen for messages from ELO widget
  useEffect(() => {
    const handleELOMessage = (event: CustomEvent) => {
      const message = event.detail?.message;
      if (message && typeof message === 'string') {
        pendingELOMessageRef.current = message;
        setInputMessage(message);
      }
    };

    window.addEventListener('elo-send-message', handleELOMessage as EventListener);
    return () => {
      window.removeEventListener('elo-send-message', handleELOMessage as EventListener);
    };
  }, []);

  // Auto-send pending ELO message when input is set and component is ready
  useEffect(() => {
    if (pendingELOMessageRef.current && inputMessage === pendingELOMessageRef.current && !loading && inputMessage.trim()) {
      const messageToSend = pendingELOMessageRef.current;
      pendingELOMessageRef.current = null;
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (inputMessage.trim()) {
          handleSend();
        }
      }, 150);
    }
  }, [inputMessage, loading, handleSend]);

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    // Method 1: Use messagesEndRef (scroll anchor at the end of messages)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // Method 2: Use messagesContainerRef (direct scrollTop manipulation as fallback)
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll when messages or loading state changes
  useEffect(() => {
    // Scroll to bottom when messages update or loading state changes
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageGenerate = () => {
    setImageModalOpen(true);
  };

  // File validation
  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith("image/");
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const allowedFileTypes = [
      // PDF
      "application/pdf",
      // Word
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      // PowerPoint
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Excel
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Text
      "text/plain",
      // Other
      "application/rtf",
      "text/csv",
      // Database files
      "application/x-sql",
      "application/sql",
      "text/x-sql",
      "application/x-sqlite3",
      "application/x-sqlite",
      "application/vnd.sqlite3",
      "application/x-db",
      "application/octet-stream", // For .db, .sqlite files
    ];

    if (isImage) {
      if (!allowedImageTypes.includes(file.type)) {
        return "Only image files (JPG, PNG, GIF, WEBP) are allowed";
      }
      // Check file size (10MB limit for images)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return "Image size must be less than 10MB";
      }
    } else {
      // Check if file type is allowed or if it's a database file by extension
      const isDatabaseFile = /\.(sql|db|sqlite|sqlite3)$/i.test(file.name);
      if (!allowedFileTypes.includes(file.type) && !isDatabaseFile) {
        return "File type not supported. Allowed: PDF, Word, PPT, Excel, TXT, CSV, RTF, SQL, Database files";
      }
      // Check file size (50MB limit for documents)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return "File size must be less than 50MB";
      }
    }

    return null;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    // Validate file
    const error = validateFile(file);
    if (error) {
      message.error(error);
      return;
    }

    const isImage = file.type.startsWith("image/");
    const totalAttachments = uploadedImages.length + uploadedFiles.length;

    // Check max upload limit (10 total attachments)
    if (totalAttachments >= 10) {
      message.warning("Maximum 10 attachments allowed");
      return;
    }

    // Check individual limits
    if (isImage && uploadedImages.length >= 5) {
      message.warning("Maximum 5 images allowed");
      return;
    }

    if (!isImage && uploadedFiles.length >= 5) {
      message.warning("Maximum 5 files allowed");
      return;
    }

    setUploading(true);
    try {
      if (isImage) {
        const response = await uploadService.uploadImage(file);
        if (response.success && response.imageUrl) {
          setUploadedImages((prev) => [...prev, response.imageUrl!]);
          message.success("Image uploaded successfully");
          // Trigger insert content tip
          if (onInsertContent) {
            onInsertContent();
          }
        } else {
          message.error(response.message || "Failed to upload image");
        }
      } else {
        const response = await uploadService.uploadFile(file);
        if (
          response.success &&
          response.fileUrl &&
          response.fileName &&
          response.fileType &&
          response.fileSize
        ) {
          setUploadedFiles((prev) => [
            ...prev,
            {
              url: response.fileUrl!,
              name: response.fileName!,
              type: response.fileType!,
              size: response.fileSize!,
            },
          ]);
          message.success("File uploaded successfully");
          // Trigger insert content tip
          if (onInsertContent) {
            onInsertContent();
          }
        } else {
          message.error(response.message || "Failed to upload file");
        }
      }
    } catch {
      message.error(
        isImage ? "Failed to upload image" : "Failed to upload file"
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        handleFileUpload(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        handleFileUpload(file);
      });
    }
  };

  // Remove uploaded image
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileWordOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
    } else if (
      fileType.includes("powerpoint") ||
      fileType.includes("presentation")
    ) {
      return <FilePptOutlined style={{ fontSize: 24, color: "#ff9800" }} />;
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />;
    } else if (fileType.includes("text") || fileType.includes("plain")) {
      return <FileTextOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
    } else {
      return <FileOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Dropdown menu items
  const menuItems: MenuProps["items"] = [
    {
      key: "generate-image",
      label: "Generate Image",
      icon: <PictureOutlined />,
      onClick: handleImageGenerate,
    },
    {
      key: "upload-files",
      label: "Upload Files",
      icon: <UploadOutlined />,
      onClick: () => {
        fileInputRef.current?.click();
      },
    },
  ];

  const handleImageSuccess = async (
    imageUrl: string,
    newConversationId?: string
  ) => {
    // Trigger insert content tip when image is generated/inserted
    if (onInsertContent) {
      onInsertContent();
    }
    // Create assistant message with image
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: `Generated image`,
      images: [imageUrl],
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Update conversation ID if it's a new conversation
    if (newConversationId && !currentConversationId) {
      setCurrentConversationId(newConversationId);
      if (onConversationChange) {
        onConversationChange(newConversationId);
      }
    } else if (currentConversationId) {
      // Reload conversation to get updated messages
      loadConversation(currentConversationId);
    }
  };


  // Handle edit message
  const handleEditMessage = (index: number) => {
    const msg = messages[index];
    if (msg.role !== "user") return;

    setEditingMessageIndex(index);
    setEditingMessageContent(msg.content || "");
    setEditingMessageImages(msg.images ? [...msg.images] : []);
    setEditingMessageFiles(msg.files ? [...msg.files] : []);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessageIndex(null);
    setEditingMessageContent("");
    setEditingMessageImages([]);
    setEditingMessageFiles([]);
  };

  // Handle save edit
  const handleSaveEdit = async (index: number) => {
    if (!currentConversationId) {
      message.error("Conversation ID is required for editing messages");
      return;
    }

    const hasContent =
      editingMessageContent.trim() ||
      editingMessageImages.length > 0 ||
      editingMessageFiles.length > 0;
    if (!hasContent) {
      message.error("Message content is required");
      return;
    }

    setLoading(true);

    try {
      const response = await chatService.sendMessage(
        editingMessageContent.trim() ||
          (editingMessageImages.length > 0 || editingMessageFiles.length > 0
            ? `Uploaded ${editingMessageImages.length > 0 ? `${editingMessageImages.length} image(s)` : ""}${editingMessageImages.length > 0 && editingMessageFiles.length > 0 ? " and " : ""}${editingMessageFiles.length > 0 ? `${editingMessageFiles.length} file(s)` : ""}`
            : ""),
        currentConversationId,
        editingMessageImages.length > 0 ? editingMessageImages : undefined,
        editingMessageFiles.length > 0 ? editingMessageFiles : undefined,
        index
      );

      if (response.success && response.response) {
        // Remove all messages after the edited message index
        setMessages((prev) => {
          const newMessages = prev.slice(0, index + 1);
          // Update the edited message
          newMessages[index] = {
            role: "user",
            content:
              editingMessageContent.trim() ||
              (editingMessageImages.length > 0 || editingMessageFiles.length > 0
                ? `Uploaded ${editingMessageImages.length > 0 ? `${editingMessageImages.length} image(s)` : ""}${editingMessageImages.length > 0 && editingMessageFiles.length > 0 ? " and " : ""}${editingMessageFiles.length > 0 ? `${editingMessageFiles.length} file(s)` : ""}`
                : ""),
            images:
              editingMessageImages.length > 0
                ? [...editingMessageImages]
                : undefined,
            files:
              editingMessageFiles.length > 0
                ? editingMessageFiles.map((f) => ({
                    url: f.url,
                    name: f.name,
                    type: f.type,
                    size: f.size,
                  }))
                : undefined,
            timestamp: new Date(),
          };
          // Add new assistant response
          newMessages.push({
            role: "assistant",
            content: response.response!,
            timestamp: new Date(),
          });
          return newMessages;
        });

        // Reset edit state
        handleCancelEdit();
      } else {
        message.error(response.message || "Failed to update message");
      }
    } catch {
      message.error("An error occurred while updating message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Messages display area */}
      {messages.length > 0 && (
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.messageItem} ${
                msg.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }`}
            >
              <div className={styles.messageContent}>
                {editingMessageIndex === index ? (
                  // Edit mode
                  <div className={styles.editMessageContainer}>
                    <TextArea
                      value={editingMessageContent}
                      onChange={(e) => setEditingMessageContent(e.target.value)}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      placeholder="Edit your message..."
                      disabled={loading}
                    />
                    {editingMessageImages.length > 0 && (
                      <div className={styles.imagePreviewContainer}>
                        {editingMessageImages.map((imgUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className={styles.imagePreviewItem}
                          >
                            <img
                              src={getImageUrl(imgUrl)}
                              alt={`Preview ${imgIndex + 1}`}
                              className={styles.previewImage}
                            />
                            <Button
                              type="text"
                              shape="circle"
                              icon={<CloseOutlined />}
                              onClick={() =>
                                setEditingMessageImages((prev) =>
                                  prev.filter((_, i) => i !== imgIndex)
                                )
                              }
                              className={styles.removeImageButton}
                              disabled={loading}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {editingMessageFiles.length > 0 && (
                      <div className={styles.filePreviewContainer}>
                        {editingMessageFiles.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className={styles.filePreviewItem}
                          >
                            {getFileIcon(file.type)}
                            <div className={styles.filePreviewInfo}>
                              <div className={styles.filePreviewName}>
                                {file.name}
                              </div>
                              <div className={styles.filePreviewSize}>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                            <Button
                              type="text"
                              shape="circle"
                              icon={<CloseOutlined />}
                              onClick={() =>
                                setEditingMessageFiles((prev) =>
                                  prev.filter((_, i) => i !== fileIndex)
                                )
                              }
                              className={styles.removeFileButton}
                              disabled={loading}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={styles.editActions}>
                      <Button onClick={handleCancelEdit} disabled={loading}>
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => handleSaveEdit(index)}
                        loading={loading}
                        icon={<ArrowUpOutlined />}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal display mode
                  <>
                    {msg.images && msg.images.length > 0 && (
                      <div className={styles.messageImages}>
                        {msg.images.map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={getImageUrl(img)}
                            alt={msg.role === "user" ? "Uploaded" : "Generated"}
                            className={styles.generatedImage}
                          />
                        ))}
                      </div>
                    )}
                    {msg.files && msg.files.length > 0 && (
                      <div className={styles.messageFiles}>
                        {msg.files.map((file, fileIndex) => (
                          <a
                            key={fileIndex}
                            href={getImageUrl(file.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.fileLink}
                          >
                            <div className={styles.fileItem}>
                              {getFileIcon(file.type)}
                              <div className={styles.fileInfo}>
                                <div className={styles.fileName}>
                                  {file.name}
                                </div>
                                <div className={styles.fileSize}>
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                    {msg.content && (
                      <div className={styles.messageTextContainer}>
                      <div className={styles.markdownContent}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    {msg.role === "user" && (
                      <div className={styles.messageActions}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditMessage(index)}
                          disabled={loading || editingMessageIndex !== null}
                        >
                          Edit
                        </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === "assistant" &&
                      index === messages.length - 1 &&
                      (hasContentPlanIntent(lastUserMessage) || hasCalendarInHistory()) && (
                        <div className={styles.actionButtons}>
                          <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={handleOpenContentPlanModal}
                            size="small"
                          >
                            Send to Calendar
                          </Button>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.messageItem} ${styles.assistantMessage}`}>
              <div className={styles.messageContent}>
                <Spin size="small" />
                <span className={styles.thinkingText}>Thinking...</span>
              </div>
            </div>
          )}
          {/* Scroll anchor for auto-scrolling */}
          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>
      )}

      {/* Input area */}
      <Card 
        className={`${styles.chatCard} ${messages.length > 0 ? styles.chatCardFixed : ''}`} 
        styles={{ body: { padding: 24 } }}
      >
        {/* Image preview */}
        {uploadedImages.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {uploadedImages.map((imgUrl, index) => (
              <div key={index} className={styles.imagePreviewItem}>
                <img
                  src={getImageUrl(imgUrl)}
                  alt={`Preview ${index + 1}`}
                  className={styles.previewImage}
                />
                <Button
                  type="text"
                  shape="circle"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveImage(index)}
                  className={styles.removeImageButton}
                  disabled={uploading}
                />
              </div>
            ))}
          </div>
        )}

        {/* File preview */}
        {uploadedFiles.length > 0 && (
          <div className={styles.filePreviewContainer}>
            {uploadedFiles.map((file, index) => (
              <div key={index} className={styles.filePreviewItem}>
                {getFileIcon(file.type)}
                <div className={styles.filePreviewInfo}>
                  <div className={styles.filePreviewName}>{file.name}</div>
                  <div className={styles.filePreviewSize}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <Button
                  type="text"
                  shape="circle"
                  icon={<CloseOutlined />}
                  onClick={() => handleRemoveFile(index)}
                  className={styles.removeFileButton}
                  disabled={uploading}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="topLeft"
          >
            <Tooltip title="More options">
              <Button
                shape="circle"
                icon={<PlusOutlined />}
                disabled={loading || uploading}
                className={styles.plusButton}
              />
            </Tooltip>
          </Dropdown>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/rtf,text/csv"
            multiple
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />
          <div
            className={`${styles.inputWrapper} ${isDragOver ? styles.dragOver : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <TextArea
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder={
                isDragOver ? "Drop files here" : "What would you like to know?"
              }
              value={inputMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={loading || uploading}
            />
          </div>
          <Tooltip title="Send message">
            <Button
              type="primary"
              shape="circle"
              disabled={isEmpty || loading || uploading}
              icon={
                loading || uploading ? (
                  <Spin size="small" />
                ) : (
                  <ArrowUpOutlined />
                )
              }
              onClick={handleSend}
              loading={loading || uploading}
              className={styles.sendButton}
            />
          </Tooltip>
        </div>
      </Card>

      {/* Image Generation Modal */}
      <ImageGenerationModal
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        onSuccess={handleImageSuccess}
        conversationId={currentConversationId}
      />

      {/* Content Plan Modal */}
      <ContentPlanModal
        open={contentPlanModalOpen}
        goal={getConversationGoal()}
        onClose={() => setContentPlanModalOpen(false)}
        onSuccess={handleContentPlanSuccess}
      />
    </div>
  );
}

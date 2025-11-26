import {
  AppleFilled,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  GoogleOutlined,
  LeftOutlined,
  MobileOutlined,
  WindowsFilled,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Input,
  message,
  Modal,
  Space,
  Typography,
} from "antd";
import { useState } from "react";
import { authService, User } from "../services/authService";
import styles from "./AuthModal.module.css";

interface AuthModalProps {
  open: boolean;
  onCancel: () => void;
  onLoginSuccess: (user: User) => void;
}

export default function AuthModal({
  open,
  onCancel,
  onLoginSuccess,
}: AuthModalProps) {
  const [step, setStep] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailContinue = () => {
    if (email.trim()) {
      setStep("signup");
    }
  };

  const handleBackToLogin = () => {
    setStep("login");
    setPassword("");
  };

  const handleSignupContinue = async () => {
    if (!email || !password) return;

    setLoading(true);
    try {
      // 1. Try to register
      let response = await authService.register(email, password);

      // 2. If user exists, try to login with the same credentials
      if (!response.success && response.message === "User already exists") {
        response = await authService.login(email, password);
      }

      if (response.success && response.user) {
        message.success("Successfully logged in!");
        onLoginSuccess(response.user);
        onCancel();
        // Reset form
        setStep("login");
        setEmail("");
        setPassword("");
      } else {
        message.error(response.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Signup error", error);
      message.error("An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: "google" | "microsoft" | "apple" | "phone"
  ) => {
    try {
      // Use client-side direct redirect using Vite env variables (SPA mode)
      // For local development, set the Vite env variables in a `.env.local` file based on `.env.example`.
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const googleRedirect =
        import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`;
      const msClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const msRedirect =
        import.meta.env.VITE_MICROSOFT_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`;
      const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
      const appleRedirect =
        import.meta.env.VITE_APPLE_REDIRECT_URI ||
        `${window.location.origin}/auth/callback`;
      const phoneUrl =
        import.meta.env.VITE_PHONE_DEMO_URL || "/auth/phone-demo";

      // Debug: Log environment variables status
      console.log("OAuth Config:", {
        provider,
        googleClientId: googleClientId ? "✓ configured" : "✗ missing",
        msClientId: msClientId ? "✓ configured" : "✗ missing",
        appleClientId: appleClientId ? "✓ configured" : "✗ missing",
      });

      // Handle phone login separately - use React Router navigation
      if (provider === "phone") {
        // Use window.location for full page navigation to phone demo
        window.location.href = phoneUrl;
        return;
      }

      let url = "";
      if (provider === "google") {
        if (!googleClientId) {
          message.error(
            "Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env.local file."
          );
          return;
        }
        const state = Math.random().toString(36).substring(2);
        const params = new URLSearchParams({
          client_id: String(googleClientId),
          response_type: "code",
          scope: "openid email profile",
          redirect_uri: String(googleRedirect),
          state,
          prompt: "consent",
        });
        url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      } else if (provider === "microsoft") {
        if (!msClientId) {
          message.error(
            "Microsoft Client ID not configured. Please add VITE_MICROSOFT_CLIENT_ID to your .env.local file."
          );
          return;
        }
        const state = Math.random().toString(36).substring(2);
        const params = new URLSearchParams({
          client_id: String(msClientId),
          response_type: "code",
          redirect_uri: String(msRedirect),
          response_mode: "query",
          scope: "openid email profile",
          state,
        });
        url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
      } else if (provider === "apple") {
        if (!appleClientId) {
          message.error(
            "Apple Client ID not configured. Please add VITE_APPLE_CLIENT_ID to your .env.local file."
          );
          return;
        }
        const params = new URLSearchParams({
          client_id: String(appleClientId),
          redirect_uri: String(appleRedirect),
          response_type: "code",
          scope: "name email",
          response_mode: "form_post",
        });
        url = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
      }

      if (url) {
        console.log("Redirecting to:", url);
        window.location.href = url;
      }
    } catch (err) {
      console.error("Social login error", err);
      message.error("Failed to start social login");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        onCancel();
        setStep("login");
        setEmail("");
        setPassword("");
      }}
      footer={null}
      centered
      width={step === "signup" ? 480 : 400}
      className={styles.authModal}
      styles={{ mask: { backgroundColor: "rgba(0, 0, 0, 0.05)" } }}
      closable={step === "login"}
    >
      {step === "login" ? (
        <div className={styles.container}>
          <Typography.Title level={2} className={styles.title}>
            Log in or sign up
          </Typography.Title>
          <Typography.Text className={styles.subtitle}>
            You'll get smarter responses and can upload files, images, and more.
          </Typography.Text>

          <Space
            direction="vertical"
            size={12}
            className={styles.socialButtons}
          >
            <Button
              block
              size="large"
              icon={<GoogleOutlined />}
              className={styles.socialBtn}
              onClick={() => handleSocialLogin("google")}
            >
              Continue with Google
            </Button>
            <Button
              block
              size="large"
              icon={<AppleFilled />}
              className={styles.socialBtn}
              onClick={() => handleSocialLogin("apple")}
            >
              Continue with Apple
            </Button>
            <Button
              block
              size="large"
              icon={<WindowsFilled />}
              className={styles.socialBtn}
              onClick={() => handleSocialLogin("microsoft")}
            >
              Continue with Microsoft
            </Button>
            <Button
              block
              size="large"
              icon={<MobileOutlined />}
              className={styles.socialBtn}
              onClick={() => handleSocialLogin("phone")}
            >
              Continue with phone
            </Button>
          </Space>

          <Divider className={styles.divider}>OR</Divider>

          <div className={styles.emailSection}>
            <Input
              size="large"
              placeholder="Email address"
              className={styles.emailInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleEmailContinue}
            />
            <Button
              type="primary"
              block
              size="large"
              className={styles.continueBtn}
              onClick={handleEmailContinue}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.signupContainer}>
          <div className={styles.logoContainer}>
            <Button
              type="text"
              icon={<LeftOutlined />}
              className={styles.backButton}
              onClick={handleBackToLogin}
            />
          </div>
          <div className={styles.signupContent}>
            <Typography.Title level={2} className={styles.signupTitle}>
              Create your account
            </Typography.Title>
            <Typography.Text className={styles.signupSubtitle}>
              Set your password for MELO to continue.
            </Typography.Text>

            <div className={styles.signupForm}>
              <div className={styles.emailFieldWrapper}>
                <Typography.Text className={styles.fieldLabel}>
                  Email address
                </Typography.Text>
                <div className={styles.emailFieldWithEdit}>
                  <Input
                    size="large"
                    value={email}
                    readOnly
                    className={styles.emailInputReadonly}
                  />
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    className={styles.editButton}
                    onClick={handleBackToLogin}
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className={styles.passwordFieldWrapper}>
                <Typography.Text className={styles.fieldLabel}>
                  Password
                </Typography.Text>
                <Input
                  size="large"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onPressEnter={handleSignupContinue}
                  className={styles.passwordInput}
                  suffix={
                    <Button
                      type="text"
                      icon={
                        showPassword ? (
                          <EyeOutlined />
                        ) : (
                          <EyeInvisibleOutlined />
                        )
                      }
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButton}
                    />
                  }
                />
              </div>

              <Button
                type="primary"
                block
                size="large"
                className={styles.continueBtn}
                onClick={handleSignupContinue}
                disabled={!password.trim()}
                loading={loading}
              >
                Continue
              </Button>
            </div>

            <div className={styles.footerLinks}>
              <Button type="link" className={styles.footerLink}>
                Terms of Use
              </Button>
              <span className={styles.footerDivider}>|</span>
              <Button type="link" className={styles.footerLink}>
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

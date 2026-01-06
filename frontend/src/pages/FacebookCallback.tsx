import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import { getFacebookStatus } from "../services/socialService";

export default function FacebookCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorReason = searchParams.get("error_reason");
      const errorDescription = searchParams.get("error_description");

      console.log("[Facebook Callback] Processing:", {
        code: code ? code.substring(0, 20) + "..." : null,
        state: state ? state.substring(0, 20) + "..." : null,
        error,
        errorReason,
        errorDescription,
      });

      // Handle error from Facebook
      if (error) {
        console.error("[Facebook Callback] Error from Facebook:", {
          error,
          errorReason,
          errorDescription,
        });

        let errorMessage = "Failed to connect Facebook account.";
        if (errorReason === "user_denied") {
          errorMessage = "Facebook connection was cancelled.";
        } else if (errorDescription) {
          errorMessage = `Facebook connection failed: ${errorDescription}`;
        }

        message.error(errorMessage);
        navigate("/socialdashboard?facebook=error", { replace: true });
        return;
      }

      // If no code, might be a redirect from backend
      if (!code) {
        console.log(
          "[Facebook Callback] No code parameter, checking if already connected..."
        );

        // Check if connection was successful by checking status
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const status = await getFacebookStatus(token);
            if (status.connected) {
              console.log(
                "[Facebook Callback] Facebook is already connected, redirecting..."
              );
              message.success("Successfully connected Facebook!");
              navigate("/socialdashboard?facebook=connected", { replace: true });
              return;
            }
          } catch (error) {
            console.error(
              "[Facebook Callback] Failed to check status:",
              error
            );
          }
        }

        // If no code and not connected, redirect to dashboard
        console.log(
          "[Facebook Callback] No code and not connected, redirecting to dashboard"
        );
        navigate("/socialdashboard", { replace: true });
        return;
      }

      // If we have code, call backend to process it
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("[Facebook Callback] No JWT token found");
        message.error("Please log in first");
        navigate("/", { replace: true });
        return;
      }

      // Call backend to process the OAuth callback
      const API_URL = import.meta.env.VITE_API_URL || "";
      try {
        const response = await fetch(
          `${API_URL}/api/facebook/callback?code=${encodeURIComponent(code!)}&state=${encodeURIComponent(state!)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: "Unknown error",
          }));
          console.error("[Facebook Callback] Backend error:", errorData);

          // Skip showing error for "Invalid state" (common during OAuth flow)
          if (
            errorData.message === "Invalid state" ||
            errorData.message?.includes("Invalid state")
          ) {
            console.log(
              "[Facebook Callback] Invalid state - silently redirecting"
            );
            setTimeout(() => {
              navigate("/socialdashboard", { replace: true });
            }, 500);
            return;
          }

          message.error(
            errorData.message || "Failed to process Facebook connection"
          );
          navigate("/socialdashboard?facebook=error", { replace: true });
          return;
        }

        const data = await response.json();
        console.log("[Facebook Callback] Success:", data);

        if (data.success) {
          message.success(data.message || "Successfully connected Facebook!");
          const redirectUrl =
            data.redirectUrl || "/socialdashboard?facebook=connected";
          setTimeout(() => {
            navigate(
              redirectUrl.replace(window.location.origin, "").replace(
                /^https?:\/\/[^/]+/,
                ""
              ),
              { replace: true }
            );
          }, 1500);
        } else {
          message.error(data.message || "Connection failed");
          navigate("/socialdashboard", { replace: true });
        }
      } catch (error: any) {
        console.error("[Facebook Callback] Exception:", error);
        message.error(error.message || "An unexpected error occurred");
        navigate("/socialdashboard", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
      }}
    >
      <Spin size="large" />
      <p>Processing Facebook connection...</p>
    </div>
  );
}


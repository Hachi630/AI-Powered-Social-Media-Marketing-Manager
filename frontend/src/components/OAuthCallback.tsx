import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService, User } from "../services/authService";
import { message } from "antd";

interface OAuthCallbackProps {
  onLoginSuccess: (user: User) => void;
}

export default function OAuthCallback({ onLoginSuccess }: OAuthCallbackProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      // Store token and fetch the user
      localStorage.setItem("token", token);
      (async () => {
        const user = await authService.getCurrentUser();
        if (user) {
          onLoginSuccess(user);
          navigate("/");
        } else {
          // maybe token expired/invalid
          localStorage.removeItem("token");
          navigate("/");
        }
      })();
    } else if (error) {
      // show antd error message and navigate back
      console.error("OAuth error:", error);
      message.error(`OAuth failed: ${error}`);
      navigate("/");
    } else {
      // No token or error: redirect to home
      navigate("/");
    }
  }, [navigate, onLoginSuccess, searchParams]);

  return <div>Logging you in...</div>;
}

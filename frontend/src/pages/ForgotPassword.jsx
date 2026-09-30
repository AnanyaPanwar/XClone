import { useState } from "react";
import api from "../api/axios";
import "./Login.css";

function ForgotPassword({
  onLogin,
  onResetPassword,
}) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("password/forgot/", {
        username,
      });

      onResetPassword(username);

      setUsername("");;

    } catch (error) {
      console.error(
        "Forgot password error:",
        error.response?.data
      );

      setError(
        error.response?.data?.detail ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <h1>Forgot your password?</h1>

        <p>
          Enter your XClone username to receive a
          password reset code.
        </p>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="forgot-username">
              Username
            </label>

            <input
              id="forgot-username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="auth-primary-button"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send reset instructions"}
          </button>
        </form>

        <p className="register-text">
          Remember your password?{" "}
          <span
            type="button"
            className="register-link"
            onClick={onLogin}
          >
            Sign in
          </span>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;
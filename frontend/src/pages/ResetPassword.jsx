  import { useState } from "react";
  import api from "../api/axios";
  import "./Login.css";

  function ResetPassword({ username, onLogin, onResetSuccess }) {
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
      useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      try {
        setLoading(true);

        const response = await api.post(
          "password/reset/",
          {
            username,
            code,
            new_password: newPassword,
          }
        );

        setSuccess(
          response.data.detail ||
            "Password reset successfully."
        );

        setCode("");
        setNewPassword("");
        setConfirmPassword("");


        onResetSuccess(
          "Password changed successfully. You can now sign in."
        );
        // Return to the login screen
        // after a successful password reset.
        
      } catch (error) {
        console.error(
          "Password reset error:",
          error.response?.data
        );

        const detail =
          error.response?.data?.detail;

        if (Array.isArray(detail)) {
          setError(detail.join(" "));
        } else {
          setError(
            detail ||
              "Password reset failed. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="auth-page">
        <div className="auth-container">

          <h1>Reset your password</h1>

          <p>
            Enter the reset code sent to your email
            and choose a new password.
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

            {success && (
              <div className="auth-success">
                {success}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-code">
                Reset code
              </label>

              <input
                id="reset-code"
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value)
                }
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">
                New password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-primary-button"
              disabled={loading}
            >
              {loading
                ? "Resetting..."
                : "Reset password"}
            </button>
          </form>

          <p className="register-text">
            Remember your password?{" "}
            <span
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

  export default ResetPassword;
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login({
  onRegister,
  onForgotPassword,
  onLoginSuccess,
  success,
}) {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(username, password);
      onLoginSuccess();
    } catch (error) {
      setError(
        "Wrong username or password. Please try again."
      );
    } finally{
      setSubmitting(false)
    }
};

  return (
    <div className="auth-page">
      <div className="auth-container">

        <h1>Sign in to XClone</h1>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="off"
              autoFocus
              required
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="new-password"
              required
            />
          </div>

          <p className="forgot-password-text">
            <span
              className="forgot-password-link"
              onClick={onForgotPassword}
            >
              Forgot password?
            </span>
          </p>

          <button
            type="submit"
            className="auth-primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <span
            className="register-link"
            onClick={onRegister}
          >
            Register
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;
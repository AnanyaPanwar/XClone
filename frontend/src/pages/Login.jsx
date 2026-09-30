import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login({
  onRegister,
  onForgotPassword,
}) {
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(username, password);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Login failed. Please check your username and password."
      );
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
              autoComplete="username"
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
              autoComplete="current-password"
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
            disabled={loading}
          >
            {loading
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
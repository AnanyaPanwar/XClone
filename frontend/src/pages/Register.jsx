import { useState } from "react";
import api from "../api/axios";
import "./Login.css";

function Register({
  onLogin,
  onRegisterSuccess,
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (password1 !== password2) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await api.post("auth/register/", {
        username,
        email,
        password: password1,
        password2,
      });

      setUsername("");
      setEmail("");
      setPassword1("");
      setPassword2("");

      onRegisterSuccess("Account created successfully. You can now sign in.")

    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data
      );

      const data = error.response?.data;

      if (typeof data === "object") {
        const messages = Object.values(data)
          .flat()
          .join(" ");

        setError(
          messages ||
            "Registration failed. Please check your details."
        );
      } else {
        setError(
          "Registration failed. Please check your details."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <h1>Create your XClone account</h1>

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
            <label htmlFor="register-username">
              Username
            </label>

            <input
              id="register-username"
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

          <div className="form-group">
            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password1">
              Password
            </label>

            <input
              id="register-password1"
              type="password"
              value={password1}
              onChange={(event) =>
                setPassword1(event.target.value)
              }
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password2">
              Confirm password
            </label>

            <input
              id="register-password2"
              type="password"
              value={password2}
              onChange={(event) =>
                setPassword2(event.target.value)
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
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="register-text">
          Already have an account?{" "}
          <span
            className="register-link"
            onClick={()=>onLogin()}
          >
            <u><b>Sign in</b></u>
          </span>
        </p>

      </div>
    </div>
  );
}

export default Register;
import "./Login.css";

function Logout({ onLogin, onHome }) {
  return (
    <div className="auth-page">
      <div className="auth-container logout-container">

        <h1>You've been logged out</h1>

        <p className="logout-message">
          See you next time.
        </p>

        <div className="logout-buttons">

          <button
            className="auth-primary-button"
            onClick={onLogin}
          >
            Sign in again
          </button>

          <button
            className="logout-home-button"
            onClick={onHome}
          >
            Back to home
          </button>

        </div>

      </div>
    </div>
  );
}

export default Logout;
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { useAuth } from "./context/AuthContext";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  const { user, loading, logout } = useAuth();

  const [showRegister, setShowRegister] =
  useState(false);

  const [showForgotPassword, setShowForgotPassword] =
  useState(false);

  const [resetUsername, setResetUsername] =
  useState("");

  const [page, setPage] = useState(
    window.location.pathname === "/profile"
      ? "profile"
      : "home"
  );

  const [profileUsername, setProfileUsername] =
    useState(null);

  const [darkMode, setDarkMode] =
    useState(true);

  const [showLogoutPage, setShowLogoutPage] =
    useState(false);

  const navigateToPage = (
    nextPage,
    username = null
  ) => {
    setPage(nextPage);
    setProfileUsername(username);

    if (nextPage === "profile") {
      window.history.pushState(
        {
          page: "profile",
          username: username,
        },
        "",
        "/profile"
      );
    } else {
      window.history.pushState(
        {
          page: "home",
        },
        "",
        "/"
      );
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;

      if (state?.page === "profile") {
        setPage("profile");
        setProfileUsername(
          state.username || null
        );
      } else {
        setPage("home");
        setProfileUsername(null);
      }
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!user && showLogoutPage) {
    return (
      <Logout
        onLogin={() => {
          setShowLogoutPage(false);
        }}
        onHome={() => {
          setShowLogoutPage(false);
        }}
      />
    );
  }

  if (!user && showForgotPassword) {
    return (
      <ForgotPassword
        onLogin={() => {
          setShowForgotPassword(false);
        }}
        onResetPassword={(username) => {
          setResetUsername(username);
          setShowForgotPassword(false);
        }}
      />
    );
  }

  if (!user && resetUsername) {
    return (
      <ResetPassword
        username={resetUsername}
        onLogin={() => {
          setResetUsername("");
        }}
      />
    );
  }

  if (!user && showRegister) {
    return (
      <Register
        onLogin={() => {
          setShowRegister(false);
        }}
      />
    );
  }

  if (!user) {
    return (
      <Login
        onRegister={() => {
          setShowRegister(true);
        }}
        onForgotPassword={() => {
          setShowForgotPassword(true);
        }}
      />
    );
  }


  const handleLogout = () => {
    logout();

    setPage("home");
    setProfileUsername(null);
    setShowLogoutPage(true);
  };

  return (
    <div
      className={
        darkMode
          ? "app dark-mode"
          : "app light-mode"
      }
    >
      {page === "home" && (
        <Home
          setPage={navigateToPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
          setProfileUsername={
            setProfileUsername
          }
        />
      )}

      {page === "profile" && (
        <Profile
          setPage={navigateToPage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
          username={profileUsername}
        />
      )}
    </div>
  );
}

export default App;
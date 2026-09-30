import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOGIN
  const login = async (username, password) => {
    try {

      const response = await api.post(
        "auth/login/",
        {
          username,
          password,
        }
      );

      const accessToken =
        response.data.access;

      const refreshToken =
        response.data.refresh;

      localStorage.setItem(
        "access",
        accessToken
      );

      localStorage.setItem(
        "refresh",
        refreshToken
      );

      // Get logged-in user's profile
      const profileResponse =
        await api.get("profile/me/");

      setUser(profileResponse.data);

      return true;
    } catch (error) {
      // If login fails, make sure old tokens
      // don't leave the app in a broken state.
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      setUser(null);

      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    setUser(null);
  };

  // CHECK LOGIN WHEN APP STARTS
  useEffect(() => {
    const loadUser = async () => {
      const accessToken =
        localStorage.getItem("access");

      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response =
          await api.get("profile/me/");

        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  Platform,
} from "react";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const AuthContext = createContext<AuthContextType | undefined>({});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const authAxios = axios.create({
    baseURL: process.env.API_URL,
    withCredentials: Platform.OS === "web",
  });

  authAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 (Unauthorized) and we haven't retried yet
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Web: The browser sends the HttpOnly cookie automatically
          // Native: You might need to send the refreshToken from SecureStore
          const { data } = await axios.post(
            `${process.env.API_URL}/refresh-token`,
          );

          await SecureStore.setItemAsync("userToken", data.token);
          authAxios.defaults.headers.common["Authorization"] =
            `Bearer ${data.token}`;

          return authAxios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, log the user out
          logout();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    },
  );

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          // OPTIONAL: Verify token validity with your backend here
          // const userData = await api.getUser(token);
          // setUser({ token, ...userData });

          // For now, we simulate restoring a user session
          setUser({ token, id: "1", email: "restored@example.com" });
        }
      } catch (e) {
        console.error("Failed to load token", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const login = async (token: string, userData: Omit<User, "token">) => {
    try {
      // 1. Store token securely
      await SecureStore.setItemAsync(TOKEN_KEY, token);

      // 2. Update state
      setUser({ token, ...userData });
    } catch (e) {
      console.error("Sign in failed", e);
    }
  };

  const logout = async () => {
    try {
      // 1. Remove token from storage
      await SecureStore.deleteItemAsync(TOKEN_KEY);

      // 2. Reset state
      setUser(null);
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, userToken, isLoading, authAxios }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const TOKEN_KEY = "userToken";

interface User {
  id: string;
  email: string;
  token: string;
}

interface AuthContextType {
  login: (token: string, userData: Omit<User, "token">) => Promise<void>;
  logout: () => Promise<void>;
  userToken: string | null;
  user: User | null;
  isLoading: boolean;
  authAxios: ReturnType<typeof axios.create>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
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

          await SecureStore.setItemAsync(TOKEN_KEY, data.token);
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
          setUserToken(token);
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
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      setUserToken(token);
      setUser({ token, ...userData });
    } catch (e) {
      console.error("Sign in failed", e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUserToken(null);
      setUser(null);
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ login, logout, userToken, user, isLoading, authAxios }}
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

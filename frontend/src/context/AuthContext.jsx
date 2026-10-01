import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [fbAccounts, setFbAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(currentUser);

  const applySession = useCallback((data) => {
    setCurrentUser(data?.user ?? null);
    setFbAccounts(data?.fbAccounts ?? []);
  }, []);

  // Restore the session on mount
  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((data) => {
        if (active) applySession(data);
      })
      .catch(() => {
        if (active) applySession({ user: null, fbAccounts: [] });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applySession]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    applySession(data);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    applySession(data);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      applySession({ user: null, fbAccounts: [] });
    }
  };

  const refreshFbAccounts = useCallback(async () => {
    const data = await authApi.me();
    applySession(data);
    return data.fbAccounts ?? [];
  }, [applySession]);

  const updateProfile = useCallback((updatedFields) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        fbAccounts,
        isLoading,
        login,
        register,
        logout,
        refreshFbAccounts,
        updateProfile,
      }}
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
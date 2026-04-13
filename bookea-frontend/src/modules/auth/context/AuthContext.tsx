import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// 1. On définit la structure de l'utilisateur
interface UserProfile {
  username: string | null;
  avatarUrl: string | null;
  role: string | null; // Crucial pour l'admin
}

// 2. Mise à jour de l'interface du contexte
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null; // Regroupe username, avatar et role
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  checkAuth: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Non connecté");

      const profile = await res.json();

      setIsAuthenticated(true);
      // On stocke tout dans l'objet user
      setUser({
        username: profile.username ?? profile.firstName ?? "Utilisateur",
        avatarUrl: profile.avatarUrl ?? null,
        role: Array.isArray(profile.roles) ? profile.roles.join(", ") : "", // On récupère le rôle du backend
      });
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, checkAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

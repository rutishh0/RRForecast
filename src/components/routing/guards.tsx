import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { type ReactNode } from "react";
import { useAppData } from "@/src/context/AppDataContext";
import LoginScreen from "@/src/components/auth/LoginScreen";

export function safeFromPath(from: string | null): string {
  // Only allow internal paths (starts with `/`, not `//` to prevent open-redirect)
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/my-dashboard";
  return from;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { currentUser } = useAppData();
  const location = useLocation();
  if (!currentUser) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { currentUser } = useAppData();
  if (currentUser?.role !== "admin") return <Navigate to="/my-dashboard" replace />;
  return <>{children}</>;
}

export function LoginRoute() {
  const { currentUser, login } = useAppData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = safeFromPath(searchParams.get("from"));

  if (currentUser) return <Navigate to={from} replace />;

  return (
    <LoginScreen
      onLogin={async (user) => {
        await login(user);
        navigate(from, { replace: true });
      }}
    />
  );
}

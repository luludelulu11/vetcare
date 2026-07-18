import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Home route for each role. Used after login and when a user
 * hits a route their role doesn't allow.
 * CLIENT points to the future client portal home.
 */
export function roleHome(role) {
  switch (role) {
    case "ADMIN":
    case "DOCTOR":
    case "STAFF":
      // All staff roles land on the full console (sidebar nav, theme toggle,
      // logout). Menu.jsx filters what each role sees. STAFF previously landed
      // on the bare /agenda page, which has no navigation/chrome and left the
      // secretary unable to reach clients, pets, or clinical history.
      return "/menu";
    case "CLIENT":
      return "/inicio";
    default:
      return "/";
  }
}

/**
 * Route guard. Replaces ProtectedAdminRoute and generalizes it:
 *
 *   <RequireRole roles={["ADMIN", "DOCTOR"]}>
 *     <Consultas />
 *   </RequireRole>
 *
 * - Not authenticated → login.
 * - Authenticated but role not allowed → that role's home.
 * - `roles` omitted → any authenticated user.
 */
export default function RequireRole({ roles, children }) {
  const { isAuthenticated, role, logout } = useAuth();

  if (!isAuthenticated) {
    logout();
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return children;
}

import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./screens/Login";
import { Dashboard } from "./screens/Dashboard";
import { Requirements } from "./screens/Requirements";
import { RequirementDetails } from "./screens/RequirementDetails";
import { Projects } from "./screens/Projects";
import { ProjectDetails } from "./screens/ProjectDetails";
import { Analytics } from "./screens/Analytics";
import { AutorizarUsuarios } from "./screens/AutorizarUsuarios";
import { Pagamentos } from "./screens/Pagamentos";
import { Settings } from "./screens/Settings";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "requirements", Component: Requirements },
      { path: "requirements/:id", Component: RequirementDetails },
      { path: "projects", Component: Projects },
      { path: "projects/:id", Component: ProjectDetails },
      { path: "analytics", Component: Analytics },
      { path: "autorizar-usuarios", Component: AutorizarUsuarios },
      { path: "pagamentos", Component: Pagamentos },
      { path: "settings", Component: Settings },
    ],
  },
]);


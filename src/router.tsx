import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { VerificacionesPage } from "./pages/admin/VerificacionesPage";
import { PortalPage } from "./pages/PortalPage";
import { UploadPage } from "./pages/UploadPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        // Redirect "/" → "/admin"
        index: true,
        element: <Navigate to="/admin" replace />,
      },
      {
        path: "portal",
        element: <PortalPage />,
      },
      {
        path: "upload/:token",
        element: <UploadPage />,
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: "verificaciones",
            element: <VerificacionesPage />,
          },
        ],
      },
    ],
  },
]);

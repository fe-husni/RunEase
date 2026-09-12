import { useEffect, lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { useUserStore } from "@/stores/userStore";

const LandingPage = lazy(() => import("@/pages/landing"));

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="border-4 border-bauhaus-black bg-white p-8 shadow-bauhaus-lg">
        <h1 className="font-black uppercase tracking-tighter text-2xl">{title}</h1>
        <p className="mt-2 font-medium">Segera hadir — Bauhaus</p>
      </div>
    </div>
  );
}

/** Bug 6: user login (non-anonim) langsung ke /timer saat buka `/`. Guest/anonim tetap lihat landing. */
function LandingOrRedirect() {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bauhaus-gray">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-bauhaus-black border-t-transparent" />
      </div>
    );
  }
  if (user && !user.isAnonymous) {
    return <Navigate to="/timer" replace />;
  }
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bauhaus-gray">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-bauhaus-black border-t-transparent" />
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingOrRedirect />,
  },
  {
    element: (
      <AppShell>
        <Outlet />
      </AppShell>
    ),
    children: [
      { path: "timer", lazy: async () => ({ Component: (await import("@/pages/timer")).default }) },
      { path: "history", lazy: async () => ({ Component: (await import("@/pages/history")).default }) },
      { path: "stats", lazy: async () => ({ Component: (await import("@/pages/stats")).default }) },
      { path: "settings", lazy: async () => ({ Component: (await import("@/pages/settings")).default }) },
      { path: "login", lazy: async () => ({ Component: (await import("@/pages/login")).default }) },
      { path: "*", element: <Placeholder title="404" /> },
    ],
  },
]);

export default function App() {
  useEffect(() => {
    const unsub = useUserStore.getState().init();
    return () => unsub();
  }, []);

  return (
    <ConfirmDialogProvider>
      <RouterProvider router={router} />
    </ConfirmDialogProvider>
  );
}

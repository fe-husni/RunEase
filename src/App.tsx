import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ConfirmDialogProvider } from "@/components/ui/confirm-dialog";
import { useUserStore } from "@/stores/userStore";

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

const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => ({ Component: (await import("@/pages/landing")).default }),
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

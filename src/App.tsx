import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSpinner } from "@/components/ui/PageSpinner";

const queryClient = new QueryClient();
const Index = lazy(() => import("./pages/Index.tsx"));
const EditPage = lazy(() => import("./pages/EditPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ResumeHashPage = lazy(() => import("./pages/ResumeHashPage.tsx"));

const wrap = (el: React.ReactNode) => <Suspense fallback={<PageSpinner />}>{el}</Suspense>;

const router = createBrowserRouter([
  { path: "/", element: wrap(<Index />) },
  ...(import.meta.env.DEV ? [{ path: "/edit", element: wrap(<EditPage />) }] : []),
  { path: "/:hash", element: wrap(<ResumeHashPage />) },
  { path: "*", element: wrap(<NotFound />) },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

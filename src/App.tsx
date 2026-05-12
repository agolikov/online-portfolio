import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageSpinner } from "@/components/ui/PageSpinner";

const queryClient = new QueryClient();
const Index = lazy(() => import("./pages/Index.tsx"));
const EditPage = lazy(() => import("./pages/EditPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ResumeHashPage = lazy(() => import("./pages/ResumeHashPage.tsx"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<Index />} />
            {import.meta.env.DEV && <Route path="/edit" element={<EditPage />} />}
            <Route path="/:hash" element={<ResumeHashPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

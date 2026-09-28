import { Routes, Route } from "react-router";
import { SiteLayout } from "./components/layout/SiteLayout";
import LandingPage from "./pages/LandingPage";
import { DocsPage } from "./pages/docs/DocsPage";
import { LearnIndex } from "./pages/learn/LearnIndex";
import { LearnArticle } from "./pages/learn/LearnArticle";
import { ConceptsPage } from "./pages/ConceptsPage";
import { ReleasesPage } from "./pages/ReleasesPage";
import { ResearchPage } from "./pages/ResearchPage";
import { PlaygroundPage } from "./pages/playground/PlaygroundPage";
import { NotFound } from "./pages/NotFound";

// The guide is a VitePress site built into public/guide at deploy time. Static
// hosts serve it before the SPA fallback, so production never reaches this
// route — it exists so `npm run dev` (where Vite falls back to index.html for
// /guide/) hands the browser to the real book.
function GuideRedirect() {
  window.location.replace("/guide/index.html");
  return null;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/guide" element={<GuideRedirect />} />
        <Route path="/guide/*" element={<GuideRedirect />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/concepts" element={<ConceptsPage />} />
        <Route path="/releases" element={<ReleasesPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/learn" element={<LearnIndex />} />
        <Route path="/learn/:slug" element={<LearnArticle />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

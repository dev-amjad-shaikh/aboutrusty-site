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

// The book (guide/) is a VitePress site built into public/guide at deploy
// time, so the static host serves /guide/* before the SPA fallback. A client-
// side <Link> into /guide lands here instead; a hard load of the same URL
// hands it to the host. If the SPA itself was loaded at this URL, the book
// isn't built (plain `npm run dev`), so say so rather than reload forever.
const initialPath = window.location.pathname;

function GuideRedirect() {
  const here = window.location.pathname;
  if (here !== initialPath) {
    window.location.replace(here + window.location.hash);
    return null;
  }
  return (
    <div className="mx-auto max-w-[640px] px-7 py-32 text-center text-[17px] text-[#cfc3b8]">
      The book isn't built in this dev server. Run <code className="font-code">npm run build:guide</code>, or
      read it in the repo's <a href="https://github.com/dev-amjad-shaikh/aboutrusty-site/tree/main/aboutrusty/guide">guide/</a> folder.
    </div>
  );
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

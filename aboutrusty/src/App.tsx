import { Routes, Route } from "react-router";
import { SiteLayout } from "./components/layout/SiteLayout";
import LandingPage from "./pages/LandingPage";
import { LearnIndex } from "./pages/learn/LearnIndex";
import { LearnArticle } from "./pages/learn/LearnArticle";
import { PlaygroundPage } from "./pages/playground/PlaygroundPage";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn" element={<LearnIndex />} />
        <Route path="/learn/:slug" element={<LearnArticle />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

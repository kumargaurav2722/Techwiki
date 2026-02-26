import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { HomePage } from "@/features/wiki/HomePage";
import { ArticlePage } from "@/features/wiki/ArticlePage";
import { CategoryPage } from "@/features/wiki/CategoryPage";
import { SearchPage } from "@/features/search/SearchPage";
import { AdminPage } from "@/features/admin/AdminPage";
import { LearningPathsPage } from "@/features/learn/LearningPathsPage";
import { AuthPage } from "@/features/auth/AuthPage";
import { LibraryPage } from "@/features/library/LibraryPage";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { GraphPage } from "@/features/graph/GraphPage";
import { PracticePage } from "@/features/practice/PracticePage";
import { CollabPage } from "@/features/collab/CollabPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="learn" element={<LearningPathsPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="collab" element={<CollabPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="wiki/:category/:topic" element={<ArticlePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/layout/Layout";
import { HomePage } from "@/features/wiki/HomePage";
import { ArticlePage } from "@/features/wiki/ArticlePage";
import { CategoryPage } from "@/features/wiki/CategoryPage";
import { SearchPage } from "@/features/search/SearchPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="category/:category" element={<CategoryPage />} />
          <Route path="wiki/:category/:topic" element={<ArticlePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Article } from "./pages/Article";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="wiki/:category/:topic" element={<Article />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

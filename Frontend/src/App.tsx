import AuthProvider from "./context/auth_context";
import HomePage from "./pages/homepage";
import NewsPage from "./pages/newspage";
import MarketPage from "./pages/marketpage";
import LoginPage from "./pages/loginpage";
import NavBar from "./components/navbar";
import "bootstrap/dist/css/bootstrap.css";
import imagePath from "/home/bum/Documents/SSIT/market-tracker/Frontend/src/assets/world.jpeg";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar brandName="Bum News" imageSrcPath={imagePath}></NavBar>
        <Routes>
          {/* <Route path="/" element={<HomePage />} /> */}
          <Route path="/news" element={<NewsPage />} />
          <Route path="/markets" element={<MarketPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import "./App.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />}></Route>
    </Routes>
  );
}

export default App;

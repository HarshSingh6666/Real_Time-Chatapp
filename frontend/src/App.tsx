import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index";
import LivePage from "./pages/LivePage"; // ✅ Import karein
import { Toaster } from "sonner";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuth = !!localStorage.getItem("token");
  return isAuth ? children : <Navigate to="/" />;
};

const App = () => (
  <BrowserRouter>
    <Toaster position="top-center" richColors />
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      
      {/* ✅ New Tab ke liye Route */}
      <Route path="/live/:roomId" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
);

export default App;
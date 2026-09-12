import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return toast.error("Please fill all fields!");
    }

    setLoading(true);
    try {
      // Direct Login Request
      const response = await axios.post("https://opentalks.onrender.com/login", { email, password });
      
      // Save Token and User Info
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userInfo", JSON.stringify(response.data.user)); // Optional: Save user details
      
      toast.success("Login Successful!");
      
      // Delay for animation
      setTimeout(() => {
        navigate("/home"); // Redirect to Home/Chat page
      }, 800);

    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error(err.response?.data?.message || "Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back">
      <form onSubmit={handleLogin} className="space-y-6">
        
        {/* Email Input */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Mail className="absolute left-3 top-3.5 text-purple-400" size={18} />
          <input 
            type="email"
            placeholder="Email Address"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </motion.div>

        {/* Password Input */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <Lock className="absolute left-3 top-3.5 text-purple-400" size={18} />
          <input 
            type="password"
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </motion.div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"} <LogIn size={18} />
        </motion.button>
      </form>

      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.4 }}
        className="text-slate-400 text-center mt-8 text-sm"
      >
        Don't have an account?{" "}
        <Link to="/signup" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
          Create Account
        </Link>
      </motion.p>
    </AuthLayout>
  );
};

export default Login;
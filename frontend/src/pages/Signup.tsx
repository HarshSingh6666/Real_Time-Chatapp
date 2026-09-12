import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react"; // Changed icon for direct signup
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    age: "",
    password: ""
  });

  // --- HANDLER ---

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Validation
    if (Object.values(form).some(v => !v)) return toast.error("Please fill in all fields!");
    if (!/\S+@\S+\.\S+/.test(form.email)) return toast.error("Invalid email address!");
    
    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 18) return toast.error("You must be 18+ to register.");

    setLoading(true);
    try {
      // 2. Direct Signup Call
      const dataToSend = {
        ...form,
        age: ageNum
      };

      // Assuming your backend now has a direct registration endpoint
      const res = await axios.post("https://opentalks.onrender.com/api/register", dataToSend);
      
      toast.success(res.data.message || "Account created successfully!");
      navigate("/"); // Redirect to Login
    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInputType = (key: string) => {
    if (key === "password") return "password";
    if (key === "age") return "number";
    if (key === "email") return "email";
    return "text";
  };

  return (
    <AuthLayout title="Create Account">
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSignup} 
        className="space-y-4"
      >
        {Object.keys(form).map((key, i) => (
          <motion.div 
            key={key} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.05 }}
          >
            <div className="relative group">
              <input 
                type={getInputType(key)}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={(form as any)[key]}
                onChange={e => setForm({...form, [key]: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all placeholder:text-slate-500 hover:border-white/20"
              />
            </div>
          </motion.div>
        ))}
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account..." : "Sign Up"} <UserPlus size={18} />
        </motion.button>
      </motion.form>

      <div className="mt-8 pt-6 border-t border-white/5">
        <p className="text-slate-400 text-center text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-purple-400 font-bold hover:text-purple-300 transition-colors underline-offset-4 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;
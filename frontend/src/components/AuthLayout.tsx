import { motion } from "framer-motion";

export const AuthLayout = ({ children, title }: { children: React.ReactNode, title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
    {/* Background Glows */}
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md z-10 p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl"
    >
      <h2 className="text-4xl font-bold text-white text-center mb-2 tracking-tight">{title}</h2>
      <p className="text-slate-400 text-center mb-8">Please enter your details</p>
      {children}
    </motion.div>
  </div>
);
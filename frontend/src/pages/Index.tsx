import { useState, useEffect } from 'react';
import axios from 'axios';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { User } from '@/types/chat';
import { useNavigate } from 'react-router-dom'; // ✅ Use navigate instead of window.location for smoother UX

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ Hook init

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      
      // 1. Agar token hi nahi hai, toh seedha login par bhejo
      if (!token) {
        navigate('/'); 
        return;
      }

      try {
        const res = await axios.get('https://opentalks.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(res.data);
      } catch (err: any) {
        console.error("User fetch error:", err);

        // 🔥 FIX: Sirf tab Logout karein jab Token Invalid ho (401)
        if (err.response && err.response.status === 401) {
            toast.error('Session expired, please login again');
            localStorage.clear();
            navigate('/');
        } else {
            // Agar Server Down hai ya Network issue hai, toh Logout MAT karo
            toast.error("Unable to connect to server. Retrying...");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // ✅ State Update Function
  const handleUserUpdate = (updatedUser: User) => {
    console.log("Updating User in Index:", updatedUser);
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-bold text-primary animate-pulse">
        LOADING AURA...
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <ChatLayout 
        user={user} 
        onOpenSettings={() => {}} 
        onOpenSearch={() => {}} 
        onUserUpdate={handleUserUpdate} 
      />
      
      <ThemeToggle />
    </>
  );
};

export default Index;
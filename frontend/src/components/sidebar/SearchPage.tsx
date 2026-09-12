import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, UserPlus, X, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/chat/Avatar';
import { User, Channel } from '@/types/chat'; // Ensure Channel type is imported
import { toast } from 'sonner';

const SOCKET_URL = 'https://opentalks.onrender.com'; // Backend URL

interface SearchPageProps {
  // ⚠️ Update: Ab hum sirf ID nahi, pura Channel object wapas denge
  onSelectChannel: (channel: Channel) => void; 
  onClose?: () => void;
}

export const SearchPage = ({ onSelectChannel, onClose }: SearchPageProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingChatId, setCreatingChatId] = useState<string | null>(null); // To show spinner on specific user

  // --- Search Logic (Debounced) ---
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${SOCKET_URL}/api/users/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // --- 🔥 Handle Click (Create or Access Chat) ---
  const handleUserClick = async (userId: string) => {
    setCreatingChatId(userId); // Start loading for this specific user

    try {
      const token = localStorage.getItem('token');
      
      // 1. Backend ko bolo: "Is user ke saath chat do"
      const { data } = await axios.post(
        `${SOCKET_URL}/api/chat`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Parent ko bolo: "Ye lo Channel, ab chat window kholo"
      onSelectChannel(data);
      
      if (onClose) onClose(); // Close search view

    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error("Failed to start conversation");
    } finally {
      setCreatingChatId(null);
    }
  };

  return (
    <>
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-border">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* --- BODY (Results) --- */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-primary" />
            <span className="text-xs font-medium tracking-wider">SEARCHING...</span>
          </div>
        )}

        {/* Initial State */}
        {!loading && !query && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
            <div className="h-12 w-12 rounded-2xl bg-secondary/50 flex items-center justify-center mb-3 text-muted-foreground">
                <UserPlus className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Find People</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
              Search for friends by name or username to start chatting.
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No users found.</p>
          </div>
        )}

        {/* Results List */}
        <div className="space-y-0.5">
          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => handleUserClick(user._id)}
              disabled={creatingChatId !== null} // Disable all buttons while creating one
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 hover:bg-secondary/80 group disabled:opacity-50"
            >
              <Avatar user={user} size="sm" />
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                        {user.name}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>

              {/* Action Icon or Loader */}
              <div className="p-1.5 rounded-lg text-primary">
                {creatingChatId === user._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <MessageSquare className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
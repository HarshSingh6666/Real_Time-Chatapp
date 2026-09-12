import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, X, Loader2, MessageSquarePlus, UserPlus } from 'lucide-react';
import { Avatar } from '@/components/chat/Avatar'; // Aapka existing avatar component
import { User } from '@/types/chat'; 

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search Logic (Debounced)
  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`https://opentalks.onrender.com/api/users/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    // Har key press par call na ho, isliye thoda wait karte hain (Debounce)
    const timeoutId = setTimeout(() => {
      if (query) searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        
        {/* Header & Input */}
        <div className="p-4 border-b border-border bg-secondary/10 flex items-center gap-3">
          <Search className="text-muted-foreground ml-2" size={20} />
          <input 
            autoFocus
            type="text"
            placeholder="Search users by name or username..."
            className="flex-1 bg-transparent outline-none text-lg font-medium placeholder:text-muted-foreground/50"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8 text-primary">
              <Loader2 className="animate-spin" size={30} />
            </div>
          )}

          {/* Empty State */}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found named "{query}"</p>
            </div>
          )}

           {/* Initial State */}
           {!query && (
            <div className="text-center py-12 text-muted-foreground opacity-50">
              <Search size={48} className="mx-auto mb-2 opacity-20" />
              <p>Type to find friends...</p>
            </div>
          )}

          {/* User List */}
          <div className="space-y-1">
            {results.map((user) => (
              <div key={user._id} className="flex items-center gap-4 p-3 hover:bg-secondary/30 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-primary/10">
                <Avatar user={user} size="md" />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground truncate">{user.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">@{user.username || "unknown"}</p>
                </div>

                {/* Action Button */}
                <button className="p-2 bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-white">
                  <MessageSquarePlus size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
import { useState, useEffect } from "react";
import { X, Search, Loader2, MessageSquarePlus, User as UserIcon } from "lucide-react";
import axios from "axios";
import { User } from "@/types/chat"; 
import { Avatar } from "@/components/chat/Avatar"; 

// Backend URL
const SOCKET_URL = "https://opentalks.onrender.com";

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
  currentUser: User;
  existingChatUserIds?: string[];
}

export const UserSearchModal = ({ 
  isOpen, 
  onClose, 
  onSelectUser, 
  currentUser,
  existingChatUserIds = [] 
}: UserSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search Logic (Debounced + AbortController)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Create an AbortController to cancel previous requests
    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        // ✅ FIX: Updated URL to match the backend router (/search)
        // ✅ FIX: Added the abort signal
        const { data } = await axios.get(`${SOCKET_URL}/api/users/search?search=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        
        // Robust Filtering Logic
        const filteredUsers = data.filter((u: User) => {
            const currentUserIdStr = String(currentUser._id || currentUser.id);
            const searchedUserIdStr = String(u._id || u.id);

            // 1. Filter out MYSELF
            const isMe = searchedUserIdStr === currentUserIdStr;

            // 2. Filter out EXISTING CHATS
            const isAlreadyChatting = existingChatUserIds.includes(searchedUserIdStr);

            // Return only if NOT me AND NOT already chatting
            return !isMe && !isAlreadyChatting;
        });

        setResults(filteredUsers);
      } catch (error) {
        // Ignore errors that are just the request being canceled by our AbortController
        if (axios.isCancel(error)) {
          console.log("Previous search request canceled");
          return;
        }
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms wait

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort(); // Cancel the request if the component unmounts or query changes
    };
  }, [query, currentUser._id, existingChatUserIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="text-primary" size={20} />
            <h2 className="font-semibold text-lg">New Chat</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search people by name or email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary/50 border-none focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[300px] bg-background">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="animate-spin mb-2" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((user) => (
                <button
                  key={user._id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors text-left group border border-transparent hover:border-border"
                >
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <UserIcon size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-60">
               <UserIcon size={32} className="mb-2" />
               <p>No new users found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-10">
               <Search size={40} className="mb-3" />
               <p className="text-sm">Type to search for new friends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
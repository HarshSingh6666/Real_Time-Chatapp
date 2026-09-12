import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  placeholder?: string;
  debounceMs?: number; // 👈 Added optional debounce timing
}

export const SearchBar = ({ 
  onSearch, 
  onClose, 
  placeholder = 'Search messages...',
  debounceMs = 300 // Default to 300ms delay
}: SearchBarProps) => {
  const [query, setQuery] = useState('');

  // 👈 Built-in Debounce Logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch, debounceMs]);

  // 👈 Clear state before closing so it's fresh next time it opens
  const handleClose = () => {
    setQuery('');
    onSearch(''); 
    onClose();
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-glass animate-fade-in">
      <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)} // Now just updates local state
        placeholder={placeholder}
        autoFocus
        className={cn(
          'flex-1 bg-transparent text-sm placeholder:text-muted-foreground',
          'focus:outline-none'
        )}
      />
      <button
        onClick={handleClose}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
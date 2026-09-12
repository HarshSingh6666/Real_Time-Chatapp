import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  // return (
  //   // <button
  //   //   onClick={toggleTheme}
  //   //   className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-card border border-border shadow-lg hover:shadow-glow transition-all duration-300"
  //   //   title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
  //   // >
  //   //   {theme === 'dark' ? (
  //   //     <Sun className="h-5 w-5 text-foreground" />
  //   //   ) : (
  //   //     <Moon className="h-5 w-5 text-foreground" />
  //   //   )}
  //   // </button>
  // );
};

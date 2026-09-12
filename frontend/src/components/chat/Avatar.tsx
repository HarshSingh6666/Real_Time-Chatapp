import { cn } from '@/lib/utils';
import { User } from '@/types/chat';

interface AvatarProps {
  user: User | null; // null check zaroori hai
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

export const Avatar = ({ user, size = 'md', className, showStatus = true }: AvatarProps) => {
  
  // Size classes map
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-24 w-24 text-xl', // Settings modal ke liye bada size
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {user?.avatar ? (
        <img 
          src={user.avatar} 
          alt={user.name} 
          className={cn("rounded-full object-cover border border-border bg-secondary", sizeClasses[size])}
          // ✅ Image load error handle karein
          onError={(e) => {
            e.currentTarget.style.display = 'none'; // Agar tuti hui image hai to chupao
            e.currentTarget.nextElementSibling?.classList.remove('hidden'); // Initials dikhao
          }}
        />
      ) : null}

      {/* Fallback Initials (Agar photo na ho ya load fail ho jaye) */}
      <div className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase", 
        sizeClasses[size],
        user?.avatar ? "hidden" : "" // Agar avatar hai to ise chupao, par error pe dikhao
      )}>
        {user?.name?.charAt(0) || "?"}
      </div>
      
      {/* Online Status Dot */}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
      )}
    </div>
  );
};
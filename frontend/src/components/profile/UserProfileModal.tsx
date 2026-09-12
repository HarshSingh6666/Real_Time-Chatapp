import { User } from '@/types/chat';
import { Avatar } from '@/components/chat/Avatar';
import { X, Mail, Phone, Calendar, User as UserIcon, MapPin, Hash, Info, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ user, isOpen, onClose }: UserProfileModalProps) => {
  
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-background border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 max-h-[85vh]">
        
        {/* Header / Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 relative">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all z-10"
            >
                <X size={20} />
            </button>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 -mt-16 custom-scrollbar">
            
            {/* Avatar & Name Center */}
            <div className="flex flex-col items-center text-center">
                <div className="p-1.5 bg-background rounded-full shadow-xl">
                    <Avatar 
                        user={user} 
                        size="xl" 
                        isOnline={true} 
                        className="h-32 w-32 border-4 border-background"
                    />
                </div>
                
                <h2 className="mt-4 text-2xl font-black text-foreground">{user.name}</h2>
                <p className="text-primary font-bold opacity-80">@{user.username || 'username'}</p>
                
                {/* Status Badge */}
                <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20 tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> ONLINE
                    </span>
                </div>
            </div>

            {/* About Section */}
            <div className="mt-8 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">About</label>
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 text-sm leading-relaxed text-muted-foreground">
                    {user.about || "Hey there! I am using Aura Chat."}
                </div>
            </div>

            {/* Details Grid */}
            <div className="mt-6 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Info size={16} className="text-primary"/> User Details
                </h3>
                
                <div className="grid gap-3">
                    <InfoItem icon={<Mail size={16}/>} label="Email" value={user.email} />
                    <InfoItem icon={<Phone size={16}/>} label="Phone" value={user.phone || "Not set"} />
                    <InfoItem icon={<Calendar size={16}/>} label="Age" value={user.age ? `${user.age} years old` : "Not set"} />
                    <InfoItem icon={<Hash size={16}/>} label="User ID" value={user._id} copyable />
                    <InfoItem 
                        icon={<CalendarDays size={16}/>} 
                        label="Joined" 
                        // Agar createdAt backend se aa raha hai toh format karein, warna fallback
                        value={format(new Date(), 'MMMM yyyy')} 
                    />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

// Helper Component for Info Rows
const InfoItem = ({ icon, label, value, copyable = false }: any) => (
    <div className="group flex items-center gap-4 p-3 rounded-2xl bg-card hover:bg-secondary/40 border border-border/40 transition-all duration-200">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
            <p className="text-sm font-medium text-foreground truncate">{value}</p>
        </div>
    </div>
);
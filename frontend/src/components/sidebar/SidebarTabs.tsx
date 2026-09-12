import { useState, useEffect } from 'react';
import { MessageSquare, Archive, Radio, Settings, Search, PlusCircle, LogOut, Check, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarTab, User } from '@/types/chat';
import { Avatar } from '@/components/chat/Avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStoredAccounts, switchAccount, removeAccount } from '@/lib/accountUtils';
import { useNavigate } from 'react-router-dom';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  archiveCount?: number;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
  currentUser: User;
  onProfileClick: () => void; // ✅ New prop
}

export const SidebarTabs = ({ 
  activeTab, 
  onTabChange, 
  archiveCount = 0, 
  onSettingsClick, 
  onSearchClick,
  currentUser,
  onProfileClick // ✅ Destructure new prop
}: SidebarTabsProps) => {
  
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(getStoredAccounts());

  // Listen for account changes
  useEffect(() => {
    const updateList = () => setAccounts(getStoredAccounts());
    window.addEventListener('accounts-updated', updateList);
    return () => window.removeEventListener('accounts-updated', updateList);
  }, []);

  const tabs = [
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'archive', icon: Archive, label: 'Archive', count: archiveCount },
  ];

  const handleAddAccount = () => {
    localStorage.removeItem('token'); 
    navigate('/signup');
  };

  // ✅ FIXED LOGOUT HANDLER
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault(); // Stop bubbling
    e.stopPropagation();
    
    // Agar user ID hai toh list se hatao, warna direct logout karo
    if (currentUser && currentUser._id) {
        removeAccount(currentUser._id);
    } else {
        removeAccount(); // Force logout
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col items-center gap-2 py-4 px-2 bg-secondary/30 border-r border-border h-full">
        
        {/* Main Tabs */}
        <div className="flex flex-col items-center gap-2 flex-1">
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(tab.id as SidebarTab)}
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{tab.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-3 pt-2 border-t border-border">
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onSearchClick} className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Search className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search Users</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onSettingsClick} className="flex items-center justify-center w-10 h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                <Settings className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          {/* ✅ ACCOUNTS DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative outline-none ring-2 ring-transparent hover:ring-primary/50 rounded-full transition-all">
                <Avatar user={currentUser} size="sm" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent side="right" align="end" className="w-60 ml-2 bg-popover/95 backdrop-blur-md">
              
              {/* ✅ NEW: My Profile Section */}
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                My Account
              </DropdownMenuLabel>
              
              <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer gap-2">
                <UserIcon className="h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Switch Accounts
              </DropdownMenuLabel>
              
              {/* Account List - Safe Check */}
              {accounts.length > 0 ? (
                  accounts
                    .filter(acc => acc.user && acc.user._id)
                    .map((acc) => (
                      <DropdownMenuItem 
                        key={acc.user._id} 
                        onClick={() => switchAccount(acc.user._id)}
                        className="flex items-center gap-3 p-2 cursor-pointer"
                      >
                        <Avatar user={acc.user} size="sm" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-medium truncate">{acc.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{acc.user.email}</p>
                        </div>
                        {currentUser && acc.user._id === currentUser._id && <Check className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                  ))
              ) : (
                  <div className="p-2 text-xs text-muted-foreground">No saved accounts</div>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer text-primary focus:text-primary gap-2">
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Add Account</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Logout Button */}
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </TooltipProvider>
  );
};
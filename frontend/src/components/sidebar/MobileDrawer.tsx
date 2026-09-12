import { Channel, User, Workspace } from '@/types/chat';
import { ChannelList } from './ChannelList';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  channels: Channel[];
  activeWorkspace: string | null;
  activeChannel: string | null;
  currentUser: User;
  onWorkspaceSelect: (id: string) => void;
  onChannelSelect: (id: string) => void;
  onArchiveChannel: (id: string) => void;
  onUnarchiveChannel: (id: string) => void;
}

export const MobileDrawer = ({
  isOpen,
  onClose,
  workspaces,
  channels,
  activeWorkspace,
  activeChannel,
  currentUser,
  onWorkspaceSelect,
  onChannelSelect,
  onArchiveChannel,
  onUnarchiveChannel,
}: MobileDrawerProps) => {
  const handleChannelSelect = (id: string) => {
    onChannelSelect(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
       
        <div className="relative">
          <ChannelList
            channels={channels}
            activeChannel={activeChannel}
            onChannelSelect={handleChannelSelect}
            currentUser={currentUser}
            onArchiveChannel={onArchiveChannel}
            onUnarchiveChannel={onUnarchiveChannel}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-secondary/80 text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
};

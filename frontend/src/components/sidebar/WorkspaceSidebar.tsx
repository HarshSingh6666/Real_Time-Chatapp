import { Workspace } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Plus, Settings } from 'lucide-react';

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspace: string | null;
  onWorkspaceSelect: (id: string) => void;
  onSettingsClick?: () => void;
  isCollapsed?: boolean;
}

export const WorkspaceSidebar = ({
  workspaces,
  activeWorkspace,
  onWorkspaceSelect,
  onSettingsClick,
  isCollapsed = true,
}: WorkspaceSidebarProps) => {
  return (
    <>
      {/* ================= DESKTOP VIEW (Vertical Sidebar) ================= */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 z-20',
          isCollapsed ? 'w-[72px]' : 'w-[200px]'
        )}
      >
        <div className="flex-1 py-3 space-y-2 overflow-y-auto scrollbar-thin">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => onWorkspaceSelect(workspace.id)}
              className={cn(
                'relative flex items-center justify-center mx-auto rounded-2xl transition-all duration-200',
                'hover:rounded-xl group',
                isCollapsed ? 'h-12 w-12' : 'h-12 w-[calc(100%-24px)] px-3',
                activeWorkspace === workspace.id
                  ? 'bg-primary text-primary-foreground rounded-xl shadow-glow'
                  : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
              )}
            >
              <span className="text-xl">{workspace.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 font-medium truncate">{workspace.name}</span>
              )}
              
              {workspace.unreadCount && workspace.unreadCount > 0 && (
                <span
                  className={cn(
                    'absolute flex items-center justify-center min-w-[18px] h-[18px] px-1',
                    'text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground',
                    isCollapsed ? '-top-1 -right-1' : 'right-2'
                  )}
                >
                  {workspace.unreadCount > 99 ? '99+' : workspace.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="py-3 space-y-2 border-t border-sidebar-border">
          <button
            className={cn(
              'flex items-center justify-center mx-auto rounded-2xl transition-all duration-200',
              'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground hover:rounded-xl',
              isCollapsed ? 'h-12 w-12' : 'h-12 w-[calc(100%-24px)] px-3'
            )}
          >
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Add Workspace</span>}
          </button>
          <button
            onClick={onSettingsClick}
            className={cn(
              'flex items-center justify-center mx-auto rounded-2xl transition-all duration-200',
              'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground hover:rounded-xl',
              isCollapsed ? 'h-12 w-12' : 'h-12 w-[calc(100%-24px)] px-3'
            )}
          >
            <Settings className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* ================= MOBILE VIEW (Horizontal Bottom Bar) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border z-[100] flex items-center px-2 pb-safe bg-background/95 backdrop-blur-md">
        
        {/* Scrollable Workspaces Row */}
        <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-none px-2 h-full">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => onWorkspaceSelect(workspace.id)}
              className={cn(
                'relative flex items-center justify-center shrink-0 rounded-2xl transition-all duration-200 h-10 w-10',
                activeWorkspace === workspace.id
                  ? 'bg-primary text-primary-foreground rounded-xl shadow-glow'
                  : 'bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary'
              )}
            >
              <span className="text-lg">{workspace.icon}</span>
              {workspace.unreadCount && workspace.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full bg-destructive text-destructive-foreground">
                  {workspace.unreadCount > 99 ? '99+' : workspace.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons (Fixed on the right side) */}
        <div className="flex items-center gap-2 border-l border-sidebar-border pl-3 ml-2 h-10">
          <button className="flex items-center justify-center h-10 w-10 rounded-xl bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-primary-foreground transition-all">
            <Plus className="h-5 w-5" />
          </button>
          <button 
            onClick={onSettingsClick}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-primary hover:text-primary-foreground transition-all"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

      </nav>
    </>
  );
};
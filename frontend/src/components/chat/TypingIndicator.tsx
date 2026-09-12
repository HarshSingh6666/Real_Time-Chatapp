interface TypingIndicatorProps {
  userName: string;
}

export const TypingIndicator = ({ userName }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-fade-in">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-typing-dot-1" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-typing-dot-2" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-typing-dot-3" />
      </div>
      <span className="font-medium">{userName}</span>
      <span>is typing...</span>
    </div>
  );
};

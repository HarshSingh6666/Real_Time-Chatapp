import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Smile, Paperclip, Code, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import axios from 'axios';

const SOCKET_URL = 'https://opentalks.onrender.com';

interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'code' | 'image') => void;
  onTyping?: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'file';
}

export const ChatInput = ({ onSendMessage, onTyping }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${SOCKET_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      return res.data.url;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSend = async () => {
    if (message.trim() || attachments.length > 0) {
      if (attachments.length > 0) setIsUploading(true);

      try {
        for (const attachment of attachments) {
          if (attachment.type === 'image') {
            const imageUrl = await uploadToCloudinary(attachment.file);
            if (imageUrl) {
              onSendMessage(imageUrl, 'image');
            }
          } else {
            onSendMessage(`📎 ${attachment.file.name}`, 'text');
          }
        }

        if (message.trim()) {
          onSendMessage(message, isCodeMode ? 'code' : 'text');
        }

        setMessage('');
        setIsCodeMode(false);
        setAttachments([]);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (err) {
        console.error("Sending failed", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    onTyping?.();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachments((prev) => [
              ...prev,
              {
                file,
                preview: event.target?.result as string,
                type: 'image',
              },
            ]);
          };
          reader.readAsDataURL(file);
        } else {
          setAttachments((prev) => [
            ...prev,
            {
              file,
              preview: '',
              type: 'file',
            },
          ]);
        }
      });
    }
    e.target.value = '';
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachments((prev) => [
            ...prev,
            {
              file,
              preview: event.target?.result as string,
              type: 'image',
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    setIsEmojiOpen(false);
    textareaRef.current?.focus();
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'zip': case 'rar': return '🗜️';
      case 'mp3': case 'wav': return '🎵';
      case 'mp4': case 'mov': return '🎬';
      default: return '📎';
    }
  };

  return (
    <div className="p-2 sm:p-4 border-t border-border bg-card/50 backdrop-blur-glass w-full">
      {/* File/Image Previews - Mobile me scrollable rakha hai */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 p-2 overflow-x-auto scrollbar-none bg-secondary/30 rounded-xl max-w-full">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative flex-shrink-0 group">
              {attachment.type === 'image' ? (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeAttachment(index)}
                    disabled={isUploading}
                    className="absolute top-0 right-0 p-1 rounded-bl-lg bg-destructive/80 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
                  <span className="text-lg">{getFileIcon(attachment.file.name)}</span>
                  <span className="text-foreground max-w-[80px] sm:max-w-[120px] truncate">
                    {attachment.file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    disabled={isUploading}
                    className="p-1 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main WhatsApp Style Input Area */}
      <div className="flex items-end gap-1.2 sm:gap-2 max-w-6xl mx-auto">
        
        {/* Input Bubble (Pill Shape) */}
        <div className="flex-1 flex items-end bg-background/60 border border-border rounded-3xl min-h-[44px] px-1 sm:px-2 py-1 shadow-sm">
          
          {/* Emoji Button (Left side) */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={isUploading}
                className={cn(
                  'p-2 rounded-full transition-colors flex-shrink-0 self-end mb-0.5',
                  isEmojiOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Smile className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none shadow-xl mb-2"
              side="top"
              align="start"
              sideOffset={10}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="search"
              />
            </PopoverContent>
          </Popover>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isUploading}
            placeholder={isCodeMode ? 'Paste code...' : 'Message'}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent border-none px-2 py-2.5 max-h-32 focus:outline-none focus:ring-0',
              'text-[16px] placeholder:text-muted-foreground', // 16px is important to prevent iOS Safari zoom
              isCodeMode && 'font-mono text-sm'
            )}
          />

          {/* Attachment Icons Group (Right side of bubble) */}
          <div className="flex items-center self-end mb-0.5 pr-1">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />

            <button
              onClick={() => setIsCodeMode(!isCodeMode)}
              disabled={isUploading}
              className={cn(
                'p-1.5 sm:p-2 rounded-full transition-colors hidden sm:block', // Hidden on very small screens to save space
                isCodeMode ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Code className="h-5 w-5" />
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
              className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Circular Send Button (WhatsApp Style) */}
        <button
          onClick={handleSend}
          disabled={isUploading || (!message.trim() && attachments.length === 0)}
          className={cn(
            'flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 mb-0.5',
            (message.trim() || attachments.length > 0) && !isUploading
              ? 'bg-primary text-primary-foreground shadow-md scale-100 active:scale-95'
              : 'bg-muted text-muted-foreground opacity-70 cursor-not-allowed scale-95'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 ml-0.5" /> // ml-0.5 purely for visual centering of the Send icon
          )}
        </button>
      </div>
    </div>
  );
};
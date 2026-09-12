import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { User } from '@/types/chat'; 
import { getCroppedImg } from "../../lib/cropImage";
import { Avatar } from '@/components/chat/Avatar'; 
import { toast } from 'sonner';
import {
  X, Camera, Bell, Shield, Palette, HelpCircle, LogOut,
  User as UserIcon, Mail, Phone, Calendar, ChevronRight,
  Menu, Save, Edit2, Loader2, RotateCcw, Trash2, Info,
  BellOff, Lock, FileText, Check, ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Backend URL
const SOCKET_URL = 'https://opentalks.onrender.com';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (user: User) => void;
}

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'appearance' | 'help';
type ThemeType = 'dark' | 'light' | 'system';

export const SettingsModal = ({ isOpen, onClose, user, onUserUpdate }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [theme, setTheme] = useState<ThemeType>((localStorage.getItem('theme') as ThemeType) || 'system');
  
  // 🔥 Mobile Navigation Drawer State
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    about: '' 
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        age: user.age ? String(user.age) : '',
        about: user.about || '' 
      });
    }
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Lock body scroll and set initial menu state when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setShowMobileMenu(false); // Mobile drawer closed by default
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setImageLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Crop failed");

      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg'); 

      const token = localStorage.getItem('token');
      const res = await axios.post(`${SOCKET_URL}/api/users/avatar`, formData, {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Profile Photo Updated!");
      onUserUpdate(res.data);
      setImageSrc(null);
      setZoom(1);
    } catch (err: any) {
        console.error("Upload Error:", err);
        toast.error("Failed to upload image");
    } finally {
        setImageLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    setImageLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`${SOCKET_URL}/api/users/avatar`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Profile Photo Removed");
        onUserUpdate(res.data);
    } catch (err: any) {
        toast.error("Failed to remove image");
    } finally {
        setImageLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
          name: formData.name,
          phone: formData.phone,
          about: formData.about,
          age: formData.age ? Number(formData.age) : undefined
      };

      const res = await axios.put(`${SOCKET_URL}/api/users/update`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Profile Updated Successfully!");
      onUserUpdate(res.data);
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'help' as const, label: 'Help', icon: HelpCircle },
  ];

  return (
    // Outer Wrapper with exactly 800px breakpoint
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 min-[800px]:p-6 bg-background min-[800px]:bg-transparent">
      
      {/* Desktop Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm hidden min-[800px]:block" onClick={onClose} />

      {/* Main Container: Full screen below 800px, Modal above 800px */}
      <div className="relative w-full h-[100dvh] min-[800px]:max-w-4xl lg:max-w-5xl min-[800px]:h-[85vh] min-[800px]:max-h-[750px] bg-background min-[800px]:rounded-[2rem] min-[800px]:shadow-2xl overflow-hidden flex flex-row animate-in fade-in min-[800px]:zoom-in-95 duration-300">
        
        {/* Cropper Overlay */}
        {imageSrc && (
           <div className="absolute inset-0 z-50 bg-background flex flex-col rounded-none min-[800px]:rounded-[2rem]">
              <div className="flex items-center justify-between p-4 min-[800px]:p-6 border-b">
                  <h3 className="font-bold text-lg">Crop Image</h3>
                  <button onClick={() => setImageSrc(null)} className="p-2 hover:bg-secondary rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 relative bg-black/95">
                 <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} objectFit="vertical" />
              </div>
              <div className="p-4 min-[800px]:p-6 bg-background border-t space-y-4">
                 <div className="flex items-center gap-4 max-w-md mx-auto">
                    <ZoomIn size={20} className="text-muted-foreground flex-shrink-0"/>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer" />
                 </div>
                 <div className="flex gap-3 justify-center min-[800px]:justify-end">
                    <button onClick={() => setImageSrc(null)} className="flex-1 min-[800px]:flex-none px-6 py-3 min-[800px]:py-2 rounded-xl font-bold text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
                    <button onClick={handleUploadCroppedImage} disabled={imageLoading} className="flex-1 min-[800px]:flex-none px-6 py-3 min-[800px]:py-2 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 transition-opacity">
                        {imageLoading ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>} Upload Photo
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Mobile Drawer Backdrop */}
        {showMobileMenu && (
          <div 
            className="absolute inset-0 bg-black/60 z-40 min-[800px]:hidden animate-in fade-in" 
            onClick={() => setShowMobileMenu(false)} 
          />
        )}

        {/* ===================== SIDEBAR ===================== */}
        <nav 
          className={cn(
            "absolute min-[800px]:relative z-50 h-full overflow-y-auto bg-background min-[800px]:bg-secondary/10 p-4 sm:p-6 flex-shrink-0 flex-col transition-transform duration-300 border-r border-border shadow-2xl min-[800px]:shadow-none flex",
            "w-[260px] min-[800px]:w-52 lg:w-60", 
            showMobileMenu ? "translate-x-0" : "-translate-x-full min-[800px]:translate-x-0" // Drawer effect under 800px
          )}
        >
          <div className="space-y-6 min-[800px]:space-y-8 flex-1">
            <div className="flex items-center justify-between min-[800px]:justify-start pt-2 min-[800px]:pt-0 mb-2 min-[800px]:mb-0">
                <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent px-2">SETTINGS</h2>
                <button onClick={() => setShowMobileMenu(false)} className="min-[800px]:hidden p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="space-y-2 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                      setActiveTab(tab.id);
                      setShowMobileMenu(false); 
                  }}
                  className={cn(
                    'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] min-[800px]:text-sm font-bold transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                  )}
                >
                  <tab.icon size={22} strokeWidth={2.5} className="min-[800px]:w-[18px] min-[800px]:h-[18px] flex-shrink-0" />
                  {tab.label}
                  <ChevronRight size={18} className="ml-auto opacity-50 min-[800px]:hidden flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center min-[800px]:justify-start gap-4 px-4 py-4 mt-8 min-[800px]:mt-0 rounded-2xl text-[15px] min-[800px]:text-sm font-bold text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20">
            <LogOut size={20} className="min-[800px]:w-[18px] min-[800px]:h-[18px] flex-shrink-0" /> Log Out
          </button>
        </nav>

        {/* ===================== CONTENT AREA ===================== */}
        <div className="h-full relative min-w-0 flex-1 bg-card/5 flex flex-col w-full">
          {/* Header */}
          <div className="p-4 min-[800px]:p-6 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-3 text-muted-foreground">
              {/* 🔥 Hamburger Button (Hidden above 800px) */}
              <button 
                onClick={() => setShowMobileMenu(true)} 
                className="min-[800px]:hidden p-1.5 -ml-1.5 hover:bg-secondary rounded-lg transition-colors text-foreground"
              >
                  <Menu size={26} strokeWidth={2.5} />
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] hidden sm:block opacity-70">OpenTalks</span>
                <ChevronRight size={14} className="hidden sm:block opacity-50"/>
                <span className="text-lg min-[800px]:text-base font-bold text-foreground capitalize">{activeTab}</span>
              </div>
            </div>

            {/* Global close button */}
            <button onClick={onClose} className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-all text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-[800px]:p-8 custom-scrollbar">
            {/* ---------------- PROFILE TAB ---------------- */}
            {activeTab === 'profile' && (
              <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-10">
                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent border border-primary/10">
                  <div className="relative group flex-shrink-0">
                    <div className="h-28 w-28 min-[800px]:h-28 min-[800px]:w-28 rounded-full p-1 bg-gradient-to-tr from-primary to-purple-500 shadow-xl relative overflow-hidden">
                        <Avatar key={user.avatar || user.pic ? `${user.avatar || user.pic}?t=${Date.now()}` : 'default'} user={user} size="xl" showStatus={false} className="border-4 border-background h-full w-full object-cover" />
                        {imageLoading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full z-20">
                            <Loader2 className="animate-spin text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-100 min-[800px]:opacity-0 min-[800px]:group-hover:opacity-100 transition-opacity flex flex-col min-[800px]:flex-row items-center justify-center gap-2 rounded-full z-10">
                          <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"><Camera size={20} /></button>
                          {(user.avatar || user.pic) && (<button onClick={handleRemoveImage} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm transition-all"><Trash2 size={20} /></button>)}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
                  </div>
                  <div className="text-center sm:text-left space-y-1 w-full min-w-0">
                    <h4 className="text-2xl font-black text-foreground truncate">{user.name}</h4>
                    <p className="text-primary font-bold opacity-80 truncate">@{user.username}</p>
                    <div className="flex gap-2 justify-center sm:justify-start mt-2">
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold border border-green-500/20">VERIFIED</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg lg:text-xl font-bold">Personal Information</h3>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"><Edit2 size={14}/> Edit Details</button>
                    ) : (
                      <button onClick={() => { setIsEditing(false); setFormData({ name: user.name || '', phone: user.phone || '', age: user.age ? String(user.age) : '', about: user.about || '' }); }} className="flex items-center gap-2 text-sm font-bold text-destructive hover:underline"><RotateCcw size={14}/> Cancel</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputGroup icon={<UserIcon size={16}/>} label="Full Name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} disabled={!isEditing} />
                    <InputGroup icon={<Phone size={16}/>} label="Phone" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} placeholder="+91..." />
                    <InputGroup icon={<Calendar size={16}/>} label="Age" value={formData.age} type="number" onChange={(e: any) => setFormData({...formData, age: e.target.value})} disabled={!isEditing} />
                    <InputGroup icon={<Mail size={16}/>} label="Email" value={user.email} disabled={true} className="opacity-60" />
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">About</label>
                      <div className={cn("flex gap-3 p-4 rounded-2xl border transition-all duration-200", !isEditing ? "bg-secondary/30 border-transparent" : "bg-background border-primary/50 ring-2 ring-primary/10")}>
                        <Info size={16} className={cn("mt-1 flex-shrink-0", !isEditing ? "text-muted-foreground" : "text-primary")} />
                        <textarea value={formData.about} onChange={(e) => setFormData({...formData, about: e.target.value})} disabled={!isEditing} placeholder="Write something about yourself..." rows={3} className="flex-1 w-full bg-transparent outline-none font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground/50 resize-none" />
                      </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4 flex justify-end">
                      <button onClick={handleSaveProfile} disabled={loading} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 min-[800px]:py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- NOTIFICATIONS TAB ---------------- */}
            {activeTab === 'notifications' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-4 animate-in fade-in duration-500">
                  <div className="h-20 w-20 min-[800px]:h-24 min-[800px]:w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 min-[800px]:mb-4 relative">
                    <BellOff size={32} className="min-[800px]:w-10 min-[800px]:h-10" />
                    <span className="absolute top-0 right-0 h-3 w-3 min-[800px]:h-4 min-[800px]:w-4 bg-yellow-500 rounded-full animate-ping" />
                  </div>
                  <h3 className="text-xl min-[800px]:text-2xl font-black text-foreground">Work in Progress</h3>
                  <p className="text-sm min-[800px]:text-base text-muted-foreground max-w-sm leading-relaxed px-4">Notifications are currently under development. <br className="hidden min-[800px]:block" /><span className="font-bold text-primary">This feature will be fully functional after the next update.</span></p>
              </div>
            )}

            {/* ---------------- PRIVACY TAB ---------------- */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-10">
                <div className="space-y-1 min-[800px]:space-y-2"><h3 className="text-xl min-[800px]:text-2xl font-black">Privacy & Terms</h3><p className="text-sm text-muted-foreground">Please read our terms and conditions carefully.</p></div>
                <div className="p-5 min-[800px]:p-6 rounded-3xl bg-secondary/20 border border-border/50 text-sm space-y-6 min-[800px]:max-h-[500px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2"><h4 className="text-base font-bold flex items-center gap-2 text-primary"><Lock size={18} /> 1. Data Security</h4><p className="text-muted-foreground leading-relaxed pl-7">We take your privacy seriously. Your personal data, including chats and media, is encrypted. </p></div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold flex items-center gap-2 text-primary"><FileText size={18} /> 2. User Responsibilities</h4>
                      <div className="text-muted-foreground leading-relaxed pl-7">By using OpenTalks, you agree to:<ul className="list-disc ml-5 mt-2 space-y-1"><li>Not harass, abuse, or threaten other users.</li><li>Not share illegal or harmful content.</li></ul></div>
                    </div>
                </div>
              </div>
            )}
            
            {/* ---------------- APPEARANCE TAB ---------------- */}
            {activeTab === 'appearance' && (
              <div className="space-y-6 min-[800px]:space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-10">
                <div className="space-y-1 min-[800px]:space-y-2"><h3 className="text-xl font-black text-foreground">Visual Style</h3><p className="text-sm text-muted-foreground">Customize how OpenTalks looks on your device.</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-[800px]:gap-4">
                  {[{ id: 'light', label: 'Light', icon: '☀️' }, { id: 'dark', label: 'Dark', icon: '🌙' }, { id: 'system', label: 'System', icon: '💻' }].map((t) => (
                    <button key={t.id} onClick={() => setTheme(t.id as ThemeType)} className={cn("flex sm:flex-col items-center justify-center gap-4 sm:gap-3 p-5 sm:p-6 rounded-3xl border-2 transition-all duration-300", theme === t.id ? "border-primary bg-primary/5 shadow-xl scale-[1.02]" : "border-border bg-card hover:border-primary/30")}>
                      <span className="text-2xl sm:text-3xl">{t.icon}</span><span className="font-bold text-sm sm:text-xs uppercase tracking-wider">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---------------- HELP TAB ---------------- */}
            {activeTab === 'help' && (
              <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto pb-10">
                <div className="text-center space-y-2 pt-4 min-[800px]:pt-0"><h3 className="text-2xl min-[800px]:text-3xl font-black bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">We're here to help</h3></div>
                <div className="grid gap-4">
                    <a href="mailto:OpenTalks@gmail.com" className="group flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 min-[800px]:gap-5 p-5 rounded-[2rem] bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 hover:scale-[1.02] transition-all duration-300">
                      <div className="h-12 w-12 rounded-2xl bg-primary flex flex-shrink-0 items-center justify-center text-primary-foreground"><Mail size={24} /></div>
                      <div className="flex-1 min-w-0 w-full"><h4 className="text-base font-bold">Email Support</h4><p className="text-primary font-bold font-mono text-sm mt-1">OpenTalks@gmail.com</p></div>
                    </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ icon, label, value, onChange, disabled, type = "text", placeholder, className }: any) => (
  <div className={cn("space-y-1.5 min-[800px]:space-y-2 w-full", className)}>
    <label className="text-[10px] min-[800px]:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</label>
    <div className={cn("flex items-center gap-3 p-3.5 min-[800px]:p-4 rounded-2xl border transition-all duration-200", disabled ? "bg-secondary/30 border-transparent" : "bg-background border-primary/50 ring-2 ring-primary/10")}>
      <span className={cn(disabled ? "text-muted-foreground" : "text-primary flex-shrink-0")}>{icon}</span>
      <input type={type} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className="flex-1 w-full bg-transparent outline-none font-bold text-sm min-[800px]:text-base text-foreground placeholder:font-normal placeholder:text-muted-foreground/50 truncate" />
    </div>
  </div>
);
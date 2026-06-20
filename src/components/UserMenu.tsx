import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LogOut,
  User,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const UserMenu: React.FC = () => {
  const { profile, user, signOut } = useAuth();

  if (!profile) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'field_worker':
        return <Badge className="bg-[#E6F7F6] text-[#0D7377] border-none font-semibold hover:bg-[#E6F7F6]">Field Worker</Badge>;
      case 'clinic_vet':
        return <Badge className="bg-[#EDE9FE] text-[#5B21B6] border-none font-semibold hover:bg-[#EDE9FE]">Clinic Vet</Badge>;
      case 'programme_manager':
        return <Badge className="bg-[#FEF3C7] text-[#92400E] border-none font-semibold hover:bg-[#FEF3C7]">Manager</Badge>;
      case 'admin':
        return <Badge className="bg-[#FEE2E2] text-[#991B1B] border-none font-semibold hover:bg-[#FEE2E2]">Admin</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const menuItems = [
    { icon: <User size={18} />, label: 'My Profile', description: 'Personal details & settings' },
    { icon: <HelpCircle size={18} />, label: 'Help & Support', description: 'FAQs & contact info' },
  ];

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-elevated border border-border overflow-hidden transition-transform active:scale-95">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-white text-xs font-bold">
                {getInitials(profile.full_name)}
              </div>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] p-0 sm:w-[350px]">
          <div className="flex h-full flex-col">
            <SheetHeader className="p-6 pb-4 text-left">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary/10 shadow-sm">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-lg font-bold">
                      {getInitials(profile.full_name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <SheetTitle className="truncate text-lg font-bold leading-tight">{profile.full_name}</SheetTitle>
                  <p className="truncate text-xs text-muted mt-0.5">{user?.email}</p>
                  <div className="mt-2">{getRoleBadge(profile.role)}</div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex-1 space-y-1 px-3">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-surface active:bg-surface"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-muted">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark">{item.label}</p>
                    <p className="text-[11px] text-muted">{item.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted/50" />
                </button>
              ))}

              <div className="mx-3 my-4 h-px bg-border/60" />

              <div className="px-3 mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted/60">Programmes</p>
              </div>

              {profile.programmes.map((prog) => (
                <div key={prog} className="flex items-center gap-3 px-3 py-2">
                  <div className={`h-2 w-2 rounded-full ${prog === 'cnvr' ? 'bg-[#0D7377]' : 'bg-[#F0A500]'}`} />
                  <span className="text-xs font-medium capitalize text-body">{prog} Programme</span>
                </div>
              ))}
            </div>

            <div className="p-6 mt-auto border-t border-border/60 bg-surface/30">
              <button
                onClick={() => signOut()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98]"
              >
                <LogOut size={18} />
                Sign Out
              </button>
              <p className="mt-4 text-center text-[10px] text-muted">
                PawPrint AI v3.0.0 · All Care Nepal
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UserMenu;

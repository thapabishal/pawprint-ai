import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldCheck, User, Stethoscope, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

interface RoleChangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  userName: string;
  onConfirm: (newRole: UserRole) => Promise<void>;
}

const roles: { id: UserRole; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    id: 'field_worker',
    label: 'Field Worker',
    description: 'Can register dogs and log on-site vaccinations',
    icon: User,
    color: 'text-emerald-600'
  },
  {
    id: 'clinic_vet',
    label: 'Clinic Vet',
    description: 'Can log all medical events and release dogs',
    icon: Stethoscope,
    color: 'text-purple-600'
  },
  {
    id: 'programme_manager',
    label: 'Programme Manager',
    description: 'Read-only access to all data and dashboard',
    icon: Layout,
    color: 'text-amber-600'
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Full access including user management',
    icon: ShieldCheck,
    color: 'text-red-600'
  },
];

const RoleChangeSheet: React.FC<RoleChangeSheetProps> = ({
  isOpen,
  onClose,
  currentRole,
  userName,
  onConfirm
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(selectedRole);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl p-6 pb-8">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Change Role</SheetTitle>
          <SheetDescription>
            Update permissions for <span className="font-semibold text-foreground">{userName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                )}
              >
                <div className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm',
                  role.color
                )}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{role.label}</span>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedRole === 'admin' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              Warning: This gives full system access, including the ability to manage other users and sensitive data.
            </p>
          </div>
        )}

        <SheetFooter className="mt-8">
          <Button
            className="h-12 w-full rounded-xl text-base font-bold"
            disabled={isSubmitting || selectedRole === currentRole}
            onClick={handleConfirm}
          >
            {isSubmitting ? 'Updating...' : 'Confirm Role Change'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RoleChangeSheet;

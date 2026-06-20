import React from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Bell, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BoosterReminder } from '@/types';

interface BoosterReminderCardProps {
  reminder: BoosterReminder;
  onDismiss: (reminder: BoosterReminder) => void;
}

export const BoosterReminderCard: React.FC<BoosterReminderCardProps> = ({ reminder, onDismiss }) => {
  const { status, due_date, dogs, vaccine_type, vaccination_event } = reminder;
  const dueDate = new Date(due_date);
  const today = new Date();
  const daysDiff = differenceInDays(dueDate, today);

  const statusStyles = {
    overdue: {
      border: 'border-l-[#EF4444]',
      bg: 'bg-[#FFF5F5]',
      icon: <AlertCircle className="text-[#EF4444]" size={14} />,
      textColor: 'text-[#EF4444]',
      label: `Overdue by ${Math.abs(daysDiff)} days`,
      badge: 'bg-[#EF4444] text-white hover:bg-[#EF4444]/90'
    },
    due_soon: {
      border: 'border-l-[#F59E0B]',
      bg: 'bg-white',
      icon: <Bell className="text-[#F59E0B]" size={14} />,
      textColor: 'text-[#F59E0B]',
      label: `Due in ${daysDiff} days`,
      badge: 'bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90'
    },
    pending: {
      border: 'border-l-[#6B7280]',
      bg: 'bg-white',
      icon: <Calendar className="text-[#6B7280]" size={14} />,
      textColor: 'text-[#6B7280]',
      label: `Due on ${format(dueDate, 'MMM d, yyyy')}`,
      badge: 'bg-[#6B7280] text-white hover:bg-[#6B7280]/90'
    },
    completed: {
      border: 'border-l-[#10B981]',
      bg: 'bg-white',
      icon: null,
      textColor: 'text-[#10B981]',
      label: 'Completed',
      badge: 'bg-[#10B981] text-white'
    },
    dismissed: {
      border: 'border-l-gray-200',
      bg: 'bg-gray-50',
      icon: null,
      textColor: 'text-gray-400',
      label: 'Dismissed',
      badge: 'bg-gray-200 text-gray-500'
    }
  };

  const style = statusStyles[status] || statusStyles.pending;

  return (
    <Card className={cn(
      "relative overflow-hidden border border-gray-200 rounded-[14px] shadow-sm p-[14px] border-l-4 transition-all",
      style.border,
      style.bg
    )}>
      {/* Row 1: Dog Info & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex-none">
            {dogs?.cover_image_url ? (
              <img
                src={dogs.cover_image_url}
                alt="Dog"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Calendar size={20} />
              </div>
            )}
          </div>
          <div>
            <p className="text-[12px] font-mono font-bold text-gray-900 leading-none mb-1">
              ID: {reminder.dog_id.split('-')[0].toUpperCase()}
            </p>
            <Badge className={cn("text-[10px] px-2 py-0 uppercase tracking-wider font-extrabold", style.badge)}>
              {status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div className="text-right">
           <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-100 text-[10px] font-bold uppercase py-0">
             {vaccine_type}
           </Badge>
        </div>
      </div>

      {/* Row 2 & 3: Due Date & Status Message */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          {style.icon}
          <span className={cn("text-[13px] font-bold", style.textColor)}>
            {style.label}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-[12px] text-gray-400 flex items-center gap-1">
            Original Vac: {vaccination_event ? format(new Date(vaccination_event.timestamp), 'MMM d, yyyy') : 'N/A'}
          </p>
          <p className="text-[12px] text-gray-400">
            Programme: {dogs?.programme_type.toUpperCase() || 'N/A'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex-1 h-9 text-[13px] font-bold text-[#0D7377] hover:text-[#0D7377] hover:bg-[#0D737710] rounded-lg"
        >
          <Link to={`/dog/${reminder.dog_id}`}>
            <Eye size={14} className="mr-1.5" />
            View Dog
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(reminder)}
          className="flex-1 h-9 text-[13px] font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Trash2 size={14} className="mr-1.5" />
          Dismiss
        </Button>
      </div>
    </Card>
  );
};

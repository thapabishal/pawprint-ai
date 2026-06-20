import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MapPin } from 'lucide-react';
import type { MatchResult } from '@/types';
import { Card } from '@/components/ui/card';

interface MatchCardProps {
  result: MatchResult;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ result, onClick }) => {
  const { dog, composite_score, gps_distance_metres } = result;

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return '#10B981';
    if (score >= 0.4) return '#F59E0B';
    return '#EF4444';
  };

  const getConfidenceLabel = (score: number) => {
    if (score > 0.7) return 'Strong match';
    if (score >= 0.4) return 'Possible match';
    return 'Weak match';
  };

  const color = getConfidenceColor(composite_score);
  const label = getConfidenceLabel(composite_score);

  // SVG Arc calculations
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const arcLength = (200 / 360) * circumference;
  const offset = arcLength * (1 - composite_score);

  const catchEvent = dog.events.find(e => e.event_type === 'catch');
  const catchDate = catchEvent ? new Date(catchEvent.timestamp) : new Date(dog.created_at);

  return (
    <Card
      className="bg-white border-[1.5px] border-[#E5E7EB] rounded-[14px] shadow-card p-3 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="w-[68px] h-[68px] rounded-[10px] border border-[#E5E7EB] overflow-hidden bg-gray-100 flex-shrink-0">
          {dog.cover_image_url ? (
              <img src={dog.cover_image_url}
              alt="Reference photo of dog for matching"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No photo
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <span className="font-mono text-[12px] text-gray-900 truncate">
              {dog.id.split('-')[0].toUpperCase()}
            </span>
            <span className="text-[12px] text-gray-500 whitespace-nowrap ml-2">
              {formatDistanceToNow(catchDate, { addSuffix: false })} ago
            </span>
          </div>

          <div className="text-[13px] font-medium text-gray-900 mb-0.5">
            Caught: {catchDate.toLocaleDateString()}
          </div>

          <div className="flex items-center text-[12px] text-[#6B7280] mb-0.5">
            <MapPin className="w-3 h-3 mr-1" />
            {Math.round(gps_distance_metres)}m from catch
          </div>

          {catchEvent?.notes && (
            <div className="text-[12px] text-gray-500 italic truncate">
              {catchEvent.notes}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="relative w-9 h-9">
          <svg className="w-9 h-9 -rotate-[190deg]" viewBox="0 0 40 40">
            {/* Background Arc */}
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth="4"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="transparent"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
            {Math.round(composite_score * 100)}%
          </div>
        </div>
        <span className="text-[13px] font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </Card>
  );
};

export default MatchCard;

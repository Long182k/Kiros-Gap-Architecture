import { cn } from '@/lib/utils';
import { MissingSkill } from '@/types/analysis';

interface MissingSkillBadgeProps {
  skill: MissingSkill;
  size?: 'sm' | 'md' | 'lg';
}

export function MissingSkillBadge({ skill, size = 'md' }: MissingSkillBadgeProps) {
  const priorityClasses = {
    high: 'bg-gap-high/15 text-gap-high border-gap-high/30',
    medium: 'bg-gap-medium/15 text-gap-medium border-gap-medium/30',
    low: 'bg-gap-low/15 text-gap-low border-gap-low/30',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        priorityClasses[skill.priority],
        sizeClasses[size]
      )}
    >
      <span className={cn(
        'rounded-full',
        skill.priority === 'high' && 'h-1.5 w-1.5 bg-gap-high',
        skill.priority === 'medium' && 'h-1.5 w-1.5 bg-gap-medium',
        skill.priority === 'low' && 'h-1.5 w-1.5 bg-gap-low'
      )} />
      {skill.name}
    </span>
  );
}

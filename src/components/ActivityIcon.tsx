import React from 'react';
import * as LucideIcons from 'lucide-react';

interface ActivityIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ 
  iconName, 
  className = '', 
  size = 16 
}) => {
  const Icon = (LucideIcons as any)[iconName];
  
  if (!Icon) {
    // Fallback to StickyNote if icon not found
    const FallbackIcon = LucideIcons.StickyNote;
    return <FallbackIcon size={size} className={className} />;
  }
  
  return <Icon size={size} className={className} />;
};

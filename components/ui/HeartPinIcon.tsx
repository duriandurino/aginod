import React from 'react';
import Image from 'next/image';

interface HeartPinIconProps {
  className?: string;
  size?: number;
  alt?: string;
}

export const HeartPinIcon: React.FC<HeartPinIconProps> = ({ 
  className = "w-12 h-12", 
  size = 48,
  alt = "Aginod Heart Pin Icon"
}) => {
  return (
    <Image
      src="/assets/icons/heart-pin-icon.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
};

export default HeartPinIcon;

import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Skeleton, SkeletonCard } from './Skeleton';
import { EmptyState } from './EmptyState';
import { OwnerIcon as BaseIcon, IconName } from '../OwnerIcons';

const OwnerIcon = React.memo(BaseIcon);
export const Icon = OwnerIcon;

export const Heading1: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-3xl font-black text-gray-900 dark:text-white ${className}`}>{children}</h1>
);

export const Heading3: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 ${className}`}>{children}</h3>
);

export const Heading2: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-gray-800 dark:text-gray-100 ${className}`}>{children}</h2>
);

export const Text: React.FC<{ children: React.ReactNode; variant?: 'default' | 'muted'; className?: string }> = ({ children, variant = 'default', className = '' }) => (
  <p className={`${variant === 'muted' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'} ${className}`}>{children}</p>
);

export {
  Button,
  Card,
  Avatar,
  Badge,
  Modal,
  Input,
  Select,
  Skeleton,
  SkeletonCard,
  EmptyState,
  Icon,
  OwnerIcon
};

export type { IconName };

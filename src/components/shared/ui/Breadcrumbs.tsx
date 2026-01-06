
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface BreadcrumbsProps {
  items: string[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex text-xs text-gray-500 font-medium mb-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <OwnerIcon name="ChevronRight" className="w-3 h-3 mx-2 text-gray-300" />}
          <span className={index === items.length - 1 ? 'text-gyn-blue-medium font-bold' : ''}>{item}</span>
        </React.Fragment>
      ))}
    </nav>
  );
};

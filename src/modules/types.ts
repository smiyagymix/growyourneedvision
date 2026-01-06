import React from 'react';

export interface ModuleDefinition {
    id: string;
    label: string;
    icon: string;
    component: React.LazyExoticComponent<React.FC<any>>;
    tabs: string[];
    subnav?: Record<string, string[]>;
    roles?: string[]; // Defaults to ['Owner'] if undefined
    description?: string;
}

export type ModuleRegistry = Record<string, ModuleDefinition>;

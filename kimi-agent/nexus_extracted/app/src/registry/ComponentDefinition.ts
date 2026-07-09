import { ReactNode } from 'react';

/**
 * Definition for a UI component that can be rendered in the dynamic workspace.
 */
export interface ComponentDefinition {
  type: string;
  name: string;
  component: React.ComponentType<any>;
  description?: string;
  icon?: string;
}

/* eslint-disable react-refresh/only-export-components */
/**
 * Workgroup Context
 *
 * Global state management for workgroup filtering.
 * Provides selectedWorkgroup and workgroups list to all components.
 *
 * Features:
 * - Persists selection during session (not across page reloads)
 * - Loads cached workgroups from IndexedDB on mount
 * - Triggers API refresh when selection changes
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getAllWorkgroups } from '../services/db.service';
import type { Workgroup } from '../services/db.service';

// ============================================================================
// Context Types
// ============================================================================

interface WorkgroupContextValue {
  selectedWorkgroup: string | null;
  workgroups: Workgroup[];
  isLoading: boolean;
  setSelectedWorkgroup: (workgroupId: string | null) => void;
  setWorkgroups: (workgroups: Workgroup[]) => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const WorkgroupContext = createContext<WorkgroupContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface WorkgroupProviderProps {
  children: ReactNode;
}

export function WorkgroupProvider({ children }: WorkgroupProviderProps) {
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string | null>(null);
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached workgroups on mount
  useEffect(() => {
    async function loadCachedWorkgroups() {
      try {
        setIsLoading(true);
        const cached = await getAllWorkgroups();

        // Sort workgroups alphabetically by name
        const sorted = cached.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

        setWorkgroups(sorted);
        console.log(`[WorkgroupContext] Loaded ${sorted.length} workgroups from cache`);
      } catch (error) {
        console.error('[WorkgroupContext] Failed to load cached workgroups:', error);
        setWorkgroups([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCachedWorkgroups();
  }, []);

  const value: WorkgroupContextValue = {
    selectedWorkgroup,
    workgroups,
    isLoading,
    setSelectedWorkgroup,
    setWorkgroups,
  };

  return <WorkgroupContext.Provider value={value}>{children}</WorkgroupContext.Provider>;
}

// ============================================================================
// Hook for Consuming Context
// ============================================================================

/**
 * Custom hook to access WorkgroupContext
 * Throws error if used outside WorkgroupProvider
 *
 * @returns WorkgroupContextValue
 *
 * @example
 * const { selectedWorkgroup, setSelectedWorkgroup } = useWorkgroup();
 */
export function useWorkgroup(): WorkgroupContextValue {
  const context = useContext(WorkgroupContext);

  if (context === undefined) {
    throw new Error('useWorkgroup must be used within a WorkgroupProvider');
  }

  return context;
}

// ============================================================================
// Export Context (for testing)
// ============================================================================

export { WorkgroupContext };

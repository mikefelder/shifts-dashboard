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
 * - Supports committee configuration (single committee or global mode)
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getAllWorkgroups } from '../services/db.service';
import type { Workgroup } from '../services/db.service';
import { getWorkgroups } from '../services/api.service';
import { committeeConfig } from '../config/committee.config';
import logger from '../utils/logger';

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
  // Initialize with configured workgroup if in single committee mode
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string | null>(
    committeeConfig.filterMode === 'single' ? committeeConfig.workgroupIds[0] : null
  );
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to filter workgroups based on committee config
  const filterWorkgroups = (wgs: Workgroup[]): Workgroup[] => {
    // Sort workgroups alphabetically by name
    const sorted = wgs.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );

    switch (committeeConfig.filterMode) {
      case 'ids': {
        const idSet = new Set(committeeConfig.workgroupIds);
        return sorted.filter((wg) => idSet.has(wg.id));
      }
      case 'codes': {
        const codeSet = new Set(committeeConfig.workgroupCodes);
        return sorted.filter((wg) => wg.code && codeSet.has(wg.code));
      }
      case 'single': {
        return sorted.filter((wg) => wg.id === committeeConfig.workgroupIds[0]);
      }
      case 'global':
      default: {
        return sorted;
      }
    }
  };

  // Load and sync workgroups on mount
  useEffect(() => {
    async function loadAndSyncWorkgroups() {
      try {
        setIsLoading(true);

        // 1. Load from cache first for instant display
        const cached = await getAllWorkgroups();

        const cachedFiltered = filterWorkgroups(cached);
        setWorkgroups(cachedFiltered);

        if (cached.length > 0) {
          logger.info(
            `[WorkgroupContext] Loaded ${cachedFiltered.length} workgroups from cache (${committeeConfig.filterMode} mode)`
          );
        }

        // 2. Sync from backend to get fresh data
        const { data: fresh, isFreshData } = await getWorkgroups(true);

        if (isFreshData) {
          const freshFiltered = filterWorkgroups(fresh);
          setWorkgroups(freshFiltered);

          switch (committeeConfig.filterMode) {
            case 'ids':
              logger.info(
                `[WorkgroupContext] Synced ${freshFiltered.length} of ${fresh.length} workgroups (IDs: ${committeeConfig.workgroupIds.join(', ')})`
              );
              break;
            case 'codes':
              logger.info(
                `[WorkgroupContext] Synced ${freshFiltered.length} of ${fresh.length} workgroups (Codes: ${committeeConfig.workgroupCodes.join(', ')})`
              );
              break;
            case 'single':
              logger.info(
                `[WorkgroupContext] Synced single committee: ${committeeConfig.name} (${committeeConfig.workgroupIds[0]})`
              );
              break;
            case 'global':
            default:
              logger.info(`[WorkgroupContext] Synced ${fresh.length} workgroups (global mode)`);
              break;
          }
        }
      } catch (error) {
        logger.error('[WorkgroupContext] Failed to load and sync workgroups:', error);
        setWorkgroups([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndSyncWorkgroups();
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

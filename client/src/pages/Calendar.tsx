/**
 * Calendar Page
 *
 * Main page for viewing active shifts in timeline format.
 * Fetches shift data and passes to ActiveShiftsView component.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import ActiveShiftsView from '../components/Calendar/ActiveShiftsView';
import { getShifts } from '../services/api.service';
import type { GroupedShift } from '../types/shift.types';
import { useWorkgroup } from '../contexts/WorkgroupContext';

interface RefreshContext {
  refreshTimestamp: number;
  refreshInterval: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

export default function Calendar() {
  const [shifts, setShifts] = useState<GroupedShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreshData, setIsFreshData] = useState(true);

  const { selectedWorkgroup } = useWorkgroup();
  const context = useOutletContext<RefreshContext>();
  const refreshTimestamp = context?.refreshTimestamp || Date.now();

  // Fetch shifts on mount and when refresh is triggered
  useEffect(() => {
    let mounted = true;

    async function loadShifts() {
      try {
        setLoading(true);
        setError(null);

        console.log('[Calendar] Fetching shifts...', {
          workgroup: selectedWorkgroup || 'all',
          forceSync: true,
        });

        const result = await getShifts({
          forceSync: true,
          workgroupId: selectedWorkgroup || undefined,
        });

        if (!mounted) return;

        setShifts(result.data);
        setIsFreshData(result.isFreshData);
        setLoading(false);

        console.log('[Calendar] Loaded shifts:', {
          count: result.data.length,
          fresh: result.isFreshData,
          lastSync: result.lastSync,
        });
      } catch (err) {
        if (!mounted) return;

        console.error('[Calendar] Failed to load shifts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shifts');
        setLoading(false);
      }
    }

    loadShifts();

    return () => {
      mounted = false;
    };
  }, [refreshTimestamp, selectedWorkgroup]);

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Active Shifts Timeline
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Viewing {selectedWorkgroup ? 'filtered' : 'all'} shifts
      </Typography>

      <Box mt={3}>
        <ActiveShiftsView shifts={shifts} loading={loading} isFreshData={isFreshData} />
      </Box>
    </Box>
  );
}

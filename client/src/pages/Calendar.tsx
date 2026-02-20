/**
 * Calendar Page
 *
 * Main page for viewing active shifts in timeline format.
 * Fetches shift data and passes to ActiveShiftsView component.
 */

import { useState, useEffect } from 'react';
import { Container, Typography, Alert, Box } from '@mui/material';
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
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

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
        setLastFetched(new Date());
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
      <Container maxWidth={false} disableGutters sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {lastFetched && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          Last fetched: {lastFetched.toLocaleTimeString()}
        </Typography>
      )}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <ActiveShiftsView shifts={shifts} loading={loading} isFreshData={isFreshData} />
      </Box>
    </Container>
  );
}

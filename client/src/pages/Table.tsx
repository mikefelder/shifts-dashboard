/**
 * Table Page Component
 *
 * Page wrapper for TabularShiftView - fetches shift data and passes to table component.
 * Integrates with WorkgroupContext for filtering and AppLayout for refresh coordination.
 */

import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert, Box } from '@mui/material';
import TabularShiftView from '../components/Calendar/TabularShiftView';
import ShiftDetailModal from '../components/Calendar/ShiftDetailModal';
import PersonDetailModal from '../components/Calendar/PersonDetailModal';
import { useWorkgroup } from '../contexts/WorkgroupContext';
import { getShifts } from '../services/api.service';
import type { GroupedShift } from '../types/shift.types';
import type { RefreshContext } from '../components/Layout/AppLayout';

export default function Table() {
  const { refreshTimestamp } = useOutletContext<RefreshContext>();
  const { selectedWorkgroup } = useWorkgroup();
  const [shifts, setShifts] = useState<GroupedShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreshData, setIsFreshData] = useState(true);
  const [lastSync, setLastSync] = useState('Never');
  const [selectedShift, setSelectedShift] = useState<GroupedShift | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPersonName, setSelectedPersonName] = useState('');
  const [selectedPersonClockedIn, setSelectedPersonClockedIn] = useState(false);
  const [personModalOpen, setPersonModalOpen] = useState(false);

  function handleShiftClick(shift: GroupedShift) {
    setSelectedShift(shift);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
  }

  function handlePersonClick(personId: string, personName: string, isClockedIn: boolean) {
    setSelectedPersonId(personId);
    setSelectedPersonName(personName);
    setSelectedPersonClockedIn(isClockedIn);
    setPersonModalOpen(true);
  }

  function handlePersonModalClose() {
    setPersonModalOpen(false);
  }

  // Fetch shifts when refresh triggered or workgroup changes
  useEffect(() => {
    let mounted = true;

    async function fetchShifts() {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {
          forceSync: 'true',
        };

        if (selectedWorkgroup) {
          params.workgroup = selectedWorkgroup;
        }

        const response = await getShifts(params);

        if (!mounted) return;

        setShifts(response.data);
        setIsFreshData(response.isFreshData);
        setLastSync(
          new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load shifts');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchShifts();

    return () => {
      mounted = false;
    };
  }, [refreshTimestamp, selectedWorkgroup]);

  // Filter shifts by workgroup (client-side for cached data)
  const filteredShifts = useMemo(() => {
    if (!selectedWorkgroup) return shifts;
    return shifts.filter((shift) => shift.workgroup === selectedWorkgroup);
  }, [shifts, selectedWorkgroup]);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TabularShiftView
        shifts={filteredShifts}
        loading={loading}
        isFreshData={isFreshData}
        lastSync={lastSync}
        onShiftClick={handleShiftClick}
        onPersonClick={handlePersonClick}
      />

      {/* Shift Detail Modal */}
      <ShiftDetailModal
        shift={selectedShift}
        open={modalOpen}
        onClose={handleModalClose}
        onPersonClick={handlePersonClick}
      />

      {/* Person Detail Modal */}
      <PersonDetailModal
        personId={selectedPersonId}
        personName={selectedPersonName}
        isClockedIn={selectedPersonClockedIn}
        open={personModalOpen}
        onClose={handlePersonModalClose}
      />
    </Box>
  );
}

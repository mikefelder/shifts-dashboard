import { useState, useEffect } from 'react';
import { 
    Container, Box, Typography, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TableSortLabel, Chip, IconButton, Paper, useTheme,
    Fade, Grow
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { WhosOnResponse, Shift } from '../../types/shift.types';
import { getWorkgroupShifts } from '../../services/api.service';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { ShiftDetailModal } from './ShiftDetailModal';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { dbService } from '../../services/db.service';
import { useOutletContext } from 'react-router-dom';
import { PersonDetailModal } from './PersonDetailModal';
import { Account } from '../../types/shift.types';

// Sort direction type
type SortDirection = 'asc' | 'desc';

// Column definition for sorting
interface HeadCell {
    id: string;
    label: string;
    numeric: boolean;
    sortable: boolean;
}

// Define the sortable columns
const headCells: HeadCell[] = [
    { id: 'startTime', label: 'Start Time', numeric: false, sortable: true },
    { id: 'endTime', label: 'End Time', numeric: false, sortable: true },
    { id: 'name', label: 'Shift Name', numeric: false, sortable: true },
    { id: 'subject', label: 'Subject', numeric: false, sortable: true },
    { id: 'location', label: 'Location', numeric: false, sortable: true },
    { id: 'assignedPeople', label: 'Assigned People', numeric: false, sortable: true },
    { id: 'status', label: 'Status', numeric: false, sortable: true },
    { id: 'actions', label: 'Actions', numeric: false, sortable: false },
];

interface RefreshContext {
    refreshInterval: number;
    refreshTimestamp: number;
    triggerRefresh: () => void;
}

export const TabularShiftView = () => {
    const theme = useTheme();
    const { selectedWorkgroup, setWorkgroups } = useWorkgroup();
    const { refreshTimestamp, triggerRefresh } = useOutletContext<RefreshContext>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<WhosOnResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [orderBy, setOrderBy] = useState<string>('startTime');
    const [order, setOrder] = useState<SortDirection>('asc');
    const [lastApiRefresh, setLastApiRefresh] = useState<string>('Never');
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);
    const [loadingType, setLoadingType] = useState<'initial' | 'refresh'>('initial');
    const [animateRows, setAnimateRows] = useState(false);
    const [apiSyncSuccess, setApiSyncSuccess] = useState<boolean | null>(null);
    const [personModalOpen, setPersonModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Account | null>(null);
    const [selectedPersonClocked, setSelectedPersonClocked] = useState<boolean>(false);
    
    // Initial effect to load last API refresh time
    useEffect(() => {
        async function loadLastRefreshTime() {
            const formattedTime = await dbService.getLastSyncFormatted();
            setLastApiRefresh(formattedTime);
        }
        loadLastRefreshTime();
    }, []);

    // Effect for initial data load
    useEffect(() => {
        if (!initialDataLoaded) {
            setLoadingType('initial');
            loadData(true); // Force sync on first load
            setInitialDataLoaded(true);
        }
    }, []);

    // Effect to handle workgroup changes
    useEffect(() => {
        if (initialDataLoaded) {
            loadData(true); // Force sync when filtering by workgroup
        }
    }, [selectedWorkgroup, initialDataLoaded]);
    
    // Effect to handle refresh timestamp changes (auto refresh)
    useEffect(() => {
        if (initialDataLoaded && refreshTimestamp) {
            console.log('Auto refresh triggered in TabularShiftView at:', new Date().toISOString());
            loadData(true); // Force sync on auto refresh
        }
    }, [refreshTimestamp, initialDataLoaded]);

    const loadData = async (forceSync = false) => {
        try {
            // Set loading type based on whether we have data already
            if (data?.result) {
                setLoadingType('refresh');
            } else {
                setLoadingType('initial');
            }
            
            setLoading(true);
            
            // Pass the selected workgroup ID to the API service and force sync for fresh data
            const response = await getWorkgroupShifts(forceSync, selectedWorkgroup);
            
            // Get ready to animate changes
            if (data?.result) {
                setAnimateRows(true);
                // Reset animation flag after animation completes
                setTimeout(() => setAnimateRows(false), 1000);
            }
            
            setData(response);
            if (response.result?.referenced_objects?.workgroup) {
                setWorkgroups(response.result.referenced_objects.workgroup);
            }
            
            // Update timestamp display only on successful API refresh
            setLastRefresh(new Date());
            const formattedTime = await dbService.getLastSyncFormatted();
            setLastApiRefresh(formattedTime);
            
            // Mark sync as successful
            setApiSyncSuccess(true);
            setError(null);
            
        } catch (err) {
            setError('Failed to load shifts');
            console.error(err);
            
            // Mark sync as failed, but don't update the timestamp
            setApiSyncSuccess(false);
            
            // We explicitly don't update lastRefresh here to keep the last successful refresh time
        } finally {
            setLoading(false);
        }
    };

    // Use triggerRefresh from outlet context for manual refresh
    const refreshData = () => {
        console.log('Manual refresh triggered in TabularShiftView');
        triggerRefresh();
    };

    // Handler for click on table header for sorting
    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Handler for info button click to show shift details
    const handleShiftClick = (shift: Shift) => {
        setSelectedShift(shift);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    // Handler for person chip click to show person details
    const handlePersonClick = (event: React.MouseEvent, personName: string, isClocked: boolean, shift: Shift) => {
        // Prevent the click from bubbling up to the table row
        event.stopPropagation();
        
        // Find the account that matches this name
        if (data?.result?.referenced_objects.account) {
            // Find person by name in account list
            const person = data.result.referenced_objects.account.find(acc => {
                const displayName = acc.screen_name || `${acc.first_name} ${acc.last_name}`;
                return displayName === personName;
            });
            
            if (person) {
                console.log("Selected person data:", person); // Debug log to check account data
                setSelectedPerson(person);
                setSelectedPersonClocked(isClocked);
                setPersonModalOpen(true);
            }
        }
    };
    
    // Close person modal
    const handleClosePersonModal = () => {
        setPersonModalOpen(false);
    };

    // Function to determine sort value based on column
    const getSortValue = (shift: Shift, column: string) => {
        switch (column) {
            case 'startTime':
                return shift.local_start_date || '';
            case 'endTime':
                return shift.local_end_date || '';
            case 'name':
                return shift.name || '';
            case 'subject':
                return shift.subject || '';
            case 'location':
                return shift.location || '';
            case 'assignedPeople':
                return (shift.assignedPersonNames || []).join(', ').toLowerCase();
            case 'status':
                // Sort by percentage of clocked in people
                const clockedIn = (shift.clockStatuses || []).filter(Boolean).length;
                const total = (shift.assignedPeople || []).length;
                return clockedIn / Math.max(1, total);
            default:
                return '';
        }
    };

    // Format start/end times
    const formatTime = (dateString?: string) => {
        if (!dateString) return 'No time';
        
        try {
            return format(parseISO(dateString), 'h:mm a');
        } catch (e) {
            return 'Invalid time';
        }
    };

    // Define status chip based on clock-in status
    const renderStatusChip = (shift: Shift) => {
        if (!shift.assignedPeople || shift.assignedPeople.length === 0) {
            return <Chip size="small" label="Unassigned" color="default" />;
        }

        const clockedInCount = (shift.clockStatuses || []).filter(Boolean).length;
        const total = shift.assignedPeople.length;
        
        if (clockedInCount === 0) {
            return (
                <Chip 
                    size="small" 
                    icon={<CancelIcon />} 
                    label="Not Clocked In" 
                    color="error" 
                />
            );
        } else if (clockedInCount === total) {
            return (
                <Chip 
                    size="small" 
                    icon={<CheckCircleIcon />} 
                    label="All Clocked In" 
                    color="success" 
                />
            );
        } else {
            return (
                <Chip 
                    size="small" 
                    label={`${clockedInCount}/${total} Clocked In`} 
                    color="warning" 
                    variant="outlined"
                />
            );
        }
    };

    // Success color for clocked-in styling
    const successColor = theme.palette.success.main;
    const successDarkColor = theme.palette.success.dark;

    // Function to render a person chip with correct styling based on clocked-in status
    const renderPersonChip = (name: string, isClocked: boolean, index: number, shift: Shift) => {
        return (
            <Chip 
                key={index}
                size="small"
                icon={<PersonIcon sx={{ color: isClocked ? 'white' : undefined }} />}
                label={name}
                onClick={(e) => handlePersonClick(e, name, isClocked, shift)}
                sx={{ 
                    backgroundColor: isClocked 
                        ? successColor 
                        : undefined,
                    color: isClocked ? 'white' : 'text.primary',
                    fontWeight: isClocked ? 600 : 400,
                    '& .MuiChip-icon': {
                        color: isClocked ? 'white !important' : undefined,
                    },
                    '&:hover': {
                        backgroundColor: isClocked 
                            ? successDarkColor
                            : undefined,
                        cursor: 'pointer'
                    }
                }}
            />
        );
    };

    // Show initial loading spinner if we don't have any data yet
    if (loadingType === 'initial' && loading && !data?.result) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }
    
    if (error && !data?.result) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    // Initialize data array even if result is not yet available
    const filteredShifts = selectedWorkgroup && data?.result
        ? data.result.shifts.filter(shift => shift.workgroup === selectedWorkgroup)
        : data?.result?.shifts || [];
        
    // Sort the pre-grouped shifts
    const sortedShifts = filteredShifts.sort((a, b) => {
        const valueA = getSortValue(a, orderBy);
        const valueB = getSortValue(b, orderBy);

        if (order === 'asc') {
            if (valueA < valueB) return -1;
            if (valueA > valueB) return 1;
            return 0;
        } else {
            if (valueA > valueB) return -1;
            if (valueA < valueB) return 1;
            return 0;
        }
    });

    // Navy blue color from theme
    const navyBlue = theme.palette.primary.dark;

    // Format a nice timestamp display that shows both refresh time and sync status
    const getTimestampDisplay = () => {
        // Base refresh timestamp
        const refreshTime = `Last refreshed: ${format(lastRefresh, 'h:mm:ss a')}`;
        
        // If sync status is unknown (null), just show the time
        if (apiSyncSuccess === null) {
            return refreshTime;
        }
        
        // If we just refreshed from API successfully
        if (apiSyncSuccess && lastApiRefresh && lastApiRefresh.includes('Today')) {
            return `${refreshTime} (API sync completed)`;
        }
        
        // If API sync failed
        if (apiSyncSuccess === false) {
            return `${refreshTime} (Last successful refresh - API sync failed)`;
        }
        
        // Otherwise just show refresh time
        return refreshTime;
    };

    return (
        <Container 
            maxWidth={false}
            disableGutters
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden'
            }}
        >
            <Box sx={{ 
                mb: 2, 
                ml: 2,
                mr: 2,
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                        variant="caption" 
                        color={apiSyncSuccess === false ? "error.main" : "textSecondary"} 
                        sx={{ 
                            mr: 1,
                            fontWeight: apiSyncSuccess === false ? 'medium' : 'normal'
                        }}
                    >
                        {getTimestampDisplay()}
                    </Typography>
                    
                    {/* Show inline loading indicator during refresh */}
                    {loadingType === 'refresh' && loading && (
                        <Fade in={true}>
                            <CircularProgress size={16} sx={{ ml: 1 }} />
                        </Fade>
                    )}
                </Box>
            </Box>

            <Paper sx={{ 
                width: '100%', 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%', // Make the paper take full height
            }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                    <Typography 
                        variant="h6" 
                        sx={{ 
                            color: 'primary.main',
                            fontWeight: 600
                        }}
                    >
                        {format(new Date(), 'EEEE, MMMM d, yyyy')} - Daily Schedule
                        <Typography component="span" variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                            ({sortedShifts.length} shifts)
                        </Typography>
                    </Typography>
                </Box>
                
                {/* Updated TableContainer to use full available height */}
                <TableContainer sx={{ 
                    flexGrow: 1,  // Take up all available space
                    height: '100%',  // Full height
                    maxHeight: 'calc(100vh - 180px)'  // Limit max height to avoid overflow
                }}>
                    <Table stickyHeader aria-label="shifts table" size="small">
                        <TableHead>
                            <TableRow>
                                {headCells.map((headCell) => (
                                    <TableCell
                                        key={headCell.id}
                                        align={headCell.numeric ? 'right' : 'left'}
                                        sortDirection={orderBy === headCell.id ? order : false}
                                        sx={{ 
                                            fontWeight: 'bold',
                                            backgroundColor: theme.palette.primary.main,
                                            color: 'white'
                                        }}
                                    >
                                        {headCell.sortable ? (
                                            <TableSortLabel
                                                active={orderBy === headCell.id}
                                                direction={orderBy === headCell.id ? order : 'asc'}
                                                onClick={() => handleRequestSort(headCell.id)}
                                                sx={{ 
                                                    '&.MuiTableSortLabel-root': {
                                                        color: 'white',
                                                    },
                                                    '&.MuiTableSortLabel-root:hover': {
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                    },
                                                    '&.Mui-active': {
                                                        color: 'white',
                                                    },
                                                    '& .MuiTableSortLabel-icon': {
                                                        color: 'white !important',
                                                    },
                                                }}
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        ) : (
                                            headCell.label
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedShifts.length > 0 ? (
                                sortedShifts.map((shift, index) => (
                                    <Grow
                                        key={`${shift.id}-${(shift.assignedPeople || []).join('-')}`}
                                        in={!loading || loadingType === 'refresh'}
                                        style={{ 
                                            transformOrigin: '0 0 0',
                                            // Stagger animation for rows but limit delay for large datasets
                                            transitionDelay: animateRows ? `${Math.min(index * 15, 300)}ms` : '0ms' 
                                        }}
                                        timeout={animateRows ? 300 : 0}
                                    >
                                        <TableRow
                                            hover
                                            sx={{ 
                                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                                                transition: 'background-color 0.3s ease'
                                            }}
                                        >
                                            <TableCell>{formatTime(shift.local_start_date)}</TableCell>
                                            <TableCell>{formatTime(shift.local_end_date)}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{shift.name}</TableCell>
                                            <TableCell>{shift.subject}</TableCell>
                                            <TableCell>{shift.location}</TableCell>
                                            <TableCell>
                                                {(!shift.assignedPersonNames || shift.assignedPersonNames.length === 0) ? (
                                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                        No one assigned
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {shift.assignedPersonNames.map((name, index) => 
                                                            renderPersonChip(
                                                                name, 
                                                                shift.clockStatuses?.[index] || false, 
                                                                index,
                                                                shift
                                                            )
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {renderStatusChip(shift)}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleShiftClick(shift)}
                                                    sx={{ color: navyBlue }}
                                                >
                                                    <InfoIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    </Grow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {loading ? 'Loading shifts...' : 'No shifts scheduled for this day'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                {/* Overlay loading indicator only during initial load with data */}
                {loadingType === 'initial' && loading && data?.result && (
                    <Box 
                        sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            zIndex: 10
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
            </Paper>

            {/* Add the person detail modal */}
            <PersonDetailModal
                open={personModalOpen}
                onClose={handleClosePersonModal}
                account={selectedPerson}
                isClocked={selectedPersonClocked}
            />
            
            {/* Existing shift detail modal */}
            {selectedShift && (
                <ShiftDetailModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    shift={selectedShift}
                    accounts={data?.result?.referenced_objects.account || []}
                />
            )}
        </Container>
    );
};

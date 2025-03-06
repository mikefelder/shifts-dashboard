import { useState, useEffect } from 'react';
import { 
    Container, Box, Typography, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TableSortLabel, Chip, IconButton, Paper, useTheme
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { WorkgroupFilter } from '../Filters/WorkgroupFilter';
import { WhosOnResponse, Shift, Account } from '../../types/shift.types';
import { getWorkgroupShifts } from '../../services/api.service';
import { useWorkgroup } from '../../contexts/WorkgroupContext';
import { ShiftDetailModal } from './ShiftDetailModal';
import PersonIcon from '@mui/icons-material/Person';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

// GroupedShift interface for combining shift data
interface GroupedShift extends Shift {
    assignedPeople: string[];
    clockStatuses: boolean[];
    assignedPersonNames: string[];
}

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

export const TabularShiftView = () => {
    const theme = useTheme();
    const { selectedWorkgroup, setWorkgroups } = useWorkgroup();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<WhosOnResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<GroupedShift | null>(null);
    const [orderBy, setOrderBy] = useState<string>('startTime');
    const [order, setOrder] = useState<SortDirection>('asc');

    useEffect(() => {
        loadData();
    }, [selectedWorkgroup]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await getWorkgroupShifts(true);
            setData(response);
            setWorkgroups(response.result.referenced_objects.workgroup);
            setLastRefresh(new Date());
        } catch (err) {
            setError('Failed to load shifts');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Handler for click on table header for sorting
    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Handler for info button click to show shift details
    const handleShiftClick = (shift: GroupedShift) => {
        setSelectedShift(shift);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    // Group shifts by common attributes (same shift with different people)
    const groupShiftsByAttributes = (inputShifts: Shift[], accountsList: Account[]): GroupedShift[] => {
        if (!Array.isArray(inputShifts)) {
            console.error('Input shifts is not an array');
            return [];
        }
        
        if (!Array.isArray(accountsList)) {
            console.error('Accounts is not an array');
            return [];
        }
        
        const shiftGroups: { [key: string]: GroupedShift } = {};
        
        inputShifts.forEach(shift => {
            // Skip invalid shifts
            if (!shift || typeof shift !== 'object') return;
            
            try {
                // Ensure required properties exist
                const shiftName = shift.name || 'Unnamed Shift';
                const startDate = shift.local_start_date || new Date().toISOString();
                const endDate = shift.local_end_date || new Date().toISOString();
                const workgroup = shift.workgroup || '';
                const subject = shift.subject || '';
                const location = shift.location || '';
                
                // Create a unique key for each distinct shift (excluding who is assigned)
                const shiftKey = `${shiftName}-${startDate}-${endDate}-${workgroup}-${subject}-${location}`;
                
                // Find person name from accounts
                const person = accountsList.find(acc => acc && acc.id === shift.covering_member);
                const personName = person 
                    ? (person.screen_name || `${person.first_name} ${person.last_name}`) 
                    : 'Unassigned';
                
                if (!shiftGroups[shiftKey]) {
                    // Create a new group with the first person
                    shiftGroups[shiftKey] = {
                        ...shift,
                        assignedPeople: shift.covering_member ? [shift.covering_member] : [],
                        clockStatuses: shift.clocked_in !== undefined ? [shift.clocked_in] : [],
                        assignedPersonNames: personName !== 'Unassigned' ? [personName] : []
                    };
                } else {
                    // Add this person to the existing group if they're not already included
                    if (shift.covering_member && 
                        !shiftGroups[shiftKey].assignedPeople.includes(shift.covering_member)) {
                        shiftGroups[shiftKey].assignedPeople.push(shift.covering_member);
                        shiftGroups[shiftKey].clockStatuses.push(
                            shift.clocked_in !== undefined ? shift.clocked_in : false
                        );
                        if (personName !== 'Unassigned') {
                            shiftGroups[shiftKey].assignedPersonNames.push(personName);
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing shift:', error, shift);
            }
        });
        
        return Object.values(shiftGroups);
    };

    // Function to determine sort value based on column
    const getSortValue = (shift: GroupedShift, column: string) => {
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
                return clockedIn / Math.max(1, (shift.assignedPeople || []).length);
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
    const renderStatusChip = (shift: GroupedShift) => {
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

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
        </Box>
    );
    
    if (error) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Typography color="error">{error}</Typography>
        </Box>
    );

    if (!data?.result) return null;

    // Filter shifts by workgroup if selected
    const filteredShifts = selectedWorkgroup
        ? data.result.shifts.filter(shift => shift.workgroup === selectedWorkgroup)
        : data.result.shifts;

    // Create grouped shifts and sort them
    const groupedShifts = (() => {
        try {
            const groups = groupShiftsByAttributes(filteredShifts, data.result.referenced_objects.account);
            
            return groups.sort((a, b) => {
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
        } catch (error) {
            console.error('Error in groupedShifts:', error);
            return [];
        }
    })();

    // Navy blue color from theme
    const navyBlue = theme.palette.primary.dark;

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
                <Typography variant="caption" color="textSecondary">
                    Last updated: {format(lastRefresh, 'h:mm:ss a')}
                </Typography>
            </Box>

            <Paper sx={{ 
                width: '100%', 
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '8px',
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
                            ({groupedShifts.length} shifts)
                        </Typography>
                    </Typography>
                </Box>
                
                <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                            {groupedShifts.length > 0 ? (
                                groupedShifts.map((shift) => (
                                    <TableRow
                                        key={`${shift.id}-${(shift.assignedPeople || []).join('-')}`}
                                        hover
                                        sx={{ 
                                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
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
                                                    {shift.assignedPersonNames.map((name, index) => (
                                                        <Chip 
                                                            key={index}
                                                            size="small"
                                                            icon={<PersonIcon />}
                                                            label={name}
                                                            sx={{ 
                                                                backgroundColor: shift.clockStatuses && shift.clockStatuses[index] 
                                                                    ? `${theme.palette.success.main}20` 
                                                                    : undefined
                                                            }}
                                                        />
                                                    ))}
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No shifts scheduled for this day
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {selectedShift && (
                <ShiftDetailModal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    shift={selectedShift}
                    accounts={data.result.referenced_objects.account}
                />
            )}
        </Container>
    );
};

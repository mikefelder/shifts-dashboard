import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Divider, Chip, Grid, useTheme
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { Shift, Account } from '../../types/shift.types';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface ShiftDetailModalProps {
    open: boolean;
    onClose: () => void;
    shift: Shift & { 
        assignedPeople?: string[];
        clockStatuses?: boolean[];
    };
    accounts: Account[];
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({ 
    open, 
    onClose, 
    shift, 
    accounts 
}) => {
    const theme = useTheme();
    
    // Get assigned people from either the new format or legacy format
    const getAssignedPeople = () => {
        if (shift.assignedPeople && Array.isArray(shift.assignedPeople)) {
            // New format with grouped shifts
            return shift.assignedPeople.map((memberId, index) => ({
                account: accounts.find(acc => acc.id === memberId),
                clockedIn: shift.clockStatuses ? shift.clockStatuses[index] : false
            })).filter(item => item.account);
        } else if (shift.covering_member) {
            // Legacy format with single person
            return [{
                account: accounts.find(acc => acc.id === shift.covering_member),
                clockedIn: shift.clocked_in || false
            }].filter(item => item.account);
        }
        return [];
    };

    const assignedPeople = getAssignedPeople();
    
    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'MMM d, yyyy h:mm a');
        } catch (e) {
            return dateString;
        }
    };

    // Define navy blue color from theme
    const navyBlue = theme.palette.primary.dark;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{ 
                bgcolor: 'secondary.main', 
                color: 'white',
                fontWeight: 'bold',
                pb: 1 
            }}>
                {shift.name}
                <Typography variant="subtitle2" sx={{ fontWeight: 'normal', mt: 0.5 }}>
                    {shift.subject || 'No Subject'}
                </Typography>
            </DialogTitle>
            
            <DialogContent sx={{ py: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        {/* Left Column - Shift Details */}
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="body1" fontWeight={500}>Time</Typography>
                                <Typography variant="body2">
                                    {formatDate(shift.local_start_date)} - {formatDate(shift.local_end_date)}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="body1" fontWeight={500}>Location</Typography>
                                <Typography variant="body2">
                                    {shift.location || 'Not specified'}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="body1" fontWeight={500}>Workgroup</Typography>
                                <Typography variant="body2">
                                    {shift.workgroup || 'Not assigned'}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        {/* Right Column - Assigned People */}
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mb: 2, 
                                color: navyBlue,
                                fontWeight: 600
                            }}
                        >
                            Assigned People ({assignedPeople.length})
                        </Typography>
                        
                        {assignedPeople.length === 0 ? (
                            <Typography variant="body2" fontStyle="italic">
                                No one assigned to this shift
                            </Typography>
                        ) : (
                            <Box>
                                {assignedPeople.map((person, index) => (
                                    <Box 
                                        key={person.account?.id || index}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 2,
                                            p: 1.5,
                                            bgcolor: 'background.paper',
                                            borderRadius: 1,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            borderLeft: `4px solid ${navyBlue}`
                                        }}
                                    >
                                        <PersonIcon sx={{ mr: 2, color: navyBlue }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography 
                                                variant="body1"
                                                sx={{ 
                                                    color: navyBlue,
                                                    fontWeight: 500
                                                }}
                                            >
                                                {person.account?.screen_name || 
                                                  `${person.account?.first_name} ${person.account?.last_name}`}
                                            </Typography>
                                        </Box>
                                        <Chip 
                                            icon={person.clockedIn ? 
                                                <CheckCircleIcon /> : 
                                                <CancelIcon />}
                                            label={person.clockedIn ? "Clocked In" : "Not Clocked In"}
                                            color={person.clockedIn ? "success" : "default"}
                                            size="small"
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            
            <DialogActions>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                    sx={{ 
                        color: navyBlue,
                        borderColor: navyBlue,
                        '&:hover': {
                            borderColor: navyBlue,
                            backgroundColor: `${navyBlue}0A`
                        }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

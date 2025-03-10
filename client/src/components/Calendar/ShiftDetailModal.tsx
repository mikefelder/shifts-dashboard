import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Chip, Grid
} from '@mui/material';
import { Shift, Account } from '../../types/shift.types';
import { format, parseISO } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

interface ShiftDetailModalProps {
    open: boolean;
    onClose: () => void;
    shift: Shift;
    accounts: Account[];
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({ open, onClose, shift, accounts }) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'PPP p'); // e.g., "Apr 29, 2021, 9:30 AM"
        } catch (e) {
            return 'Invalid date';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                <Typography variant="h6" component="div" fontWeight="bold">
                    {shift.name}
                </Typography>
                {shift.subject && (
                    <Typography variant="body2" color="text.secondary">
                        {shift.subject}
                    </Typography>
                )}
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="body2" color="text.secondary">Time</Typography>
                                <Typography>
                                    {formatDate(shift.local_start_date)} to {formatDate(shift.local_end_date)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    
                    {shift.location && (
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Location</Typography>
                                    <Typography>{shift.location}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    )}
                    
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <PersonIcon sx={{ mr: 1, color: 'primary.main', mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Assigned People
                                </Typography>
                                {shift.assignedPeople && shift.assignedPeople.length > 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {shift.assignedPeople.map((personId, index) => {
                                            const person = accounts.find(a => a.id === personId);
                                            const isClocked = shift.clockStatuses?.[index] || false;
                                            
                                            return person ? (
                                                <Box key={personId} sx={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    borderBottom: '1px solid #eee',
                                                    pb: 1
                                                }}>
                                                    <Typography>
                                                        {person.screen_name || `${person.first_name || ''} ${person.last_name || ''}`}
                                                    </Typography>
                                                    <Chip 
                                                        size="small" 
                                                        label={isClocked ? "Clocked In" : "Not Clocked In"}
                                                        color={isClocked ? "success" : "default"}
                                                        variant={isClocked ? "filled" : "outlined"}
                                                    />
                                                </Box>
                                            ) : null;
                                        })}
                                    </Box>
                                ) : (
                                    <Typography fontStyle="italic">No one assigned</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                    
                    {shift.details && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>Details</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {shift.details}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

import { Modal, Box, Typography, Paper, Divider, Button, Grid } from '@mui/material';
import { Shift, Account } from '../../types/shift.types';
import CloseIcon from '@mui/icons-material/Close';
import { format, parseISO } from 'date-fns';

interface ShiftDetailModalProps {
    open: boolean;
    onClose: () => void;
    shift: Shift & { covering_members?: string[], clock_statuses?: boolean[] };
    accounts: Account[];
}

export const ShiftDetailModal = ({ open, onClose, shift, accounts }: ShiftDetailModalProps) => {
    if (!shift) return null;
    
    const assignedPeople = shift.covering_members
        ? shift.covering_members.map((memberId, idx) => ({
            person: accounts.find(acc => acc.id === memberId),
            clockedIn: shift.clock_statuses?.[idx] || false
          })).filter(item => item.person !== undefined)
        : [];

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="shift-detail-title"
        >
            <Paper
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: 600,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography id="shift-detail-title" variant="h5" component="h2" color="primary.main" fontWeight="bold">
                        {shift.name}
                    </Typography>
                    <Button 
                        onClick={onClose}
                        sx={{ minWidth: 'auto', p: 1 }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="text.secondary">
                            Subject
                        </Typography>
                        <Typography variant="body1">
                            {shift.subject || 'N/A'}
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" color="text.secondary">
                            Start Time
                        </Typography>
                        <Typography variant="body1">
                            {shift.local_start_date ? format(parseISO(shift.local_start_date), 'PPp') : 'N/A'}
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" color="text.secondary">
                            End Time
                        </Typography>
                        <Typography variant="body1">
                            {shift.local_end_date ? format(parseISO(shift.local_end_date), 'PPp') : 'N/A'}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                            Assigned Personnel
                        </Typography>
                        {assignedPeople.length > 0 ? (
                            assignedPeople.map(({ person, clockedIn }, index) => (
                                <Box 
                                    key={person?.id || index} 
                                    sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1,
                                        p: 1,
                                        bgcolor: 'background.default',
                                        borderRadius: 1
                                    }}
                                >
                                    <Typography variant="body1">
                                        {person?.screen_name || `${person?.first_name} ${person?.last_name}`}
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ 
                                            color: clockedIn ? 'success.main' : 'warning.main',
                                            fontWeight: 'medium'
                                        }}
                                    >
                                        {clockedIn ? 'Clocked In' : 'Not Clocked In'}
                                    </Typography>
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No personnel assigned
                            </Typography>
                        )}
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="text.secondary">
                            Workgroup
                        </Typography>
                        <Typography variant="body1">
                            {shift.workgroup || 'N/A'}
                        </Typography>
                    </Grid>
                </Grid>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} variant="contained">
                        Close
                    </Button>
                </Box>
            </Paper>
        </Modal>
    );
};

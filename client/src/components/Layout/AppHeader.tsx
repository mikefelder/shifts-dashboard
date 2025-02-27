import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { WorkgroupFilter } from '../Filters/WorkgroupFilter';
import { useWorkgroup } from '../../contexts/WorkgroupContext';

export const AppHeader = () => {
    const { selectedWorkgroup, setSelectedWorkgroup, workgroups } = useWorkgroup();

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backgroundColor: (theme) => theme.palette.primary.main,
                left: 0,
                width: '100%'
            }}
        >
            <Toolbar sx={{ 
                display: 'flex',
                justifyContent: 'space-between', // Push items to edges
                paddingLeft: '16px',
                paddingRight: '16px'
            }}>
                <Typography variant="h6" noWrap component="div">
                    Shiftboard Reporting
                </Typography>
                <WorkgroupFilter
                    selectedWorkgroup={selectedWorkgroup}
                    onWorkgroupChange={setSelectedWorkgroup}
                    workgroups={workgroups || []}
                />
            </Toolbar>
        </AppBar>
    );
};

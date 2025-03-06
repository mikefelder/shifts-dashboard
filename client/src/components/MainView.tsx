import React, { useState } from 'react';
import { Container, Box, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ActiveShiftsView } from './Calendar/ActiveShiftsView';
import { TabularShiftView } from './Calendar/TabularShiftView';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import { WorkgroupProvider } from '../contexts/WorkgroupContext';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            style={{ height: '100%', overflow: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 0, height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: 'none',
    fontWeight: 'medium',
    fontSize: '0.9rem',
}));

export const MainView = () => {
    const [value, setValue] = useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <WorkgroupProvider>
            <Container 
                maxWidth={false} 
                disableGutters 
                sx={{ 
                    height: 'calc(100vh - 64px)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    pt: 2
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs 
                        value={value} 
                        onChange={handleChange} 
                        aria-label="shift view tabs"
                        indicatorColor="primary"
                    >
                        <StyledTab 
                            icon={<ViewDayIcon fontSize="small" />} 
                            iconPosition="start" 
                            label="Active Shifts" 
                        />
                        <StyledTab 
                            icon={<CalendarMonthIcon fontSize="small" />} 
                            iconPosition="start" 
                            label="Daily Schedule" 
                        />
                    </Tabs>
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <TabPanel value={value} index={0}>
                        <ActiveShiftsView shifts={[]} accounts={[]} />
                    </TabPanel>
                    <TabPanel value={value} index={1}>
                        <TabularShiftView />
                    </TabPanel>
                </Box>
            </Container>
        </WorkgroupProvider>
    );
}

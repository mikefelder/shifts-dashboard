import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AppLayout } from './components/Layout/AppLayout';
import { CalendarPage } from './pages/Calendar';
import { ErrorBoundary } from './components/ErrorBoundary';
import CssBaseline from '@mui/material/CssBaseline';
import { FullDayView } from './components/Calendar/FullDayView';
import { WorkgroupProvider } from './contexts/WorkgroupContext';
import { ActiveShiftsView } from './components/Calendar/ActiveShiftsView'; // Updated import if needed

function App() {
    return (
        <ErrorBoundary>
            <WorkgroupProvider>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <BrowserRouter>
                        <Routes>
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<CalendarPage />} />
                                <Route path="/full-day" element={<FullDayView />} />
                                <Route path="*" element={<CalendarPage />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </ThemeProvider>
            </WorkgroupProvider>
        </ErrorBoundary>
    );
}

export default App;

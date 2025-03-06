import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AppLayout } from './components/Layout/AppLayout';
import { CalendarPage } from './pages/Calendar';
import { ErrorBoundary } from './components/ErrorBoundary';
import CssBaseline from '@mui/material/CssBaseline';
import { TabularShiftView } from './components/Calendar/TabularShiftView';
import { WorkgroupProvider } from './contexts/WorkgroupContext';

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
                                <Route path="/tabular-view" element={<TabularShiftView />} />
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

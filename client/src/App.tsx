import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './theme/theme';
import { AppLayout } from './components/Layout/AppLayout';
import { CalendarPage } from './pages/Calendar';
import { ErrorBoundary } from './components/ErrorBoundary';
import CssBaseline from '@mui/material/CssBaseline';

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <BrowserRouter>
                    <Routes>
                        <Route element={<AppLayout />}>
                            <Route path="/" element={<CalendarPage />} />
                            <Route path="*" element={<CalendarPage />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;

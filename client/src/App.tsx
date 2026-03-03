/**
 * App Root Component
 *
 * Sets up routing, theme, and global providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { WorkgroupProvider } from './contexts/WorkgroupContext';
import AppLayout from './components/Layout/AppLayout';
import Calendar from './pages/Calendar';
import Table from './pages/Table';
import ShiftDetail from './pages/ShiftDetail';

function App() {
  return (
    <ThemeProvider>
      <WorkgroupProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Calendar />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="table" element={<Table />} />
              <Route path="shift/:shiftId" element={<ShiftDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WorkgroupProvider>
    </ThemeProvider>
  );
}

export default App;

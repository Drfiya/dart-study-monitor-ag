import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppThemeProvider } from './ThemeContext';
import Landing from './pages/Landing';
import StudyDashboard from './pages/StudyDashboard';
import CrossStudy from './pages/CrossStudy';

export default function App() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/study/:studyId" element={<StudyDashboard />} />
          <Route path="/cross-study" element={<CrossStudy />} />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme/theme';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import BoardCreatorPage from './pages/BoardCreatorPage';
import GamePage from './pages/GamePage';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<BoardCreatorPage />} />
            <Route path="/create/:boardId" element={<BoardCreatorPage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </ThemeProvider>
  );
}

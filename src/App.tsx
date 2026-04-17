import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import MiniGamePage from './pages/MiniGamePage';
import ProfilePage from './pages/ProfilePage';
import CharacterCreatorPage from './pages/CharacterCreatorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/minigame" element={<MiniGamePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/character" element={<CharacterCreatorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

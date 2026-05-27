import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const HakdangHubPage = lazy(() => import('./pages/HakdangHubPage'));
const MiniGamePage = lazy(() => import('./pages/MiniGamePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CharacterCreatorPage = lazy(() => import('./pages/CharacterCreatorPage'));

function RouteFallback() {
  return (
    <div className="joseon-bg min-h-screen flex items-center justify-center p-6">
      <div className="card-joseon max-w-sm w-full text-center p-6">
        <div className="text-5xl mb-3 animate-float">📚</div>
        <p className="text-joseon-dark font-bold text-lg">화면을 불러오는 중...</p>
        <p className="text-joseon-brown text-sm mt-2">필요한 학습 화면만 순서대로 준비합니다.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hakdang" element={<HakdangHubPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/minigame" element={<MiniGamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/character" element={<CharacterCreatorPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

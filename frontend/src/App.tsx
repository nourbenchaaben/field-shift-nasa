import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AuthOnboardingPage } from './pages/AuthOnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmHistoryPage } from './pages/FarmHistoryPage';
import { RotationLabPage } from './pages/RotationLabPage';
import { FuturePredictionsPage } from './pages/FuturePredictionsPage';

const AppRouter: React.FC = () => {
  const { screen, isAuthenticated, toastMessage } = useFarm();

  const renderScreen = () => {
    if (screen === 'landing') return <LandingPage />;
    if (screen === 'auth' || !isAuthenticated) return <AuthOnboardingPage />;

    return (
      <AppShell>
        {screen === 'dashboard' && <DashboardPage />}
        {screen === 'history' && <FarmHistoryPage />}
        {screen === 'rotation-lab' && <RotationLabPage />}
        {screen === 'predictions' && <FuturePredictionsPage />}
      </AppShell>
    );
  };

  return (
    <>
      {renderScreen()}

      {/* Sleek floating confirmation toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[1000] max-w-md bg-[#111111] text-white border border-[#EBB40E] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#92D500] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export function App() {
  return (
    <FarmProvider>
      <AppRouter />
    </FarmProvider>
  );
}

export default App;

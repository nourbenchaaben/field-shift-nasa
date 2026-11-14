import React from 'react';
import { FarmProvider, useFarm } from './context/FarmContext';
import { LandingPage } from './pages/LandingPage';
import { AuthOnboardingPage } from './pages/AuthOnboardingPage';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { FarmHistoryPage } from './pages/FarmHistoryPage';
import { RotationLabPage } from './pages/RotationLabPage';
import { FuturePredictionsPage } from './pages/FuturePredictionsPage';

const AppRouter: React.FC = () => {
  const { screen, isAuthenticated } = useFarm();

  if (screen === 'landing') {
    return <LandingPage />;
  }

  if (screen === 'auth' || !isAuthenticated) {
    return <AuthOnboardingPage />;
  }

  return (
    <AppShell>
      {screen === 'dashboard' && <DashboardPage />}
      {screen === 'calendar' && <CalendarPage />}
      {screen === 'history' && <FarmHistoryPage />}
      {screen === 'rotation-lab' && <RotationLabPage />}
      {screen === 'predictions' && <FuturePredictionsPage />}
    </AppShell>
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

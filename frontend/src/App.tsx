import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { LandingPage } from './pages/LandingPage';
import { AuthOnboardingPage } from './pages/AuthOnboardingPage';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FarmHistoryPage } from './pages/FarmHistoryPage';
import { RotationLabPage } from './pages/RotationLabPage';
import { MarketFinancePage } from './pages/MarketFinancePage';
import { FuturePredictionsPage } from './pages/FuturePredictionsPage';

const AppRouter: React.FC = () => {
  const { screen, isAuthenticated, profile } = useFarm();

  if (screen === 'landing') {
    return <LandingPage />;
  }

  if (screen === 'auth' || !isAuthenticated) {
    return <AuthOnboardingPage />;
  }

  const financeEnabled = Boolean(profile.financeInputs?.enabled);

  return (
    <AppShell>
      {(screen === 'dashboard' || screen === 'calendar') && <DashboardPage />}
      {screen === 'history' && <FarmHistoryPage />}
      {screen === 'rotation-lab' && <RotationLabPage />}
      {screen === 'market-finance' && (financeEnabled ? <MarketFinancePage /> : <DashboardPage />)}
      {screen === 'predictions' && <FuturePredictionsPage />}
    </AppShell>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FarmProvider>
          <AppRouter />
        </FarmProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

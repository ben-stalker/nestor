import Router from './router';
import ProfileProvider from './core/ProfileProvider';
import { useAppSettings } from './core/hooks/useAppSettings';
import SetupWizard from './wizard/SetupWizard';

function AppGate() {
  const { data: settings, isLoading } = useAppSettings();

  if (isLoading) return null;

  if (!settings?.setup_complete) {
    return <SetupWizard />;
  }

  return <Router />;
}

export default function App() {
  return (
    <ProfileProvider>
      <AppGate />
    </ProfileProvider>
  );
}

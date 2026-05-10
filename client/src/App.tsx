import Router from './router';
import ProfileProvider from './core/ProfileProvider';

export default function App() {
  return (
    <ProfileProvider>
      <Router />
    </ProfileProvider>
  );
}

import { lazy, Suspense, useState, useMemo } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Users,
  Globe,
  Calendar,
  Monitor,
  Navigation,
  Mic,
  Accessibility,
  Settings,
  Bell,
  X,
  Search,
} from 'lucide-react';
import useAppStore from '../store/appStore';
import Skeleton from '../shared/ui/Skeleton';

const ProfilesPanel = lazy(() => import('./ProfilesPanel'));
const LocalePanel = lazy(() => import('./LocalePanel'));
const CalendarPanel = lazy(() => import('./CalendarPanel'));
const DisplayPanel = lazy(() => import('./DisplayPanel'));
const NavigationPanel = lazy(() => import('./NavigationPanel'));
const VoicePanel = lazy(() => import('./VoicePanel'));
const AccessibilityPanel = lazy(() => import('./AccessibilityPanel'));
const SystemPanel = lazy(() => import('./SystemPanel'));
const NotificationsPanel = lazy(() => import('./NotificationsPanel'));
const AudioPanelLazy = lazy(() => import('./AudioPanel'));

interface Section {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  keywords: string[];
  Panel: React.ComponentType;
}

const SECTIONS: Section[] = [
  {
    id: 'profiles',
    label: 'Profiles',
    Icon: Users,
    keywords: ['profile', 'user', 'pin', 'permission', 'avatar', 'colour'],
    Panel: ProfilesPanel,
  },
  {
    id: 'locale',
    label: 'Language & Region',
    Icon: Globe,
    keywords: ['language', 'locale', 'date', 'time', 'currency', 'units', 'format', 'region'],
    Panel: LocalePanel,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    Icon: Calendar,
    keywords: ['calendar', 'caldav', 'google', 'apple', 'sync', 'wfh', 'shift'],
    Panel: CalendarPanel,
  },
  {
    id: 'display',
    label: 'Display & Behaviour',
    Icon: Monitor,
    keywords: ['display', 'screen', 'orientation', 'idle', 'dim', 'sleep', 'night', 'screensaver'],
    Panel: DisplayPanel,
  },
  {
    id: 'navigation',
    label: 'Navigation',
    Icon: Navigation,
    keywords: ['navigation', 'nav', 'menu', 'reorder', 'hide', 'rename', 'layout'],
    Panel: NavigationPanel,
  },
  {
    id: 'voice',
    label: 'Voice',
    Icon: Mic,
    keywords: ['voice', 'wake', 'wakeword', 'tts', 'speech', 'hub', 'microphone', 'quiet hours'],
    Panel: VoicePanel,
  },
  {
    id: 'audio',
    label: 'Audio Chimes',
    Icon: Bell,
    keywords: ['audio', 'chime', 'sound', 'volume', 'notification'],
    Panel: AudioPanelLazy,
  },
  {
    id: 'accessibility',
    label: 'Accessibility',
    Icon: Accessibility,
    keywords: ['accessibility', 'text size', 'contrast', 'colour blind', 'motion', 'simplified'],
    Panel: AccessibilityPanel,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    Icon: Bell,
    keywords: ['notification', 'alert', 'reminder', 'advance', 'days'],
    Panel: NotificationsPanel,
  },
  {
    id: 'system',
    label: 'System',
    Icon: Settings,
    keywords: [
      'system',
      'version',
      'update',
      'backup',
      'restore',
      'factory reset',
      'tailscale',
      'syncthing',
    ],
    Panel: SystemPanel,
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();
  const adminPin = useAppStore((s) => s.adminPin);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SECTIONS;
    return SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q)),
    );
  }, [search]);

  if (!adminPin) {
    return <Navigate to="/" replace />;
  }

  const active = SECTIONS.find((s) => s.id === section);
  const defaultSection = SECTIONS[0].id;

  if (!section) {
    return <Navigate to={`/admin/${defaultSection}`} replace />;
  }

  return (
    <div className="flex h-screen bg-warm overflow-hidden">
      {/* Left rail */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-neutral-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <span className="text-body font-semibold text-primary">Settings</span>
          <button
            type="button"
            onClick={() => {
              void navigate('/');
            }}
            className="p-1 rounded-lg hover:bg-neutral-100 text-secondary transition-colors"
            aria-label="Done — return to home"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-neutral-100">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search settings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-caption rounded-lg bg-neutral-100 border-none outline-none focus:ring-2 focus:ring-mode-calendar"
              aria-label="Search settings sections"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2" aria-label="Settings sections">
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-caption text-secondary">No results for "{search}"</p>
          )}
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSearch('');
                void navigate(`/admin/${s.id}`);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-body transition-colors ${
                section === s.id
                  ? 'bg-neutral-100 text-primary font-medium'
                  : 'text-secondary hover:bg-neutral-50 hover:text-primary'
              }`}
              aria-current={section === s.id ? 'page' : undefined}
            >
              <s.Icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              void navigate('/');
            }}
            className="w-full py-2 rounded-xl bg-neutral-900 text-white text-body font-medium hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {active ? (
          <>
            <h1 className="text-h2 font-semibold text-primary mb-6">{active.label}</h1>
            <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
              <active.Panel />
            </Suspense>
          </>
        ) : (
          <Navigate to={`/admin/${defaultSection}`} replace />
        )}
      </main>
    </div>
  );
}

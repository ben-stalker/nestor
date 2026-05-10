import type { ComponentType } from 'react';
import {
  Home,
  Calendar,
  ChefHat,
  Car,
  Users,
  House,
  PoundSterling,
  PawPrint,
  Zap,
  Pin,
} from 'lucide-react';

export type NavModeId =
  | 'home'
  | 'calendar'
  | 'food'
  | 'vehicles'
  | 'family'
  | 'house'
  | 'finance'
  | 'pets'
  | 'ev'
  | 'board';

export interface NavMode {
  id: NavModeId;
  route: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  accent: string;
}

export const DEFAULT_NAV_MODES: NavMode[] = [
  { id: 'home', route: '/', label: 'Home', Icon: Home, accent: 'mode-home' },
  {
    id: 'calendar',
    route: '/calendar',
    label: 'Calendar',
    Icon: Calendar,
    accent: 'mode-calendar',
  },
  { id: 'food', route: '/food', label: 'Food', Icon: ChefHat, accent: 'mode-food' },
  { id: 'vehicles', route: '/vehicles', label: 'Travel', Icon: Car, accent: 'mode-vehicles' },
  { id: 'family', route: '/family', label: 'Family', Icon: Users, accent: 'mode-family' },
  { id: 'house', route: '/house', label: 'House', Icon: House, accent: 'mode-house' },
  {
    id: 'finance',
    route: '/finance',
    label: 'Finance',
    Icon: PoundSterling,
    accent: 'mode-finance',
  },
  { id: 'pets', route: '/pets', label: 'Pets', Icon: PawPrint, accent: 'mode-pets' },
  { id: 'ev', route: '/ev', label: 'EV', Icon: Zap, accent: 'mode-ev' },
  { id: 'board', route: '/board', label: 'Board', Icon: Pin, accent: 'mode-board' },
];

export const NAV_MODE_MAP = new Map<string, NavMode>(DEFAULT_NAV_MODES.map((m) => [m.id, m]));

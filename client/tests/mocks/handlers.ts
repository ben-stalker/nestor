import { http, HttpResponse } from 'msw';

const profile = { id: 1, name: 'Admin', type: 'admin', colour: '#3B82F6', pinSet: false };
const child = { id: 2, name: 'Alex', type: 'child', colour: '#10B981', pinSet: false };

export const handlers = [
  // Profiles
  http.get('/api/v1/profiles', () => HttpResponse.json([profile, child])),
  http.get('/api/v1/profiles/:id/permissions', () => HttpResponse.json({})),

  // App settings
  http.get('/api/v1/settings', () =>
    HttpResponse.json({
      app_name: 'Nestor',
      setup_complete: true,
      language: 'en',
      theme: 'light',
      enabled_nav_modes: JSON.stringify(['home', 'calendar', 'family', 'food']),
    }),
  ),

  // Weather
  http.get('/api/v1/weather', () =>
    HttpResponse.json({
      current: { temperature_2m: 18, weathercode: 1, windspeed_10m: 10, relativehumidity_2m: 60 },
      hourly: { time: [], temperature_2m: [], weathercode: [] },
      daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], weathercode: [] },
    }),
  ),

  // Home
  http.get('/api/v1/home/day-summary', () =>
    HttpResponse.json({ events: [], bins: [], wfh: null }),
  ),
  http.get('/api/v1/home/coming-up', () => HttpResponse.json([])),

  // Calendar
  http.get('/api/v1/calendar/events', () => HttpResponse.json([])),
  http.get('/api/v1/calendar/accounts', () => HttpResponse.json([])),

  // Alerts
  http.get('/api/v1/alerts', () => HttpResponse.json([])),

  // Family / chores
  http.get('/api/v1/chores', () => HttpResponse.json([])),
  http.get('/api/v1/rewards', () => HttpResponse.json([])),
  http.get('/api/v1/family', () => HttpResponse.json([])),
  http.get('/api/v1/health-logs', () => HttpResponse.json([])),

  // Food
  http.get('/api/v1/recipes', () => HttpResponse.json([])),
  http.get('/api/v1/meal-plan', () => HttpResponse.json([])),
  http.get('/api/v1/shopping-items', () => HttpResponse.json([])),

  // House
  http.get('/api/v1/bins', () => HttpResponse.json([])),
  http.get('/api/v1/subscriptions', () => HttpResponse.json([])),
  http.get('/api/v1/maintenance', () => HttpResponse.json([])),
  http.get('/api/v1/meter-readings', () => HttpResponse.json([])),
  http.get('/api/v1/budget', () => HttpResponse.json({ categories: [], expenses: [] })),
  http.get('/api/v1/checklists', () => HttpResponse.json([])),

  // Finance
  http.get('/api/v1/finance/agreements', () => HttpResponse.json([])),
  http.get('/api/v1/finance/savings', () => HttpResponse.json([])),
  http.get('/api/v1/finance/summary', () =>
    HttpResponse.json({ total_monthly: 0, categories: [] }),
  ),

  // Vehicles
  http.get('/api/v1/vehicles', () => HttpResponse.json([])),

  // Pets
  http.get('/api/v1/pets', () => HttpResponse.json([])),

  // Board
  http.get('/api/v1/board/messages', () => HttpResponse.json([])),
  http.get('/api/v1/board/countdowns', () => HttpResponse.json([])),
  http.get('/api/v1/board/lists', () => HttpResponse.json([])),

  // Contacts
  http.get('/api/v1/contacts', () => HttpResponse.json([])),

  // EV
  http.get('/api/v1/octopus/tariff', () => HttpResponse.json({ rates: [] })),

  // Plugins
  http.get('/api/v1/plugins', () => HttpResponse.json([])),
  http.get('/api/v1/plugins/widgets', () => HttpResponse.json([])),

  // Voice
  http.get('/api/v1/voice/status', () =>
    HttpResponse.json({ enabled: false, wakeWordRunning: false, sttReady: false }),
  ),
];

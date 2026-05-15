import fs from 'fs';
import path from 'path';
import express, { type Express } from 'express';
import errorHandler from './middleware/errorHandler';
import httpLogger from './middleware/logger';
import requestId from './middleware/requestId';
import createRequireAdminPin from './middleware/requireAdminPin';
import createKioskLockMiddleware from './middleware/kioskLock';
import { getDb } from './db/connection';
import AppSettingsRepository from './repositories/AppSettingsRepository';
import ProfileRepository from './repositories/ProfileRepository';
import clientErrorsRouter from './routes/clientErrors';
import healthRouter from './routes/health';
import createProfilesRouter from './routes/profiles';
import settingsRouter from './routes/settings';
import createAdminRouter from './routes/admin';
import createWeatherRouter from './routes/weather';
import createHomeRouter from './routes/home';
import createAlertsRouter from './routes/alerts';
import AlertRepository from './repositories/AlertRepository';
import createJourneysRouter from './routes/journeys';
import JourneyRepository from './repositories/JourneyRepository';
import createCalendarRouter from './routes/calendar';
import createGoogleCalendarRouter from './routes/googleCalendar';
import createBasicCalendarRouter from './routes/basicCalendar';
import createRecipesRouter from './routes/recipes';
import createMealPlanRouter from './routes/mealPlan';
import createShoppingItemsRouter from './routes/shoppingItems';
import createVehiclesRouter from './routes/vehicles';
import ShoppingItemRepository from './repositories/ShoppingItemRepository';
import VehicleRepository from './repositories/VehicleRepository';
import VehicleBookingRepository from './repositories/VehicleBookingRepository';
import FuelLogRepository from './repositories/FuelLogRepository';
import EventRepository from './repositories/EventRepository';
import RecipeRepository from './repositories/RecipeRepository';
import MealPlanRepository from './repositories/MealPlanRepository';
import CalendarAccountRepository from './repositories/CalendarAccountRepository';
import CalendarService from './services/CalendarService';
import { GoogleCalDAVProvider } from './services/calendar/GoogleCalDAVProvider';
import {
  BasicAuthCalDAVProvider,
  APPLE_CALDAV_URL,
  YAHOO_CALDAV_URL,
} from './services/calendar/BasicAuthCalDAVProvider';
import { registerProvider } from './services/calendar/providerRegistry';

const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export default function createApp(): Express {
  const app = express();

  app.use(requestId);
  app.use(httpLogger);
  app.use(express.json({ limit: '10mb' }));

  const db = getDb();
  const profileRepo = new ProfileRepository(db);
  const settingsRepo = new AppSettingsRepository(db);
  const alertRepo = new AlertRepository(db);
  const journeyRepo = new JourneyRepository(db);
  const eventRepo = new EventRepository(db);
  const recipeRepo = new RecipeRepository(db);
  const mealPlanRepo = new MealPlanRepository(db);
  const shoppingRepo = new ShoppingItemRepository(db);
  const vehicleRepo = new VehicleRepository(db);
  const vehicleBookingRepo = new VehicleBookingRepository(db);
  const fuelRepo = new FuelLogRepository(db);
  const calendarAccountRepo = new CalendarAccountRepository(db);
  const calendarService = new CalendarService(calendarAccountRepo, eventRepo);

  const googleProvider = new GoogleCalDAVProvider(calendarAccountRepo);
  registerProvider('google', googleProvider);

  const appleProvider = new BasicAuthCalDAVProvider(calendarAccountRepo, APPLE_CALDAV_URL);
  registerProvider('apple', appleProvider);

  const yahooProvider = new BasicAuthCalDAVProvider(calendarAccountRepo, YAHOO_CALDAV_URL);
  registerProvider('yahoo', yahooProvider);

  const requireAdminPin = createRequireAdminPin(profileRepo);
  const kioskLock = createKioskLockMiddleware(settingsRepo);

  app.use(healthRouter);
  app.use(clientErrorsRouter);
  app.use(
    '/api/v1/profiles',
    createProfilesRouter(profileRepo, undefined, [kioskLock, requireAdminPin]),
  );
  app.use('/api/v1/settings', settingsRouter);
  app.use('/api/v1/admin', createAdminRouter(settingsRepo, profileRepo));
  app.use(createWeatherRouter(settingsRepo));
  app.use(createHomeRouter());
  app.use(createAlertsRouter(alertRepo));
  app.use(createJourneysRouter(journeyRepo));
  app.use(createCalendarRouter(eventRepo, profileRepo));
  app.use(createRecipesRouter(recipeRepo, settingsRepo, profileRepo, requireAdminPin));
  app.use(createMealPlanRouter(mealPlanRepo, recipeRepo, profileRepo));
  app.use(createShoppingItemsRouter(shoppingRepo, recipeRepo, profileRepo));
  app.use(
    createVehiclesRouter(
      vehicleRepo,
      vehicleBookingRepo,
      fuelRepo,
      profileRepo,
      requireAdminPin,
      settingsRepo,
    ),
  );
  app.use(createGoogleCalendarRouter(calendarAccountRepo, settingsRepo, calendarService));
  app.use(createBasicCalendarRouter(calendarAccountRepo, calendarService));

  if (process.env.NODE_ENV === 'production' && fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

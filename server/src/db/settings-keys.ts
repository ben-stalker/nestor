import { z } from 'zod';

export const LocationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
  label: z.string().optional(),
});

export const OrientationSchema = z.enum(['portrait', 'landscape', 'auto']);

export const EnabledNavModesSchema = z.array(z.string());

export const MealSlotsSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    time: z.string(),
  }),
);

export const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
});

export const KioskLockSchema = z.string().nullable();

export const SetupCompleteSchema = z.boolean();

export const EncryptionSaltSchema = z.string();

export const LanguageSchema = z.string();

export const LocaleSchema = z.string();

export const VoiceInternalTokenSchema = z.string();

export const UpdateAvailableVersionSchema = z.string().nullable();

export const ReminderWindowsSchema = z.array(
  z.object({ id: z.string(), minutesBefore: z.number() }),
);

export const FuelRatesSchema = z.record(z.string(), z.number());

export const CommunityPluginIndexUrlSchema = z.string().url();

export const VehicleReminderDaysSchema = z.number().int().positive();

export const VaccinationScheduleRegionSchema = z.string();

export const NavLayoutSchema = z.enum(['default', 'compact', 'expanded']);

export const PluginsEnabledSchema = z.array(z.string());

export const IdleDimSecondsSchema = z.number().int().positive();
export const IdleSleepSecondsSchema = z.number().int().positive();
export const IdleDimLevelSchema = z.number().min(0).max(1);
export const NightModeEnabledSchema = z.boolean();
export const NightModeStartSchema = z.string().regex(/^\d{2}:\d{2}$/);
export const NightModeEndSchema = z.string().regex(/^\d{2}:\d{2}$/);
export const NightModeDimLevelSchema = z.number().min(0).max(1);

export const SETTING_SCHEMAS = {
  location: LocationSchema,
  orientation: OrientationSchema,
  enabled_nav_modes: EnabledNavModesSchema,
  meal_slots: MealSlotsSchema,
  quiet_hours: QuietHoursSchema,
  kiosk_lock: KioskLockSchema,
  setup_complete: SetupCompleteSchema,
  encryption_salt: EncryptionSaltSchema,
  language: LanguageSchema,
  locale: LocaleSchema,
  voice_internal_token: VoiceInternalTokenSchema,
  update_available_version: UpdateAvailableVersionSchema,
  reminder_windows: ReminderWindowsSchema,
  fuel_rates: FuelRatesSchema,
  community_plugin_index_url: CommunityPluginIndexUrlSchema,
  vehicle_reminder_days: VehicleReminderDaysSchema,
  vaccination_schedule_region: VaccinationScheduleRegionSchema,
  nav_layout: NavLayoutSchema,
  plugins_enabled: PluginsEnabledSchema,
  idle_dim_seconds: IdleDimSecondsSchema,
  idle_sleep_seconds: IdleSleepSecondsSchema,
  idle_dim_level: IdleDimLevelSchema,
  night_mode_enabled: NightModeEnabledSchema,
  night_mode_start: NightModeStartSchema,
  night_mode_end: NightModeEndSchema,
  night_mode_dim_level: NightModeDimLevelSchema,
} as const;

export type KnownSettingKey = keyof typeof SETTING_SCHEMAS;

export function validateSetting(key: string, value: unknown): void {
  if (key in SETTING_SCHEMAS) {
    SETTING_SCHEMAS[key as KnownSettingKey].parse(value);
  }
}

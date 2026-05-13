import ICAL from 'ical.js';
import logger from '../utils/logger';
import type ProfileRepository from '../repositories/ProfileRepository';
import type EventRepository from '../repositories/EventRepository';
import type AlertRepository from '../repositories/AlertRepository';
import type { Profile } from '../types/profile';

export class TermDatesService {
  constructor(
    private profileRepo: ProfileRepository,
    private eventRepo: EventRepository,
    private alertRepo: AlertRepository,
  ) {}

  async syncAll(): Promise<void> {
    const profiles = this.profileRepo.list();
    const childProfiles = profiles.filter(
      (p) =>
        p.term_dates_ical_url &&
        (p.type === 'child' || p.type === 'toddler' || p.type === 'teen' || p.type === 'baby'),
    );

    const results = await Promise.allSettled(childProfiles.map((p) => this.syncProfile(p)));

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        logger.warn(
          { err: result.reason, profileId: childProfiles[i].id },
          'Term dates sync failed for profile',
        );
      }
    });
  }

  async syncProfile(profile: Profile): Promise<void> {
    if (!profile.term_dates_ical_url) return;

    let icalText: string;
    try {
      const response = await fetch(profile.term_dates_ical_url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching term dates iCal`);
      }
      icalText = await response.text();
    } catch (err) {
      logger.warn({ err, profileId: profile.id }, 'Failed to fetch term dates iCal URL');
      return;
    }

    let comp: InstanceType<typeof ICAL.Component>;
    try {
      comp = new ICAL.Component(ICAL.parse(icalText));
    } catch (err) {
      logger.warn({ err, profileId: profile.id }, 'Failed to parse term dates iCal');
      return;
    }

    const vevents = comp.getAllSubcomponents('vevent');

    const synced = vevents.reduce((count, vevent) => {
      try {
        const uid = vevent.getFirstPropertyValue('uid');
        if (!uid) return count;

        const icalEvent = new ICAL.Event(vevent);
        const summary = (icalEvent.summary ?? 'Term event').trim();
        const startMs = icalEvent.startDate.toJSDate().getTime();
        const endMs = icalEvent.endDate
          ? icalEvent.endDate.toJSDate().getTime()
          : startMs + 86_400_000;

        const caldavUid = `term-${profile.id}-${uid}`;
        const existing = this.eventRepo.findByCaldavUid(caldavUid);

        if (!existing) {
          this.eventRepo.create({
            caldav_uid: caldavUid,
            title: summary,
            start_datetime: startMs,
            end_datetime: endMs,
            all_day: true,
            profile_id: profile.id,
            source: 'caldav',
            type: 'school_term',
            account_id: null,
          });
        } else {
          this.eventRepo.update(existing.id, {
            title: summary,
            start_datetime: startMs,
            end_datetime: endMs,
          });
        }

        // Detect inset days and surface as alerts
        if (/inset/i.test(summary)) {
          const alertType = `term_inset_${profile.id}_${uid}`;
          const activeAlerts = this.alertRepo.listActive();
          const alreadyAlerted = activeAlerts.some((a) => a.type === alertType);
          if (!alreadyAlerted) {
            this.alertRepo.create({
              type: alertType,
              severity: 'info',
              message: `Inset day: ${summary} (${new Date(startMs).toDateString()}) — ${profile.name}`,
              profile_id: profile.id,
            });
          }
        }

        return count + 1;
      } catch (err) {
        logger.warn({ err, profileId: profile.id }, 'Failed to process vevent in term dates');
        return count;
      }
    }, 0);

    logger.info({ profileId: profile.id, synced }, 'Term dates synced');
  }
}

export default TermDatesService;

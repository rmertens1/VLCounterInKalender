import { Event, Attendee } from '../models/event';

export class EventsWithEqualSubject {
  events: Event[];
  checked = false;
  teamsChecked = false;
  attendees: Attendee[];
  categories: string[];
}

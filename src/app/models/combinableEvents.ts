import { Event, Attendee } from './event';
import { EventsWithEqualSubject } from './eventsWithEqualSubject';

export class CombinableEvents {
  shortSubject: string;
  eventsWithEqualSubjectArray: EventsWithEqualSubject[] = [];
  combine: boolean;
}

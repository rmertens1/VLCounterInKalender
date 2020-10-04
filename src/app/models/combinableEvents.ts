import { Event, Attendee } from './event';
import { EventsWithEqualSubject } from './eventsWithEqualSubject';

export class CombinableEvents {
  shortSubject: String;
  eventsWithEqualSubjectArray: EventsWithEqualSubject[] = [];
  combine: boolean;
}

import { Injectable } from '@angular/core';
import { GraphService } from './graph.service';
import { Event, DateTimeTimeZone } from '../models/event';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { AlertsService } from './alerts.service';
import { AlertType } from '../models/alertType.enum';
import * as moment from 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private graphService: GraphService,
              private alertsService: AlertsService) { }

  // Regex
  private eventCounterRemovalRegex: RegExp = /(\(\d*\/\d*\))*/gi;
  private regexHSWEventSubjectDualRegex: RegExp = /.*\d{2}\/\d{2} - \d{1}.*/gi;
  private regexHSWEventSubjectMBARegex: RegExp = /.*\d{2}\/\d{2} MBA\d{2}.*/gi;

  public async getEvents(startDate: Date, endDate: Date): Promise<EventsWithEqualSubject[]> {
    const eventsWithEqualSubjectArray = await this.graphService.getEvents(startDate, endDate)
      .then((events) => {
        events = this.removeEventCounter(events);
        events = this.removeOtherEvents(events);
        let lEventsWithEqualSubjectArray = this.sortEvents(events);
        lEventsWithEqualSubjectArray = this.removeSingleEvents(lEventsWithEqualSubjectArray);
        return lEventsWithEqualSubjectArray;
      });
    return eventsWithEqualSubjectArray;
  }

  public updateEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[], updateEventBody: boolean): boolean {
    if (!eventsWithEqualSubjectArray) {
      return false;
    }
    const renamedEvents = this.renameEvents(eventsWithEqualSubjectArray, updateEventBody);
    for (const event of renamedEvents) {
      // Do not submit internal checked status
      event.checked = undefined;
      this.graphService.updateEvent(event);
    }
    this.alertsService.add(
      'Veranstaltungen erfolgreich aktualisiert.',
      `${renamedEvents.length} Veranstaltungen wurden erfolgreich aktualisiert. Sie können diese nun in Ihrem Kalender nachschlagen.`,
      AlertType.success
    );
    return true;
  }

  public getStartDate(today: Date): Date {
    const startDate = (today.getMonth() <= 5) ? new Date(today.getFullYear(), 1, 1) : new Date(today.getFullYear(), 7, 1);
    return startDate;
  }

  public getEndDate(startDate: Date, monthDifference: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + monthDifference);
    return endDate;
  }

  public getActiveSubEventCount(eventsWithEqualSubject: EventsWithEqualSubject): number {
    let count = 0;
    for (const event of eventsWithEqualSubject.events) {
      if (event.checked) { count += 1; }
    }
    return count;
  }

  public formatDateTimeTimeZone(dateTime: DateTimeTimeZone): string {
    const date = moment.tz(dateTime.dateTime, dateTime.timeZone).format('DD.MM HH:mm');;
    if (date === 'Invalid date') {
      this.alertsService.add('DateTimeTimeZone conversion error',
        dateTime.dateTime, AlertType.danger);
      return date;
    }
    return date + ' Uhr';
  }

  private removeEventCounter(events: Event[]): Event[] {
    for (const event of events) {
      if (event.subject.match(this.eventCounterRemovalRegex)) {
        event.subject = event.subject.replace(this.eventCounterRemovalRegex, '');
      }
    }
    return events;
  }

  private removeOtherEvents(events: Event[]): Event[] {
    const newEvents: Event[] = [];
    for (const event of events) {
      // Comparison to check if the subject of an event matches the pattern the HSW uses
      if ((event.subject.match(this.regexHSWEventSubjectDualRegex)) || (event.subject.match(this.regexHSWEventSubjectMBARegex))) {
        newEvents.push(event);
      }
    }
    return newEvents;
  }

  private sortEvents(events: Event[]): EventsWithEqualSubject[] {
    const tmpEventsWithEqualSubjectArray: EventsWithEqualSubject[] = [];

    // Sorting the events into a matrix of Events with equal Subjects
    for (const event of events) {
      let isNewSubject = true;

      // Comparison of the current enents subject with the subjects of the already existing lists of events
      for (const eventsWithEqualSubject of tmpEventsWithEqualSubjectArray) {
        if (event.subject === eventsWithEqualSubject.events[0].subject) {
          // Add the event to the array of events with the same subject
          isNewSubject = false;
          eventsWithEqualSubject.events.push(event);
          break;
        }
      }

      if (isNewSubject) {
        // When no event with the same subject was found
        // The event will be added as a new Array
        const eventsWithEqualSubject: EventsWithEqualSubject = new EventsWithEqualSubject();
        eventsWithEqualSubject.events = [event];
        tmpEventsWithEqualSubjectArray.push(eventsWithEqualSubject);
      }
    }
    return tmpEventsWithEqualSubjectArray;
  }

  private removeSingleEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[]): EventsWithEqualSubject[] {
    const newEventsWithEqualSubjectArray: EventsWithEqualSubject[] = [];
    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      if (eventsWithEqualSubject.events.length > 1) {
        newEventsWithEqualSubjectArray.push(eventsWithEqualSubject);
      }
    }
    return newEventsWithEqualSubjectArray;
  }

  private renameEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[], updateEventBody: boolean): Event[] {
    const renamedEvents: Event[] = [];

    // The sorted array will be run throgh; The counters will be added to the subject of the events
    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      const eventCount = this.getActiveSubEventCount(eventsWithEqualSubject);
      if (eventCount > 0) {
        let actCount = 0;
        for (let i = 0; i < eventsWithEqualSubject.events.length; i++) {
          const currentEvent = eventsWithEqualSubject.events[i];

          if (currentEvent.checked) {
            actCount += 1;
            currentEvent.subject = `(${actCount}/${eventCount})${currentEvent.subject}`;

            if (updateEventBody) {
              // If the current event is not the first event, then set the previous event
              const previousEvent = (i > 0) ? (eventsWithEqualSubject.events[i - 1]) : undefined;
              // If the current event is not the last event, then set the next event
              const nextEvent = (i < eventsWithEqualSubject.events.length - 1) ? (eventsWithEqualSubject.events[i + 1]) : undefined;

              // If the previous event is set, then add its date to the content string
              let content = previousEvent ? `Vorherige Veranstaltung: ${this.formatDateTimeTimeZone(previousEvent.start)}<br>` : '';
              // If the next event is set, then add its date to the content string
              content += nextEvent ? `Nächste Veranstaltung: ${this.formatDateTimeTimeZone(nextEvent.start)}<br>` : '';

              // Simple Regex that looks for a body content that was created by this tool
              const createdBodyRegex = /.*(Vorherige|Nächste) Veranstaltung:.*/gi;

              // If the body does not contain generated, then add the previous and next event dates
              if (!currentEvent.body.content.match(createdBodyRegex)) {
                // Add Datetime from previous and next event to the body.
                currentEvent.body.content = content + currentEvent.body.content;
              }
            }
          }
          renamedEvents.push(currentEvent);
        }
      }
    }
    return renamedEvents;
  }
}
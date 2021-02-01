import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { AlertType } from '../models/alertType.enum';
import { CombinableEvents } from '../models/combinableEvents';
import { DateTimeTimeZone, Event, ItemBody } from '../models/event';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { AlertsService } from './alerts.service';
import { GraphService } from './graph.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private graphService: GraphService,
    private alertsService: AlertsService) { }

  // Regex
  private eventCounterRemovalRegex: RegExp = /(\(\d*\/\d*\))*/gi;
  private regexHSWEventSubjectFirstSemester: RegExp = /.*\d{2}\/\d{2}.*/;
  private regexHSWEventSubjectDualRegex: RegExp = /.*\d{2}\/\d{2} - \d{1}.*/gi;
  private regexHSWEventSubjectDualWithGroup: RegExp = /.* - JG \d* - G.*/gi;
  private regexHSWEventSubjectMBARegex: RegExp = /.*\d{2}\/\d{2} MBA\d{2}.*/gi;
  private regexTeams: RegExp = /.*TEAMS.*/gi;
  public nameRegex: RegExp = /(.*)\d{2}\/\d{2}/gi;
  public nameRegex2: RegExp = /(.*) - JG/gi;

  public async getEvents(startDate: Date, endDate: Date, removeSingleEvents = true): Promise<EventsWithEqualSubject[]> {
    const eventsWithEqualSubjectArray = await this.graphService.getEvents(startDate, endDate)
      .then((events) => {
        events = this.removeEventCounter(events);
        events = this.removeOtherEvents(events);
        let lEventsWithEqualSubjectArray = this.sortEvents(events);
        if (removeSingleEvents) {
          lEventsWithEqualSubjectArray = this.removeSingleEvents(lEventsWithEqualSubjectArray);
        }
        return lEventsWithEqualSubjectArray;
      });
    return eventsWithEqualSubjectArray;
  }

  public async getOutlookCategories() {
    return await this.graphService.getOutlookCategories();
  }

  public updateEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[], updateEventBody: boolean, updateCategories: boolean): boolean {
    if (!eventsWithEqualSubjectArray) {
      return false;
    }
    const renamedEvents = this.renameEvents(eventsWithEqualSubjectArray, updateEventBody);
    for (const event of renamedEvents) {
      // Do not submit internal checked status
      event.checked = undefined;
      event.teamsChecked = undefined;
      if (!updateCategories) {
        event.categories = undefined;
      }
      this.graphService.updateEvent(event);
    }
    this.alertsService.add(
      'Veranstaltungen erfolgreich übermittelt.',
      `${renamedEvents.length} Veranstaltungen wurden erfolgreich an Outlook übertragen. Sie können diese bald in Ihrem Kalender nachschlagen. Je nach Anzahl der Termine kann dies einige Minuten dauern.`,
      AlertType.success
    );
    return true;
  }

  areAfterAnother(xEvent: Event, event: Event): boolean {
    let firstDate: Date = new Date(xEvent.end.dateTime);
    let secondDate: Date = new Date(event.start.dateTime);
    let diff = (secondDate.valueOf() - firstDate.valueOf());

    // Under 1 hours diff
    return (diff / 60000 <= 60);
  }

  public createTeamsEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[]): boolean {
    if (!eventsWithEqualSubjectArray) {
      return false;
    }

    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      let xEvent: Event;
      for (let event of eventsWithEqualSubject.events) {
        if (xEvent) {
          if (xEvent.teamsChecked && event.teamsChecked) {
            if (this.areAfterAnother(xEvent, event)) {
              xEvent.end = event.end;
              event.teamsChecked = false;
            } else {
              xEvent = event;
            }
          } else {
            xEvent = event;
          }
        } else {
          xEvent = event;
        }
      }
    }

    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      for (const event of eventsWithEqualSubject.events) {
        if (event.teamsChecked) {
          let teamsEvent: Event = new Event();
          teamsEvent.subject = '(TEAMS) ' + event.subject;
          teamsEvent.start = event.start;
          teamsEvent.end = event.end;
          teamsEvent.isOnlineMeeting = true;
          teamsEvent.onlineMeetingProvider = 'teamsForBusiness';
          teamsEvent.categories = eventsWithEqualSubject.categories;
          teamsEvent.attendees = eventsWithEqualSubject.attendees;
          if (!teamsEvent.body || !teamsEvent.body.content) {
            teamsEvent.body = new ItemBody();
            teamsEvent.body.contentType = 'html';
            teamsEvent.body.content = '';
          }
          if (eventsWithEqualSubject.customUrl) {
            let url: URL;
            try {
              url = new URL(eventsWithEqualSubject.customUrl);
            } catch (error) {
              try {
                url = new URL("https://" + eventsWithEqualSubject.customUrl);
              } catch (error) {
                this.alertsService.add('Bitte fügen Sie nur valide URLs inkl. https:// ein', `${eventsWithEqualSubject.customUrl} ist keine valide URL.`, AlertType.danger);
                throw new Error("");
              }
            }
            teamsEvent.body.content += `Der Dozent hat eine URL für diese Veranstaltung hinzugefügt: <br> <a href="${url.href}">${url.href}</a>`;
          }

          this.graphService.createEvent(teamsEvent);
        }
      }
    }

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

  public getCheckedSubEventCount(eventsWithEqualSubject: EventsWithEqualSubject): number {
    let count = 0;
    for (const event of eventsWithEqualSubject.events) {
      if (event.checked) { count += 1; }
    }
    return count;
  }

  public getTeamsCheckedSubEventCount(eventsWithEqualSubject: EventsWithEqualSubject): number {
    let count = 0;
    for (const event of eventsWithEqualSubject.events) {
      if (event.teamsChecked) { count += 1; }
    }
    return count;
  }

  public getAllEventsTeamsCheckedCount(eventsWithEqualSubjectArray: EventsWithEqualSubject[]): number {
    let count = 0;
    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      count += this.getTeamsCheckedSubEventCount(eventsWithEqualSubject);
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
      if (event.subject.match(this.regexTeams)) {
        continue;
      }
      // Comparison to check if the subject of an event matches the pattern the HSW uses
      if ((event.subject.match(this.regexHSWEventSubjectDualRegex)) ||
        (event.subject.match(this.regexHSWEventSubjectMBARegex)) ||
        (event.subject.match(this.regexHSWEventSubjectFirstSemester)) ||
        (event.subject.match(this.regexHSWEventSubjectDualWithGroup))) {
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
        eventsWithEqualSubject.categories = Array.from(event.categories);
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
      const eventCount = this.getCheckedSubEventCount(eventsWithEqualSubject);
      if (eventCount > 0) {
        let actCount = 0;
        for (let i = 0; i < eventsWithEqualSubject.events.length; i++) {
          const currentEvent = eventsWithEqualSubject.events[i];

          currentEvent.categories = eventsWithEqualSubject.categories;

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

  findCombinableEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[]): CombinableEvents[] {
    const combinableEvents: CombinableEvents[] = [];
    for (const eventsWithEqualSubject of eventsWithEqualSubjectArray) {
      let found = false;
      for (const comb of combinableEvents) {
        if (eventsWithEqualSubject.events[0].subject.indexOf(comb.eventsWithEqualSubjectArray[0].events[0].subject.match(this.nameRegex)[0]) > -1) {
          comb.eventsWithEqualSubjectArray.push(eventsWithEqualSubject);
          found = true;
        }
      }

      if (!found) {
        const comb = new CombinableEvents();
        let match = eventsWithEqualSubject.events[0].subject.match(this.nameRegex);
        if (match) {
          comb.shortSubject = eventsWithEqualSubject.events[0].subject.match(this.nameRegex)[0];
        } else {
          match = eventsWithEqualSubject.events[0].subject.match(this.nameRegex2);
          if (match) {
            comb.shortSubject = eventsWithEqualSubject.events[0].subject.match(this.nameRegex2)[0];
          }
        }
        comb.eventsWithEqualSubjectArray.push(eventsWithEqualSubject);
        combinableEvents.push(comb);
      }
    }

    const rCombinableEvents: CombinableEvents[] = [];
    for (const comb of combinableEvents) {
      if (comb.eventsWithEqualSubjectArray.length > 1)
        rCombinableEvents.push(comb);
    };

    return rCombinableEvents;
  }

  combineEvents(combinableEvents: CombinableEvents[]) {
    for (const combinableEvent of combinableEvents) {
      let count = 0;
      if (combinableEvent.combine) {
        for (const eventsWithEqualSubject of combinableEvent.eventsWithEqualSubjectArray) {
          if (eventsWithEqualSubject.combine) {
            count++;

            if (!combinableEvent.customName) {
              combinableEvent.shortSubject = eventsWithEqualSubject.events[0].subject;
              combinableEvent.customName = true;
            }

            for (const event of eventsWithEqualSubject.events) {
              event.subject = combinableEvent.shortSubject;
              this.graphService.updateEvent(event);
            }
          }
        }
      }
      if (count > 0) {
        this.alertsService.add(
          `Veranstaltung ${combinableEvent.shortSubject} erfolgreich zusammengefügt.`,
          `${count} Veranstaltungen wurden erfolgreich kombiniert und an Outlook übertragen. Sie können diese bald in Ihrem Kalender nachschlagen. Je nach Anzahl der Termine kann dies einige Minuten dauern.`,
          AlertType.success
        );
      }
    }
  }
}

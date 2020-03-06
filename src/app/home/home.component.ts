import { Component, OnInit } from '@angular/core';
import * as moment from 'moment-timezone';
import { AlertsService } from '../alerts.service';
import { AuthService } from '../auth.service';
import { DateTimeTimeZone, Event } from '../event';
import { GraphService } from '../graph.service';
import { FormControl } from '@angular/forms';
import { AlertType } from '../alertType.enum';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  private eventsWithEqualSubjectArray: EventsWithEqualSubject[];
  private startDateFormControl: FormControl;
  private endDateFormControl: FormControl;
  private allChecked: boolean;
  private updateBody: boolean;

  // Regex
  private eventCounterRemovalRegex: RegExp = /(\(\d*\/\d*\))*/gi;
  private regexHSWEventSubjectDualRegex: RegExp = /.*\d{2}\/\d{2} - \d{1}.*/gi;
  private regexHSWEventSubjectMBARegex: RegExp = /.*\d{2}\/\d{2} MBA\d{2}.*/gi;

  constructor(private authService: AuthService,
              private graphService: GraphService,
              private alertsService: AlertsService) { }

  ngOnInit() {
    this.setFormControls();
  }

  setFormControls() {
    const today = new Date();
    const startDate = (today.getMonth() < 5) ? new Date(today.getFullYear(), 1, 1) : new Date(today.getFullYear(), 7, 1);
    this.startDateFormControl = new FormControl(startDate);

    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 6);
    this.endDateFormControl = new FormControl(endDate);
  }

  getEventsBtn_onClicked() {
    this.reset();
    this.graphService.getEvents(this.startDateFormControl.value, this.endDateFormControl.value)
      .then((events) => {
        events = this.removeEventCounter(events);
        events = this.removeOtherEvents(events);
        this.sortEvents(events);
        this.removeSingleEvents();
      });
  }

  updateEventsBtn_onClicked() {
    if (!this.eventsWithEqualSubjectArray) {
      return;
    }
    const renamedEvents = this.renameEvents(this.eventsWithEqualSubjectArray);
    this.updateEvents(renamedEvents);
    this.reset();
  }

  removeEventCounter(events: Event[]): Event[] {
    for (const event of events) {
      if (event.subject.match(this.eventCounterRemovalRegex)) {
        event.subject = event.subject.replace(this.eventCounterRemovalRegex, '');
      }
    }
    return events;
  }

  removeOtherEvents(events: Event[]): Event[] {
    const newEvents: Event[] = [];
    for (const event of events) {
      // Comparison to check if the subject of an event matches the pattern the HSW uses
      if ((event.subject.match(this.regexHSWEventSubjectDualRegex)) || (event.subject.match(this.regexHSWEventSubjectMBARegex))) {
        newEvents.push(event);
      }
    }
    return newEvents;
  }

  sortEvents(events: Event[]) {
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
    this.eventsWithEqualSubjectArray = tmpEventsWithEqualSubjectArray;
  }

  removeSingleEvents() {
    const newEventsWithEqualSubjectArray: EventsWithEqualSubject[] = [];
    for (const eventsWithEqualSubject of this.eventsWithEqualSubjectArray) {
      if (eventsWithEqualSubject.events.length > 1) {
        newEventsWithEqualSubjectArray.push(eventsWithEqualSubject);
      }
    }
    this.eventsWithEqualSubjectArray = newEventsWithEqualSubjectArray;
  }

  renameEvents(eventsWithEqualSubjectArray: EventsWithEqualSubject[]): Event[] {
    if (!eventsWithEqualSubjectArray) {
      return;
    }
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

            if (this.updateBody) {
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
    this.eventsWithEqualSubjectArray = eventsWithEqualSubjectArray;
    return renamedEvents;
  }

  getActiveSubEventCount(eventsWithEqualSubject: EventsWithEqualSubject): number {
    let count = 0;
    for (const event of eventsWithEqualSubject.events) {
      if (event.checked) { count += 1; }
    }
    return count;
  }

  updateEvents(events: Event[]) {
    for (const event of events) {
      // Do not submit internal checked status
      event.checked = undefined;
      this.graphService.updateEvent(event);
    }
    this.alertsService.add(
      'Veranstaltungen erfolgreich aktualisiert.',
      `${events.length} Veranstaltungen wurden erfolgreich aktualisiert. Sie können diese nun aktualisiert in Ihrem Kalender nachschlagen.`,
      AlertType.success
    );
  }

  checkAll(checked: boolean) {
    this.allChecked = checked;
    for (const eventsWithEqualSubject of this.eventsWithEqualSubjectArray) {
      eventsWithEqualSubject.checked = checked;
      this.checkAllSubEvents(eventsWithEqualSubject);
    }
  }

  checkAllSubEvents(eventsWithEqualSubject: EventsWithEqualSubject) {
    for (const event of eventsWithEqualSubject.events) {
      event.checked = eventsWithEqualSubject.checked;
    }
  }

  formatDateTimeTimeZone(dateTime: DateTimeTimeZone): string {
    try {
      return moment.utc(dateTime.dateTime).tz('Europe/Berlin').format('DD.MM.YYYY HH:mm');
    } catch (error) {
      this.alertsService.add(
        'DateTimeTimeZone conversion error',
        JSON.stringify(error),
        AlertType.danger
      );
    }
  }

  reset() {
    this.eventsWithEqualSubjectArray = undefined;
    this.allChecked = false;
    this.updateBody = false;
  }

  async signIn(): Promise<void> {
    this.authService.signIn();
  }

  public get $startDateFormControl() {
    return this.startDateFormControl;
  }

  public set $startDateFormControl(startDateFormControl: FormControl) {
    this.startDateFormControl = startDateFormControl;
  }

  public get $endDateFormControl() {
    return this.endDateFormControl;
  }

  public set $endDateFormControl(endDateFormControl: FormControl) {
    this.endDateFormControl = endDateFormControl;
  }

  public get $eventsWithEqualSubjectArray() {
    return this.eventsWithEqualSubjectArray;
  }

  public set $eventsWithEqualSubjectArray(eventsWithEqualSubjectArray: EventsWithEqualSubject[]) {
    this.eventsWithEqualSubjectArray = eventsWithEqualSubjectArray;
  }

  public get $authService() {
    return this.authService;
  }

  public set $authService(authService: AuthService) {
    this.authService = authService;
  }

  public get $allChecked() {
    return this.allChecked;
  }

  public set $allChecked(allChecked: boolean) {
    this.allChecked = allChecked;
  }

  public get $updateBody() {
    return this.updateBody;
  }

  public set $updateBody(updateBody: boolean) {
    this.updateBody = updateBody;
  }
}

export class EventsWithEqualSubject {
  events: Event[];
  checked = false;
}

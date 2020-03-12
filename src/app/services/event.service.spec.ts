/* tslint:disable:no-unused-variable */

import { async, TestBed } from '@angular/core/testing';
import { DateTimeTimeZone, Event, ItemBody } from '../models/event';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { AlertsService } from './alerts.service';
import { EventService } from './event.service';
import { GraphService } from './graph.service';

describe('Service: Event', () => {
  let eventService: EventService;
  let graphServiceSpy: jasmine.SpyObj<GraphService>;
  let alertsServiceSpy: jasmine.SpyObj<AlertsService>;

  beforeEach(async(() => {
    const spy1 = jasmine.createSpyObj('GraphService', ['getEvents', 'updateEvent']);
    const spy2 = jasmine.createSpyObj('AlertsService', ['add']);

    TestBed.configureTestingModule({
      providers: [EventService,
        [
          { provide: GraphService, useValue: spy1 },
          { provide: AlertsService, useValue: spy2 }
        ]
      ]
    });
  }));

  beforeEach(() => {
    eventService = TestBed.get(EventService);
    graphServiceSpy = TestBed.get(GraphService);
    alertsServiceSpy = TestBed.get(AlertsService);
  });

  it('should be created', () => {
    expect(eventService).toBeTruthy();
  });

  it('getEvents should call the graph service with the given start and end date', () => {
    // TODO
  });

  it('updateEvents Should Update each checked Event', () => {
    expect(eventService.updateEvents(undefined, true)).toBeFalsy();
    expect(eventService.updateEvents(undefined, false)).toBeFalsy();

    // Content of dateTimeTimeZone does not matter
    const dateTimeTimeZone: DateTimeTimeZone = new DateTimeTimeZone();
    dateTimeTimeZone.dateTime = '2020-08-29T04:00:00.0000000';
    dateTimeTimeZone.timeZone = 'Central European Time';

    const event1 = new Event();
    event1.subject = 'TEST';
    event1.body = new ItemBody();
    event1.body.content = '';
    event1.start = dateTimeTimeZone;
    event1.end = dateTimeTimeZone;

    const event2 = new Event();
    event2.subject = 'TEST';
    event2.body = new ItemBody();
    event2.body.content = '';
    event2.start = dateTimeTimeZone;
    event2.end = dateTimeTimeZone;
    event2.checked = true;

    const event3 = new Event();
    event3.subject = 'TEST';
    event3.body = new ItemBody();
    event3.body.content = 'Vorherige Veranstaltung:';
    event3.start = dateTimeTimeZone;
    event3.end = dateTimeTimeZone;
    event3.checked = true;

    const eventsWithEqualSubject1 = new EventsWithEqualSubject();
    eventsWithEqualSubject1.events = [event1];

    const eventsWithEqualSubject2 = new EventsWithEqualSubject();
    eventsWithEqualSubject2.events = [event2];

    const eventsWithEqualSubject3 = new EventsWithEqualSubject();
    eventsWithEqualSubject3.events = [event3];

    const eventsWithEqualSubject4 = new EventsWithEqualSubject();
    eventsWithEqualSubject4.events = [event1, event2];

    const eventsWithEqualSubject5 = new EventsWithEqualSubject();
    eventsWithEqualSubject5.events = [event2, event2, event3];

    const eventsWithEqualSubjectArray = [eventsWithEqualSubject1,
      eventsWithEqualSubject2, eventsWithEqualSubject3,
      eventsWithEqualSubject4, eventsWithEqualSubject5];

    // TODO: Insert Spies
    expect(eventService.updateEvents(undefined, true)).toBeFalsy();
    expect(eventService.updateEvents(undefined, false)).toBeFalsy();
    expect(eventService.updateEvents(undefined, undefined)).toBeFalsy();
    expect(eventService.updateEvents(eventsWithEqualSubjectArray, true)).toBeTruthy();
    expect(eventService.updateEvents(eventsWithEqualSubjectArray, false)).toBeTruthy();
    expect(eventService.updateEvents(eventsWithEqualSubjectArray, undefined)).toBeTruthy();

  });

  it('getStartDate should return the 1st February from January to June', () => {
    const today = new Date();

    const firstFebruary = new Date(today.getFullYear(), 1, 1);

    // Min value that should return 1st February
    const date = new Date()
    date.setMonth(0);
    date.setDate(1)
    expect(eventService.getStartDate(date)).toEqual(firstFebruary);

    // Max value that should return 1st February
    date.setMonth(5);
    date.setDate(30);
    expect(eventService.getStartDate(date)).toEqual(firstFebruary);
  });

  it('getStartDate should return the 1st August from July to December', () => {
    const today = new Date();

    const firstAugust = new Date(today.getFullYear(), 7, 1);

    // Min value that should return 1st August
    const date = new Date()
    date.setMonth(6);
    date.setDate(1);
    expect(eventService.getStartDate(date)).toEqual(firstAugust);

    // Max value that should return 1st August
    date.setMonth(11);
    date.setDate(31);
    expect(eventService.getStartDate(date)).toEqual(firstAugust);
  });

  it('getEndDate should add the monthsDifference to the startDate', () => {
    const today = new Date();

    // First Day, one in the middle and last day of the year
    const firstJanuary = new Date(today.getFullYear(), 0, 1);
    const fourthJuly = new Date(today.getFullYear(), 6, 4);
    const thirtyFirstDecember = new Date(today.getFullYear(), 11, 31);

    // Add each month once to check if every month works for each date
    for (let i = 0; i < 11; i++) {
      expect(eventService.getEndDate(firstJanuary, i)).toEqual(new Date(today.getFullYear(), 0 + i, 1));
      expect(eventService.getEndDate(fourthJuly, i)).toEqual(new Date(today.getFullYear(), 6 + i, 4));
      expect(eventService.getEndDate(thirtyFirstDecember, i)).toEqual(new Date(today.getFullYear(), 11 + i, 31));
    }
  });

  it('getActiveSubEventCount should return the number of events that are checked', () => {
    const eventsWithEqualSubject = new EventsWithEqualSubject();
    const uncheckedEvent = new Event();
    const checkedEvent = new Event();
    checkedEvent.checked = true;

    // Empty event array should return zero checked
    let events: Event[] = [];
    eventsWithEqualSubject.events = events;
    expect(eventService.getActiveSubEventCount(eventsWithEqualSubject)).toEqual(0);


    // Event array with one unchecked event should return zero checked
    events = [uncheckedEvent];
    eventsWithEqualSubject.events = events;
    expect(eventService.getActiveSubEventCount(eventsWithEqualSubject)).toEqual(0);


    // Event array with one checked event should return one checked
    events = [checkedEvent];
    eventsWithEqualSubject.events = events;
    expect(eventService.getActiveSubEventCount(eventsWithEqualSubject)).toEqual(1);


    // Event array with one unchecked and one checked event should return one checked
    events = [checkedEvent, uncheckedEvent];
    eventsWithEqualSubject.events = events;
    expect(eventService.getActiveSubEventCount(eventsWithEqualSubject)).toEqual(1);


    // Event array with two unchecked and two checked event should return two checked
    events = [checkedEvent, checkedEvent, uncheckedEvent, uncheckedEvent];
    eventsWithEqualSubject.events = events;
    expect(eventService.getActiveSubEventCount(eventsWithEqualSubject)).toEqual(2);
  });

  it('FormatDateTimeTimeZone should format to Central European TimeZone', () => {
    // Timezone is always Central European Time
    const dateTimeTimeZone: DateTimeTimeZone = new DateTimeTimeZone();
    dateTimeTimeZone.dateTime = '2020-08-29T04:00:00.0000000';
    dateTimeTimeZone.timeZone = 'Central European Time';

    expect(eventService.formatDateTimeTimeZone(dateTimeTimeZone)).toEqual('29.08 04:00 Uhr');

    dateTimeTimeZone.dateTime = 'Error';
    // TODO Spy
    expect(eventService.formatDateTimeTimeZone(dateTimeTimeZone)).toEqual('Invalid date');
  });
});

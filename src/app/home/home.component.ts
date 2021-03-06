import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../services/alerts.service';
import { AuthService } from '../services/auth.service';
import { FormControl } from '@angular/forms';
import { EventService } from '../services/event.service';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { CsvService } from '../services/csv.service';
import { OutlookCategory, Event } from '../models/event';
import { CombinableEvents } from '../models/combinableEvents';

interface Mode {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  public eventsWithEqualSubjectArray: EventsWithEqualSubject[];
  public combinableEvents: CombinableEvents[];
  public startDateFormControl: FormControl;
  public endDateFormControl: FormControl;
  public loading: boolean;
  public allChecked: boolean;
  public allTeamsChecked: boolean;
  public updateBody: boolean;
  public updateCategories: boolean;

  selectedMode: string = 'count';
  modes: Mode[] = [
    { value: 'count', viewValue: 'Veranstaltungen zählen' },
    { value: 'combine', viewValue: 'Veranstaltungen kombinieren' },
    { value: 'teams', viewValue: 'Teams Termine anlegen' }
  ]

  public outlookCategories: OutlookCategory[] = [];

  public mode: string;

  constructor(private eventService: EventService,
    private authService: AuthService,
    private alertsService: AlertsService,
    private csvService: CsvService) {
  }

  ngOnInit() {
    this.updateCategories = true;
    this.updateBody = true;
    this.alertsService.removeAll();
    this.loading = false;
    this.setFormControls();
  }

  public isModeCountMeetings(): boolean {
    return this.selectedMode == 'count';
  }

  public isModeCombine(): boolean {
    return this.selectedMode == 'combine';
  }

  public isModeTeams(): boolean {
    return this.selectedMode == 'teams';
  }

  setFormControls() {
    const startDate: Date = this.eventService.getStartDate(new Date());
    const endDate: Date = this.eventService.getEndDate(startDate, 6);
    this.startDateFormControl = new FormControl(startDate);
    this.endDateFormControl = new FormControl(endDate);
  }

  async getEventsBtn_onClicked() {
    this.alertsService.removeAll();
    this.reset();
    this.loading = true;
    this.outlookCategories = await this.eventService.getOutlookCategories();
    this.eventsWithEqualSubjectArray = await this.eventService.getEvents(this.startDateFormControl.value, this.endDateFormControl.value, this.isModeCountMeetings());
    this.combinableEvents = this.eventService.findCombinableEvents(this.eventsWithEqualSubjectArray);
    this.loading = false;
  }

  updateEventsBtn_onClicked() {
    if (!this.eventsWithEqualSubjectArray) {
      return;
    }


    if (this.isModeCountMeetings()) {
      this.eventService.updateEvents(this.eventsWithEqualSubjectArray, this.updateBody, this.updateCategories);
    }
    this.reset();
  }

  createTeamEventsBtn_onClicked() {
    if (!this.eventsWithEqualSubjectArray) {
      return;
    }
    if (this.isModeTeams()) {
      this.eventService.createTeamsEvents(this.eventsWithEqualSubjectArray);
    }
    this.reset();
  }

  combineEventsBtn_onClicked() {
    if (!this.eventsWithEqualSubjectArray) {
      return;
    }
    if (this.isModeCombine()) {
      this.eventService.combineEvents(this.combinableEvents);
    }
    this.reset();
  }

  allImported(): boolean {
    let allImported: boolean = true;
    for (const eventsWithEqualSubject of this.eventsWithEqualSubjectArray) {
      if (this.eventService.getTeamsCheckedSubEventCount(eventsWithEqualSubject) > 0 && !eventsWithEqualSubject.attendees) {
        allImported = false;
      }
    }
    return allImported;
  }

  handleFileInput(eventsWithEqualSubject: EventsWithEqualSubject, event: Event) {
    this.csvService.uploadListener(eventsWithEqualSubject, event);

  }

  checkAll(checked: boolean) {
    this.allChecked = checked;
    for (const eventsWithEqualSubject of this.eventsWithEqualSubjectArray) {
      eventsWithEqualSubject.checked = checked;
      this.checkAllSubEvents(eventsWithEqualSubject);
    }
  }

  teamsCheckAll(teamsChecked: boolean) {
    this.allTeamsChecked = teamsChecked;
    for (const eventsWithEqualSubject of this.eventsWithEqualSubjectArray) {
      eventsWithEqualSubject.teamsChecked = teamsChecked;
      this.teamsCheckAllSubEvents(eventsWithEqualSubject);
    }
  }

  checkAllSubEvents(eventsWithEqualSubject: EventsWithEqualSubject) {
    for (const event of eventsWithEqualSubject.events) {
      event.checked = eventsWithEqualSubject.checked;
    }
  }

  teamsCheckAllSubEvents(eventsWithEqualSubject: EventsWithEqualSubject) {
    for (const event of eventsWithEqualSubject.events) {
      event.teamsChecked = eventsWithEqualSubject.teamsChecked;
    }
  }

  switchCategory(eventsWithEqualSubject: EventsWithEqualSubject, displayName: string) {
    const index = eventsWithEqualSubject.categories.indexOf(displayName, 0);
    if (index > -1) {
      // Contains the element => remove
      eventsWithEqualSubject.categories.splice(index, 1);
    } else {
      // Does not contain the element => add
      eventsWithEqualSubject.categories.push(displayName);
    }
  }

  reset() {
    this.eventsWithEqualSubjectArray = undefined;
    this.allChecked = false;
    this.allTeamsChecked = false;
    this.alertsService.removeAll();
  }

  async signIn(): Promise<void> {
    this.alertsService.removeAll();
    this.authService.signIn();
  }

  public get $authService() {
    return this.authService;
  }

  public set $authService(authService: AuthService) {
    this.authService = authService;
  }

  public get $eventService() {
    return this.eventService;
  }

  public set $eventService(eventService: EventService) {
    this.eventService = eventService;
  }
}

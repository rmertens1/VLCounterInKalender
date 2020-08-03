import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../services/alerts.service';
import { AuthService } from '../services/auth.service';
import { FormControl } from '@angular/forms';
import { EventService } from '../services/event.service';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  private eventsWithEqualSubjectArray: EventsWithEqualSubject[];
  private startDateFormControl: FormControl;
  private endDateFormControl: FormControl;
  private loading: boolean;
  private allChecked: boolean;
  private allTeamsChecked: boolean;
  private updateBody: boolean;
  private countMeetings: boolean;
  private createTeamsMeeting: boolean;
  public mode:string;

  constructor(private eventService: EventService,
              private authService: AuthService,
              private alertsService: AlertsService) {
  }

  ngOnInit() {
    this.alertsService.removeAll();
    this.loading = false;
    this.setFormControls();

    this.countMeetings = true;
    this.createTeamsMeeting = false;
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
    this.eventsWithEqualSubjectArray = await this.eventService.getEvents(this.startDateFormControl.value, this.endDateFormControl.value);
    this.loading = false;
  }

  updateEventsBtn_onClicked() {
    if (!this.eventsWithEqualSubjectArray) {
      return;
    }

    if(this.createTeamsMeeting){
      this.eventService.createTeamsEvents(this.eventsWithEqualSubjectArray);
    }
    if(this.countMeetings){
      this.eventService.updateEvents(this.eventsWithEqualSubjectArray, this.updateBody);
    }
    this.reset();
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

  onChangeTeams(teamsChecked: boolean){
    this.createTeamsMeeting = teamsChecked;
    this.countMeetings = !teamsChecked;
  }

  reset() {
    this.eventsWithEqualSubjectArray = undefined;
    this.allChecked = false;
    this.allTeamsChecked = false;
    this.updateBody = false;
  }

  async signIn(): Promise<void> {
    this.alertsService.removeAll();
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

  public get $eventService() {
    return this.eventService;
  }

  public set $eventService(eventService: EventService) {
    this.eventService = eventService;
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

  public get $loading() {
    return this.loading;
  }

  public set $loading(loading: boolean) {
    this.loading = loading;
  }

  public get $countMeetings() {
    return this.countMeetings;
  }

  public set $countMeetings(countMeetings: boolean) {
    this.countMeetings = countMeetings;
  }

  public get $createTeamsMeeting() {
    return this.createTeamsMeeting;
  }

  public set $createTeamsMeeting(createTeamsMeeting: boolean) {
    this.createTeamsMeeting = createTeamsMeeting;
  }

  public get $allTeamsChecked() {
    return this.allTeamsChecked;
  }

  public set $allTeamsChecked(allTeamsChecked: boolean) {
    this.allTeamsChecked = allTeamsChecked;
  }
}

import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../services/alerts.service';
import { AuthService } from '../services/auth.service';
import { FormControl } from '@angular/forms';
import { EventService } from '../services/event.service';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { Team } from '../models/team';
import { TeamService } from '../services/team.service';

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
  private updateBody: boolean;
  private teams: Team[];

  constructor(private eventService: EventService,
              private authService: AuthService,
              private alertsService: AlertsService,
              private teamService: TeamService) {
  }

  selected = new FormControl('valid', []);

  ngOnInit() {
    this.alertsService.removeAll();
    this.loading = false;
    this.setFormControls();
    if (this.authService.authenticated){
      this.teamService.getTeams().then(teams =>{
        this.teams = teams;
      })
    }
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
    this.eventService.updateEvents(this.eventsWithEqualSubjectArray, this.updateBody);
    this.reset();
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

  reset() {
    this.eventsWithEqualSubjectArray = undefined;
    this.allChecked = false;
    this.updateBody = false;
  }

  async getTeams() {
    this.teams = await this.teamService.getTeams();
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

  public get $teams() {
    return this.teams;
  }

  public set $teams(teams: Team[]) {
    this.teams = teams;
  }
}

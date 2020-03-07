import { Component, OnInit } from '@angular/core';
import { AlertsService } from '../services/alerts.service';
import { Alert } from '../models/alert';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {

  constructor(private alertsService: AlertsService) { }

  ngOnInit() {
  }

  close(alert: Alert) {
    this.alertsService.remove(alert);
  }

  public get $alertsService() {
    return this.alertsService;
  }

  public set $alertsService(alertsService: AlertsService) {
    this.alertsService = alertsService;
  }
}

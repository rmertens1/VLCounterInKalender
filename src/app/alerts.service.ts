import { Injectable, Type } from '@angular/core';
import { Alert } from './alert';
import { AlertType } from './alertType.enum';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  alerts: Alert[] = [];

  add(message: string, debug: string, type: AlertType) {
    this.alerts.push({message, debug, type});
  }

  remove(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }
}

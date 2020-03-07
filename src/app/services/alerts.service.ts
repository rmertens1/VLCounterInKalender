import { Injectable, Type } from '@angular/core';
import { Alert } from '../models/alert';
import { AlertType } from '../models/alertType.enum';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  alerts: Alert[] = [];

  add(message: string, debug: string, type: AlertType) {
    this.alerts.push({ message, debug, type });
  }

  remove(alert: Alert) {
    this.alerts.splice(this.alerts.indexOf(alert), 1);
  }

  removeAll() {
    for (const alert of this.alerts) {
      this.remove(alert);
    }
  }
}

import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { AlertsService } from './alerts.service';
import { AuthService } from './auth.service';
import { Event } from '../models/event';
import { AlertType } from '../models/alertType.enum';
import { User } from '../models/user';


@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private graphClient: Client;
  constructor(
    private authService: AuthService,
    private alertsService: AlertsService) {

    // Initialize the Graph client
    this.graphClient = Client.init({
      authProvider: async (done) => {
        // Get the token from the auth service
        const token = await this.authService.getAccessToken()
          .catch((reason) => {
            done(reason, null);
          });

        if (token) {
          done(null, token);
        } else {
          done('Could not get an access token', null);
        }
      }
    });
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const result = await this.graphClient
        .api('/me/calendarview')
        .select('id,subject,body,start,end,location')
        .orderby('start/dateTime ASC')
        .query({
          startdatetime: startDate.toISOString(),
          enddatetime: endDate.toISOString()
        })
        .top(999)
        .header('Prefer', 'outlook.timezone="Europe/Berlin"')
        .get();

      return result.value;
    } catch (error) {
      if (error.statusCode == 429) {
        await this.delay(100);
        return this.getEvents(startDate, endDate);
      } else {
        this.alertsService.add('Veranstaltungen konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.',
          JSON.stringify(error, null, 2), AlertType.danger);
      }
    }
  }

  async updateEvent(event: Event): Promise<boolean> {
    try {
      const result = await this.graphClient
        .api(`/me/events/${event.id}`)
        .update(event);
      return true;
    } catch (error) {
      if (error.statusCode == 429) {
        await this.delay(100);
        return this.updateEvent(event);
      } else {
        this.alertsService.add(`Veranstaltung ${event.id} konnte nicht geupdated werden.  Bitte versuchen Sie es erneut.`,
          JSON.stringify(error, null, 2), AlertType.danger);
        return false;
      }
    }
  }

  async createEvent(event: Event): Promise<boolean> {
    try {
      const result = await this.graphClient
        .api(`/me/events/`)
        .create(event);
      return true;
    } catch (error) {
      if (error.statusCode == 429) {
        await this.delay(100);
        return this.createEvent(event);
      } else {
        this.alertsService.add(`Veranstaltung ${event.subject} konnte nicht erstellt werden.  Bitte versuchen Sie es erneut.`,
          JSON.stringify(error, null, 2), AlertType.danger);
        return false;
      }
    }
  }

  async getUser(userEmail: string): Promise<User> {
    try {
      const result = await this.graphClient
        .api(`/users/${userEmail}`)
        .get()
      return result;
    } catch (error) {
      if (error.statusCode == 429) {
        await this.delay(100);
        return this.getUser(userEmail);
      } else {
        this.alertsService.add(`Benutzer ${userEmail} konnte nicht gefunden werden.`,
          JSON.stringify(error, null, 2), AlertType.danger);
        return null;
      }
    }
  }

  async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

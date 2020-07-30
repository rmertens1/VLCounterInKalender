import { Injectable } from '@angular/core';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthService } from './auth.service';
import { AlertsService } from './alerts.service';
import { AlertType } from '../models/alertType.enum';
import { Team } from '../models/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

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

  async getTeams(): Promise<Team[]> {
    try {
      const result = await this.graphClient
        .api('/me/joinedTeams')
        .select('id,displayName,webUrl')
        .get();

      return result.value;
    } catch (error) {
      this.alertsService.add('OnlineMeetings konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.',
        JSON.stringify(error, null, 2), AlertType.danger);
    }
  }
}

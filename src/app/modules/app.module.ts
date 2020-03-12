import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MsalModule } from '@azure/msal-angular';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OAuthSettings } from '../../oauth';
import { AlertsComponent } from '../alerts/alerts.component';
import { AppComponent } from '../app/app.component';
import { HomeComponent } from '../home/home.component';
import { AppRoutingModule } from '../modules/app-routing.module';
import { AngularMaterialModule } from '../modules/material.module';
import { NavBarComponent } from '../nav-bar/nav-bar.component';


@NgModule({
  declarations: [
    AppComponent,
    NavBarComponent,
    HomeComponent,
    AlertsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FontAwesomeModule,
    MsalModule.forRoot({
      clientID: OAuthSettings.appId
    }),
    BrowserAnimationsModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

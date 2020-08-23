import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { EventsWithEqualSubject } from '../models/eventsWithEqualSubject';
import { Attendee, EmailAddress } from '../models/event';

@Injectable({
  providedIn: 'root'
})
export class CsvService {

  constructor(private userService: UserService) { }

  uploadListener(eventsWithEqualSubject: EventsWithEqualSubject, $event: any): void {
    let files = $event.srcElement.files;

    if (this.isValidCSVFile(files[0])) {

      let input = $event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = () => {
        let csvData = reader.result;
        let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

        let headersRow = this.getHeaderArray(csvRecordsArray);

        const names = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow.length);
        console.log(names);

        const emails = this.userService.getEmailsByNames(names);

        let attendees: Attendee[] = [];
        for (const email of emails) {
          const emailAddress: EmailAddress = new EmailAddress();
          emailAddress.address = email;
          const attendee: Attendee = new Attendee();
          attendee.emailAddress = emailAddress;
          attendees = attendees.concat(attendee);
        }
        eventsWithEqualSubject.attendees = attendees;
      };

      reader.onerror = function () {
        console.log('error is occured while reading file!');
      };

    } else {
      alert("Please import valid .csv file.");
    }
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any): string[] {
    let nameArray = [];

    for (let i = 1; i < csvRecordsArray.length - 1; i++) {
      let curruntRecord = (<string>csvRecordsArray[i]).split(';');
      if (curruntRecord.length == headerLength) {
        const name = curruntRecord[0].trim();
        nameArray.push(name);
      }
    }
    return nameArray;
  }

  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (<string>csvRecordsArr[0]).split(',');
    let headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }
}

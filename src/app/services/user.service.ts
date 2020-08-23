import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  getEmailsByNames(names: string[]): string[] {
    let namesRegex: RegExp = /(?<nachname>.*), (?<vorname>.*)/;
    let emails: string[] = new Array();
    for (const name of names) {
      let test = name.match(namesRegex);
      let nachname = this.replSpecialChars(test.groups.nachname);
      let vorname = this.replSpecialChars(test.groups.vorname);
      let email = `${vorname}.${nachname}@hsw-stud.de`
      emails = emails.concat(email);
    }
    return emails;
  }

  replSpecialChars(str: string): string {
    return str
      .replace(' ', '-')
      .replace('ä', 'ae')
      .replace('ö', 'oe')
      .replace('ü', 'ue')
      .replace('ß', 'ss')
      .replace('é', 'e')
      .replace('ž', 'z')
      .replace('ć', 'c');
  }
}

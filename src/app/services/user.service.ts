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
      let fixedEmail = this.differentEmail(name);
      if (fixedEmail.length > 0) {
        emails.concat(fixedEmail);
        continue;
      }

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
      .replace('ć', 'c')
      .replace('í','i')
      .replace('ì','i');
  }

  differentEmail(name: string): string {
    switch (name) {
      case 'Habitz, Paul Philip':
        return 'paul.habitz@hsw-stud.de';
      default:
        return '';
    }
  }

}

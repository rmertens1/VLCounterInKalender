// For a full list of fields, see
// https://docs.microsoft.com/graph/api/resources/event?view=graph-rest-1.0
export class Event {
  id: string;
  subject: string;
  body: ItemBody;
  start: DateTimeTimeZone;
  end: DateTimeTimeZone;

  // Internal Boolean to toggle the checked view
  checked: boolean;
}

// https://docs.microsoft.com/en-us/graph/api/resources/itembody?view=graph-rest-1.0
export class ItemBody {
  contentType: string;
  content: string;
}

// https://docs.microsoft.com/graph/api/resources/datetimetimezone?view=graph-rest-1.0
export class DateTimeTimeZone {
  dateTime: string;
  timeZone: string;
}

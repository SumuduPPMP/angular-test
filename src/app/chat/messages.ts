export class Message {

  private _type: string;
  private _message: any;
  private _name: string;
  private _date: any;
  private _time: string;

  get type() {
    return this._type;
  }
  set type(type: string) {
    this._type = type;
  }

  get message() {
    return this._message;
  }
  set message(message) {
    this._message = message;
  }

  get name() {
    return this._name;
  }
  set name(name: string) {
    this._name = name;
  }

  get date() {
    return this._date;
  }
  set date(date: any) {
    this._date = date;
  }

  get time() {
    return this._time;
  }
  set time(time: string) {
    this._time = time;
  }

}

import {StyleCalculator} from '../style_calculator';
import {toFloat} from '../util';
import {StyleValueEntry} from '../parser';

export class NumericalRangeEntry {
  constructor(public from: number, public to: number, public diff: number) {}
}

export class NumericalStyleCalculator implements StyleCalculator {
  private _range: NumericalRangeEntry[];

  constructor() {}

  setKeyframeRange(values: StyleValueEntry[]): void {
    var limit = values.length - 1;
    var range = [];
    for (var i = 0; i < limit; i++) {
      var from = toFloat(values[i].value);
      var to = toFloat(values[i + 1].value);
      range.push(new NumericalRangeEntry(from, to, to - from));
    }
    this._range = range;
  }
  
  get range() {
    return this._range;
  }

  getFinalValue(): string {
    return this.range[this._range.length - 1].to.toString();
  }

  _calcNumber(index: number, percentage: number): number {
    var entry = this.range[index];
    return entry.diff * percentage + entry.from;
  }

  calculate(index: number, percentage: number): string {
    return this._calcNumber(index, percentage).toString();
  }
}

export class RoundedNumericalStyleCalculator extends NumericalStyleCalculator {
  calculate(index: number, percentage: number): string {
    return Math.round(this._calcNumber(index, percentage)).toString();
  }
}
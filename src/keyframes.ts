import {forEach, toFloat} from './util';

export const MIN_OFFSET = 0;
export const MAX_OFFSET = 100;

export class Keyframes {
  public entries: {[key: string]: string|number}[] = [];
  public offsets: number[] = [];
  public lowestCommonOffset: number;

  constructor(entries: {[key: string]: string|number}[]) {
    entries.forEach(stylesEntry => {
      var newStylesEntry: {[key: string]: string} = {};
      forEach(stylesEntry, (value, prop) => {
        if (prop == 'offset') {
          var offset = _expandOffsetToDec(toFloat(value));
          this.offsets.push(offset);
        } else {
          newStylesEntry[prop] = value;
        }
      });
      this.entries.push(newStylesEntry);
    });

    this.lowestCommonOffset = _gcdWithinRange(this.offsets);
  }
}

function _gcdWithinRange(values: number[]): number {
  return values.reduce((a,b) => _gcd(a,b));
}

function _gcd(a, b): number {
  if (!b) return a;
  return _gcd(b, a % b);
};

function _expandOffsetToDec(offset: number): number {
  return offset * 100;
}

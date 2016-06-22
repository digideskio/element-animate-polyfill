import {StyleCalculator} from '../style_calculator';
import {toInt, findDimensionalSuffix} from '../util';
import {NumericalStyleCalculator} from './numerical_style_calculator';
import {StyleValueEntry} from '../parser';

const DEFAULT_UNIT = 'px';

export class DimensionalStyleCalculator extends NumericalStyleCalculator implements StyleCalculator {
  private _units: string[] = [];

  constructor() { super(); }

  setKeyframeRange(values: StyleValueEntry[]): void {
    super.setKeyframeRange(values);
    var from: string = values[0].value.toString();
    var sharedUnit = findDimensionalSuffix(from) || DEFAULT_UNIT;
    this._units.push(sharedUnit);

    for (var i = 1; i < values.length; i++) {
      var to = values[i].value.toString();
      var toUnit = findDimensionalSuffix(to) || DEFAULT_UNIT;
      if (toUnit != sharedUnit) {
        throw new Error(`Animations containing the same unit can only be animated (the unit for ${from} != ${to}`);
      }
      this._units.push(toUnit);
      from = to;
    }
  }

  getFinalValue(): string {
    var finalIndex = this.range.length - 1;
    return this.calculate(finalIndex, 1)
  }

  calculate(index: number, percentage: number): string {
    var value = super.calculate(index, percentage);
    var unit = this._units[index];
    return value + unit;
  }
}

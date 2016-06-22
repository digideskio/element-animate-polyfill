import {StyleCalculator} from '../style_calculator';
import {toInt, forEach} from '../util';
import {StyleValueEntry} from '../parser';

var canvas = <HTMLCanvasElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
canvas.width = canvas.height = 1;
var context = canvas.getContext('2d');

export class ColorStyleCalculator implements StyleCalculator {
  private _range: _ColorRangeEntry[];

  constructor() {}

  setKeyframeRange(values: StyleValueEntry[]): void {
    var range = [];
    var fromColor = _parseColorString(values[0].value.toString());
    var limit = values.length - 1;
    for (var i = 1; i <= limit; i++) {
      let to = values[i];
      var toColor = _parseColorString(to.value.toString());
      
      range.push(new _ColorRangeEntry(fromColor, toColor, [
        toColor[0] - fromColor[0],
        toColor[1] - fromColor[1],
        toColor[2] - fromColor[2],
        toColor[3] - fromColor[3]
      ]));
      fromColor = toColor;
    }
    this._range = range;
  }
  
  getFinalValue(): string {
    return this.calculate(this._range.length - 1, 1);
  }

  calculate(index: number, percentage: number): string {
    var entry = this._range[index];
    var from = entry.from;
    var to = entry.to;
    var diff = entry.diff;
    var alphaVal = diff[3] * percentage + from[3];

    var valueText = '';
    forEach(diff, (value, index) => {
      var currentValue = value * percentage + from[index];
      if (index < 3) {
        if(alphaVal !== 1 && currentValue > 0) {
          currentValue /= alphaVal;
        }
        currentValue = Math.round(currentValue);
      }
      if (index > 0) {
        valueText += ',';
      }
      valueText += currentValue;
    });
    return this._format(valueText);
  }
  
  _format(value): string {
    return `rgba(${value})`;
  }
}

class _ColorRangeEntry {
  constructor(public from: number[], public to: number[], public diff: number[]) {}
}

function _parseColorString(colorString: string): number[] {
  // Source: https://github.com/web-animations/web-animations-js/blob/b5d91413acee82aadd01a18880cb84a5d883047d/src/color-handler.js
  colorString = colorString.trim();
  // The context ignores invalid colors
  context.fillStyle = '#000';
  context.fillStyle = colorString;
  var contextSerializedFillStyle = context.fillStyle;
  context.fillStyle = '#fff';
  context.fillStyle = colorString;
  if (contextSerializedFillStyle != context.fillStyle)
    return;
  context.fillRect(0, 0, 1, 1);
  var pixelColor = context.getImageData(0, 0, 1, 1).data;
  context.clearRect(0, 0, 1, 1);
  var alpha = pixelColor[3] / 255;

  return [pixelColor[0] * alpha, pixelColor[1] * alpha, pixelColor[2] * alpha, alpha];
}


import {StyleCalculator} from '../style_calculator';
import {toInt, forEach} from '../util';

var canvas = <HTMLCanvasElement>document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
canvas.width = canvas.height = 1;
var context = canvas.getContext('2d');

function parseColorString(colorString: string): number[] {
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

export class ColorStyleCalculator implements StyleCalculator {
  private _startValue: number[];
  private _endValue: number[];
  private _rangeDiff: number[];

  constructor() {}

  setKeyframeRange(startValue: string, endValue: string): void {
    this._startValue = parseColorString(startValue);
    this._endValue = parseColorString(endValue);
    this._rangeDiff = [];
    this._rangeDiff[0] = this._endValue[0] - this._startValue[0];
    this._rangeDiff[1] = this._endValue[1] - this._startValue[1];
    this._rangeDiff[2] = this._endValue[2] - this._startValue[2];
    this._rangeDiff[3] = this._endValue[3] - this._startValue[3];
  }

  calculate(percentage: number): string {
    let rgba = this._rangeDiff;
    let values = [];
    let alphaVal = this._rangeDiff[3] * percentage + this._startValue[3];

    forEach(this._rangeDiff, (value, index) => {
      let currentValue = value * percentage + this._startValue[index];
      if (index < 3) {
        if(alphaVal !== 1) {
          values.push((1 - alphaVal) * value + alphaVal * value);
        } else {
          values.push(Math.round(currentValue));
        }

      } else {
        values.push(currentValue);
      }
    });


    let valueString = values.join(', ');

    return `rgba(${valueString})`;
  }
}

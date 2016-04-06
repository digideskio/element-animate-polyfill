import {BrowserClock} from './browser_clock.ts';
import {BrowserStyles} from './browser_styles';
import {dimensionalProperties} from './dimensional_properties';
import {roundDecimal, toInt, toFloat, isNumber, isPresent} from './util';

var $0 = 48;
var $9 = 57;
var $PERIOD = 46;
var PX = 'px';
var START = 0;
var END = 1;

enum CssValueType {
  Pixel,
  Numeric,
  Color
}

function isNumericProperty(property: string): boolean {
  switch (property) {
    case 'opacity':
    case 'z-index':
      return true;
    default:
      return false;
  }
}

function isDimensionalProperty(property: string): boolean {
  if (dimensionalProperties.indexOf(property) !== -1) {
    return true;
  }

  return false;
}

function findDimensionalSuffix(value) {
  for (var i = 0; i < value.length; i++) {
    var c = value.charCodeAt(i);
    if ((c >= $0 && c <= $9) || c == $PERIOD) continue;
    return value.substring(i, value.length);
  }
}

function computePxValue(browserStyles: BrowserStyles, testElement: HTMLElement, prop: string, value: string, measurement: string): number {
  var isEM = measurement == 'em';
  if (isEM) {
    testElement.style[prop] = value;
  }

  var pxValue = toFloat(browserStyles.getComputedStyle(testElement, prop));
  if (isEM) {
    testElement.style[prop] = null;
  } else{
    pxValue = pxValue * toFloat(value);
  }

  return pxValue;
}

class NormalizedKeyframeStyle {
  constructor(public property: string, public value: number|string, public type: CssValueType) {}
}

function normalizeStyles(browserStyles: BrowserStyles, element:HTMLElement, styles: {[key: string]: string}): NormalizedKeyframeStyle[] {
  var newStyles = [];
  for (var prop in styles) {
    var type;
    var value: any = styles[prop];
    if (isDimensionalProperty(prop)) {
      if (!isNumber(value)) {
        var measurement = findDimensionalSuffix(value);
        if (!isPresent(measurement)) {
          throw new Error('Please set a suffix for ' + prop + ':' + value);
        }

        if (measurement == PX) {
          value = toFloat(value);
        } else {
          value = computePxValue(browserStyles, element, prop, value, measurement);
        }
      }
      type = CssValueType.Pixel;
    } else if(isNumericProperty(prop)) {
      type = CssValueType.Numeric;
    } else {
      throw new Error('only dimensional styles are supported for now...');
    }
    newStyles.push(new NormalizedKeyframeStyle(prop, value, type));
  }
  return newStyles;
}

export class PlayerOptions {
  public duration: number;
  public delay: number;
  public easing: string;
  public fillMode: string;

  constructor ({duration, delay, easing, fillMode}: {
    duration: number|string,
    delay?: number|string,
    easing?: string,
    fillMode?: string
  }) {
    this.duration = toInt(duration);
    this.delay = isPresent(delay) ? toInt(delay) : 0;
    this.easing = isPresent(easing) ? easing : 'linear';

    switch (fillMode) {
      case 'forwards':
      case 'backwards':
      case 'both':
        this.fillMode = fillMode;
        break;
      default:
        this.fillMode = 'none';
        break;
    }
  }
}

export class Player {
  private _currentTime: number = 0;
  private _startingTimestamp: number = 0;
  private _properties: any[] = [];
  private _initialValues: {[prop: string]: string};
  private _keyframes: {[key: string]: string|number}[];

  onfinish: Function = () => {};
  playing: boolean;

  constructor(private _element: HTMLElement,
              keyframes: {[key: string]: string}[],
              private _options: PlayerOptions,
              private _clock: BrowserClock,
              private _styles: BrowserStyles) {

    var formattedKeyframes = keyframes.map(keyframe => normalizeStyles(_styles, _element, keyframe));

    var firstKeyframe = formattedKeyframes[0];
    firstKeyframe.forEach((entry) => {
      var prop = entry.property;
      this._properties.push([prop, entry.type]);
    });

    this._keyframes = formattedKeyframes.map(entry => {
      var styles: {[key: string]: string|number} = {};
      entry.forEach(data => {
        styles[data.property] = data.value;
      });
      return styles;
    });
  }

  get totalTime() {
    return this._options.duration;
  }

  get currentTime() {
    return this._currentTime;
  }

  play() {
    if (this.playing) return;
    this._initialValues = {};
    this._properties.forEach(entry => {
      var prop = entry[0];
      this._initialValues[prop] = this._styles.readStyle(this._element, prop);
    });
    this.playing = true;
    this._startingTimestamp = this._clock.now();
    this.tick();
  }

  _onfinish() {
    var fillMode = this._options.fillMode;
    if (fillMode == 'none' || fillMode == 'backwards') {
      this._cleanup();
    }
    this.onfinish();
  }

  _oncancel() {
    this._cleanup();
  }

  _calculate(currentTime: number, totalTime: number, startVal: number, diff: number): number {
    return currentTime / totalTime * diff + startVal;
  }

  _computeProperties(currentTime: number): string[] {
    var start = this._keyframes[0];
    var end = this._keyframes[1];
    var results = [];
    var totalTime = this.totalTime;

    this._properties.forEach(entry => {
      var prop = entry[0];
      var startVal = start[prop];
      var endVal = end[prop];
      var type = <CssValueType>entry[1];
      var value;
      var unit;

      if (currentTime >= totalTime) {
        value = endVal;
      } else {
        var diff = <number>endVal - <number>startVal;
        value = this._calculate(currentTime, this.totalTime, <number>startVal, diff);
      }

      switch (type) {
        case CssValueType.Numeric:
          value = roundDecimal(value, 2);
          break;
        case CssValueType.Pixel:
          value = Math.round(value) + PX;
          break;
        default:
          throw new Error('Only numeric style values are supported now');
      }

      results.push([prop, value]);
    });

    return results;
  }

  tick() {
    var currentTime = this._clock.currentTime - this._startingTimestamp;
    this._computeProperties(currentTime).forEach(entry => this._apply(entry[0], entry[1]));

    if (this._currentTime >= this.totalTime) {
      this._onfinish();
    } else {
      this._clock.raf(() => this.tick());
    }

    this._currentTime = currentTime;
  }

  _cleanup() {
    this._properties.forEach(entry => {
      var property = entry[0];
      this._apply(property, this._initialValues[property]);
    });
    this._initialValues = null;
  }

  _apply(prop: string, value: string) {
    this._element.style[prop] = value;
  }
}

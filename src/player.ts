import {BrowserClock} from './browser_clock.ts';
import {BrowserStyles} from './browser_styles';
import {DIMENSIONAL_PROPERTIES} from './dimensional_properties';
import {NUMERICAL_PROPERTIES} from './numerical_properties';
import {COLOR_PROPERTIES} from './color_properties';
import {forEach, roundDecimal, toInt, toFloat, isNumber, isPresent} from './util';
import {DimensionalStyleCalculator} from './calculators/dimensional_style_calculator';
import {NumericalStyleCalculator} from './calculators/numerical_style_calculator';
import {TransformStyleCalculator} from './calculators/transform_style_calculator';
import {ColorStyleCalculator} from './calculators/color_style_calculator';
import {StyleCalculator} from './style_calculator';
import {resolveEasingEquation} from './easing';
import * as ANIMATION_ERRORS from './errors';

export class AnimationPropertyEntry {
  constructor(public property: string, public calculator: StyleCalculator) {}
}

export class PlayerOptions {
  public duration: number;
  public delay: number;
  public easing: string;
  public fill: string;

  constructor ({duration, delay, easing, fill}: {
    duration: number|string,
    delay?: number|string,
    easing?: string,
    fill?: string
  }) {
    this.duration = toInt(duration);
    this.delay = isPresent(delay) ? toInt(delay) : 0;
    this.easing = isPresent(easing) ? easing : 'linear';

    switch (fill) {
      case 'forwards':
      case 'backwards':
      case 'both':
        this.fill = fill;
        break;
      default:
        this.fill = 'none';
        break;
    }
  }
}

function createCalculator(prop: string, values: any[]): StyleCalculator {
  var calc: StyleCalculator;
  if (DIMENSIONAL_PROPERTIES.indexOf(prop) >= 0) {
    calc = new DimensionalStyleCalculator();
  } else if (NUMERICAL_PROPERTIES.indexOf(prop) >= 0) {
    calc = new NumericalStyleCalculator();
  } else if (prop == 'transform') {
    calc = new TransformStyleCalculator();
  } else if (COLOR_PROPERTIES.indexOf(prop) >= 0) {
    calc = new ColorStyleCalculator();
  } else {
    throw new Error('Only dimensional properties can be animated now');
  }
  calc.setKeyframeRange(<string|number>values[0], <string|number>values[1]);
  return calc;
}

export class Player {
  private _currentTime: number = 0;
  private _startingTimestamp: number = 0;
  private _animators: AnimationPropertyEntry[];
  private _initialValues: {[key: string]: string};
  private _easingEquation: Function;

  onfinish: Function = () => {};
  playing: boolean;

  constructor(private _element: HTMLElement,
              keyframes: {[key: string]: string}[],
              private _options: PlayerOptions,
              private _clock: BrowserClock,
              private _styles: BrowserStyles) {

    var properties = {};
    var firstKeyframe = keyframes[0];
    forEach(firstKeyframe, (value, prop) => {
      properties[prop] = [value];
    });

    var secondKeyframe = keyframes[1];
    forEach(secondKeyframe, (value, prop) => {
      if(properties[prop]) {
        properties[prop].push(value);
      } else {
        throw new Error(ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
      }
    });

    var previousFramePropsLength;
    this._animators = [];
    forEach(properties, (values, prop) => {
      if (previousFramePropsLength && previousFramePropsLength !== prop.length) {
        throw new Error(ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
      }

      var calculator = createCalculator(prop, values);
      this._animators.push(new AnimationPropertyEntry(prop, calculator));

      previousFramePropsLength = prop.length;
    });

    this._easingEquation = resolveEasingEquation(_options.easing);
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
    this._animators.forEach(entry => {
      var prop = entry.property;
      this._initialValues[prop] = this._styles.readStyle(this._element, prop);
    });
    this.playing = true;
    this._startingTimestamp = this._clock.now();
    this.tick();
  }

  _onfinish() {
    var fill = this._options.fill;
    if (fill == 'none' || fill == 'backwards') {
      this._cleanup();
    }
    this.onfinish();
  }

  _oncancel() {
    this._cleanup();
  }

  _ease(percentage) {
    return this._easingEquation(percentage);
  }

  _computeProperties(currentTime: number): string[] {
    var results = [];
    var totalTime = this.totalTime;
    var percentage = Math.min(currentTime / totalTime, 1);
    var percentageWithEasing = this._ease(percentage);

    this._animators.forEach(entry => {
      var calculator = entry.calculator;
      results.push([entry.property, calculator.calculate(percentageWithEasing)]);
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
    this._animators.forEach(entry => {
      var property = entry.property;
      this._apply(property, this._initialValues[property]);
    });
    this._initialValues = null;
  }

  _apply(prop: string, value: string) {
    this._element.style[prop] = value;
  }
}

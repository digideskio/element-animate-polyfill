import {BrowserClock} from './browser_clock.ts';
import {BrowserStyles} from './browser_styles';
import {forEach, roundDecimal, toInt, toFloat, isNumber, isPresent} from './util';
import {StyleCalculator} from './style_calculator';
import {resolveEasingEquation} from './easing';
import {Keyframes} from './keyframes';
import {StyleSpectrumEntry, createValueSpectrumFromKeyframes, resolveStyleCalculator} from './parser';
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

export class Player {
  private _currentTime: number = 0;
  private _startingTimestamp: number = 0;
  private _animators: AnimationPropertyEntry[] = [];
  private _initialValues: {[key: string]: string};
  private _easingEquation: Function;

  private _styleProgressLookup: {[prop: string]: StyleSpectrumEntry[]};
  private _totalOffsetCount: number;

  onfinish: Function = () => {};
  playing: boolean;

  constructor(private _element: HTMLElement,
              private _keyframes: Keyframes,
              private _options: PlayerOptions,
              private _clock: BrowserClock,
              private _styles: BrowserStyles) {
    
    var output = createValueSpectrumFromKeyframes(_keyframes, _options.duration);
    this._styleProgressLookup = output.spectrumMap;
    this._totalOffsetCount = output.totalOffsets;

    forEach(output.valuesMap, (entries, prop) => {
      var calculator = resolveStyleCalculator(prop, entries);
      if (calculator) {
        this._animators.push(new AnimationPropertyEntry(prop, calculator));
      }
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
    var keyframeLimit = this._totalOffsetCount - 1;
    var totalTime = this.totalTime;
    var percentage = Math.min(currentTime / totalTime, 1);

    var results = [];
    var percentageWithEasing = this._ease(percentage);
    var closestIndexBasedOnTime = Math.max(0,Math.floor(percentageWithEasing * keyframeLimit));

    this._animators.forEach(entry => {
      let prop = entry.property;
      let calc = entry.calculator;
      let propLookup = this._styleProgressLookup[prop];
      let currentKeyframe = propLookup[closestIndexBasedOnTime];
      let result: string;
      if (_isFinalKeyframe(currentKeyframe)) {
        result = calc.getFinalValue();
      } else {
        let nextKeyframeIndex = currentKeyframe.next;
        let jumpKeyframeIndex = currentKeyframe.jump;
        if (jumpKeyframeIndex >= 0) {
          currentKeyframe = propLookup[jumpKeyframeIndex];
          nextKeyframeIndex = currentKeyframe.next;
        }
        let nextKeyframe = propLookup[nextKeyframeIndex];
        let lowerOffset = currentKeyframe.offset;
        let upperOffset = nextKeyframe.offset;
        let offsetGap = upperOffset - lowerOffset;
        let keyframePercentage = percentage == 0
            ? 0
            : (percentageWithEasing - lowerOffset) / offsetGap;
        result = calc.calculate(currentKeyframe.valueIndex, keyframePercentage);
      }
      results.push([prop, result]);
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

function _isFinalKeyframe(keyframe: StyleSpectrumEntry): boolean {
  return keyframe.next == null && keyframe.jump == null;
}

import {Player, PlayerOptions} from "./player";
import {isPresent, isNumber} from "./util";
import {BrowserClock} from './browser_clock.ts';
import {BrowserStyles} from './browser_styles';
import {Keyframes} from './keyframes';
import * as ANIMATION_ERRORS from './errors';
import {normalizeAndValidateKeyframes} from './parser';

export class Animation {
  private _options: PlayerOptions;
  private _keyframes: Keyframes;
  private _clock: BrowserClock;
  private _styles: BrowserStyles;

  constructor(keyframes: {[key: string]: string|number}[],
              options: any,
              clock: BrowserClock = null,
              styles: BrowserStyles = null) {

    if(arguments.length && (!isPresent(keyframes) || keyframes.length == 0)) {
      throw new Error(ANIMATION_ERRORS.NO_KEYFRAMES);
    }

    this._clock = clock || new BrowserClock();
    this._styles = styles || new BrowserStyles();

    if (isNumber(options) && options > 0) {
      options = { duration: options };
    } else if (!isNumber(options.duration) || options.duration < 0) {
      throw new Error(ANIMATION_ERRORS.INVALID_DURATION);
    }

    this._options = new PlayerOptions(options);

    keyframes = normalizeAndValidateKeyframes(keyframes);
    this._keyframes = new Keyframes(keyframes);
  }

  create(element: HTMLElement): Player {
    return new Player(element, this._keyframes, this._options, this._clock, this._styles);
  }

  start(element): Player {
    var player = this.create(element);
    player.play();
    return player;
  }
}

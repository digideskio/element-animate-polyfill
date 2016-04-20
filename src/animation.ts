import {Player, PlayerOptions} from "./player";
import {isPresent, isNumber} from "./util";
import {BrowserClock} from './browser_clock.ts';
import {BrowserStyles} from './browser_styles';
import * as ANIMATION_ERRORS from './errors';

export class Animation {
  options: PlayerOptions;
  private _clock: BrowserClock;
  private _styles: BrowserStyles;

  constructor(public keyframes: {[key: string]: string}[],
              options: any,
              clock: BrowserClock = null,
              styles: BrowserStyles = null) {

    if(arguments.length && !arguments[0]) {
      throw new Error(ANIMATION_ERRORS.NO_KEYFRAMES);
    }

    if (isNumber(options) && options > 0) {
      options = { duration: options };
    } else if (!isNumber(options.duration) || options.duration < 0) {
      throw new Error(ANIMATION_ERRORS.INVALID_DURATION);
    }

    this.options = new PlayerOptions(options);
    this._clock = clock || new BrowserClock();
    this._styles = styles || new BrowserStyles();
  }

  create(element: HTMLElement): Player {
    return new Player(element, this.keyframes, this.options, this._clock, this._styles);
  }

  start(element): Player {
    var player = this.create(element);
    player.play();
    return player;
  }
}

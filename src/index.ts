import {Animation} from "./animation";
import {Player} from "./player";
import {BrowserStyles} from "./browser_styles";
import {BrowserClock} from './browser_clock';

export class ElementAnimatePolyfill {
  animate(element: HTMLElement,
          keyframes: {[key: string]: string}[],
          options: number,
          clock: BrowserClock = null,
          styles: BrowserStyles = null): Player {
    return new Animation(keyframes, options, clock, styles).create(element);
  }
}

var polyfill = new ElementAnimatePolyfill();
var globalClock = new BrowserClock();
var globalStyles = new BrowserStyles();
var elementAnimateFn = window['$$elementAnimateFn'] = function(element, keyframes, options) {
  var player = polyfill.animate(element, keyframes, options, globalClock, globalStyles);
  player.play();
  return player;
}

if (!Element.prototype['animate']) {
  Element.prototype['animate'] = function (keyframes, options) {
    elementAnimateFn(this, keyframes, options);
  };
}

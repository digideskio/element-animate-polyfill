import {Player} from '../src/player';
import {ElementAnimatePolyfill} from '../src/index';
import {MockBrowserClock} from '../src/mock/mock_browser_clock.ts';
import {BrowserStyles} from '../src/browser_styles.ts';
import {DIMENSIONAL_PROPERTIES} from '../src/dimensional_properties';
import {iit, xit, they, tthey, ddescribe} from './helpers';
import {TRANSFORM_VALUES_DICTIONARY, NO_UNIT, PX_UNIT, DEGREES_UNIT} from '../src/transform_properties';
import {COLOR_PROPERTIES} from '../src/color_properties';
import {isPresent} from '../src/util';
import * as ANIMATION_ERRORS from '../src/errors';

function s(s: string): string {
  return s.replace(/\s+/g,'');
}

function assertColor(element, prop, value) {
  var COLOR_REGEX = /rgba?\(\s*([^\),]+)\s*,\s*([^\),]+)\s*,\s*([^\),]+)\s*(?:,\s*([^\)]+)\s*)?\)*/;
  value = value.toLowerCase();

  var actualValue = window.getComputedStyle(element)[prop];
  if (/^rgb(a)?/.test(value)) {
    var isExpectingAlpha = RegExp.$1 == 'a';
    var match = actualValue.match(COLOR_REGEX);
    if (isExpectingAlpha) {
      var targetValues = value.match(COLOR_REGEX);
      var a1 = parseFloat(targetValues[4]);
      var a2 = isPresent(match[4]) ? parseFloat(match[4]) : null;
      var alpha = a2;
      if (!isPresent(alpha)) {
        alpha = 1;
      } else if (Math.abs(1 - (a1/a2)) <= .1) {
        alpha = a1;
      }
      actualValue = 'rgba(' + match[1] + ', ' + match[2] + ', ' + match[3] + ', ' + alpha.toString() + ')';
    } else {
      actualValue = 'rgb(' + match[1] + ', ' + match[2] + ', ' + match[3] + ')';
    }
  }
  expect(actualValue).toEqual(value);
}

describe('Player', () => {
  var polyfill = new ElementAnimatePolyfill();

  var clock, styles;
  var animate = (element, keyframes, options) => {
    clock = new MockBrowserClock();
    styles = new BrowserStyles();
    var player = polyfill.animate(element, keyframes, options, clock, styles);
    return player;
  };

  var el = (tag) => {
    var element = document.createElement(tag);
    document.body.appendChild(element);
    return element;
  };

  describe('dimensional style properties', () => {
    they('should animate $prop', DIMENSIONAL_PROPERTIES, (prop) => {
      var unit = 'px';
      var element = el('div');
      var keyframes = [{}, {}];
      keyframes[0][prop] = '0' + unit;
      keyframes[1][prop] = '100' + unit;

      var options = {
        duration: 1000
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(500);
      player.tick();

      expect(element.style[prop]).toBe('50' + unit);

      clock.fastForward(1000);
      player.tick();

      expect(element.style[prop]).toBe('100' + unit);
    });

    it('should be animated property when apart of an animation sequence', () => {
      var element = el('div');
      var keyframes = [
        { width: '100px', height: '0', offset: 0 },
        { width: '400px', offset: 0.4 },
        { height: '400px', offset: 0.5 },
        { width: '1000px', height: '1000px', offset: 1 }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      expect(element.style['width']).toBe('100px');
      expect(element.style['height']).toBe('0px');

      clock.fastForward(400);
      player.tick();

      expect(element.style['width']).toBe('400px');
      expect(element.style['height']).toBe('320px');

      clock.fastForward(100);
      player.tick();

      expect(element.style['width']).toBe('500px');
      expect(element.style['height']).toBe('400px');

      clock.fastForward(500);
      player.tick();

      expect(element.style['width']).toBe('1000px');
      expect(element.style['height']).toBe('1000px');

      player.tick();
    });
  });

  describe('numeric style properties', () => {
    it('should animate opacity', () => {
      var element = el('div');
      var keyframes = [
        {opacity: 0 },
        {opacity: 1}
      ];

      var options = {
        duration: 1000
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(500);
      player.tick();

      expect(element.style.opacity).toBe('0.5');

      clock.fastForward(1000);
      player.tick();

      expect(element.style.opacity).toBe('1');
    });

    it('should animate z-index', () => {
      var element = el('div');
      var keyframes = [{
        'z-index': 0
      }, {
        'z-index': 100
      }];

      var options = {
        duration: 1000
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(500);
      player.tick();

      expect(element.style['z-index']).toBe('50');

      clock.fastForward(1000);
      player.tick();

      expect(element.style['z-index']).toBe('100');
    });

    it('should be animated property when apart of an animation sequence', () => {
      var element = el('div');
      var keyframes = [
        { opacity: '0', 'z-index': 0, offset: 0 },
        { opacity: '0.5', 'z-index': 1, offset: 0.2 },
        { 'z-index': 3, offset: 0.8 },
        { opacity: '0.9', offset: 0.9 },
        { opacity: '1', 'z-index': 5, offset: 1 }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      expect(element.style['opacity']).toBe('0');
      expect(element.style['z-index']).toBe('0');

      clock.fastForward(200);
      player.tick();

      expect(element.style['opacity']).toBe('0.5');
      expect(element.style['z-index']).toBe('1');

      clock.fastForward(600);
      player.tick();

      expect(element.style['opacity']).toBe('0.842857');
      expect(element.style['z-index']).toBe('3');

      clock.fastForward(100);
      player.tick();

      expect(element.style['opacity']).toBe('0.9');
      expect(element.style['z-index']).toBe('4');

      clock.fastForward(200);
      player.tick();

      expect(element.style['opacity']).toBe('1');
      expect(element.style['z-index']).toBe('5');

      player.tick();
    });
  });

  describe('color properties', function() {
    they('should animate hex color values', COLOR_PROPERTIES, (prop) => {
      var element = el('div');
      var keyframes = [
        { [prop]: '#FF0000' },
        { [prop]: '#00FF00' }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      clock.fastForward(500);
      player.tick();

      expect(element.style[prop]).toBe('rgb(128, 128, 0)');

      clock.fastForward(1000);
      player.tick();

      expect(element.style[prop]).toBe('rgb(0, 255, 0)');
    });

    they('should animate rgb color values for $prop', COLOR_PROPERTIES, (prop) => {
      var element = el('div');
      var keyframes = [
        { [prop]: 'rgb(255, 0, 0)' },
        { [prop]: 'rgb(0, 255, 0)' }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      clock.fastForward(500);
      player.tick();

      assertColor(element, prop, 'rgb(128, 128, 0)');

      clock.fastForward(1000);
      player.tick();

      assertColor(element, prop, 'rgb(0, 255, 0)');
    });

    they('should animate rgba color values', COLOR_PROPERTIES, (prop) => {
      var element = el('div');
      var keyframes = [
        { [prop]: 'rgba(255, 0, 0, 0)' },
        { [prop]: 'rgba(0, 255, 0, 1)' }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      clock.fastForward(500);
      player.tick();

      assertColor(element, prop, 'rgba(0, 255, 0, 0.5)');

      clock.fastForward(1000);
      player.tick();

      assertColor(element, prop, 'rgba(0, 255, 0, 1)');
    });

    they('should animate hsl color values', COLOR_PROPERTIES, (prop) => {
      var element = el('div');
      var keyframes = [
        { [prop]: 'hsl(0, 100%, 50%)' },
        { [prop]: 'hsl(120, 100%, 50%)' }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      clock.fastForward(500);
      player.tick();

      assertColor(element, prop, 'rgb(128, 128, 0)');

      clock.fastForward(1000);
      player.tick();

      assertColor(element, prop, 'rgb(0, 255, 0)');
    });

    they('should animate hsla color values', COLOR_PROPERTIES, (prop) => {
      var element = el('div');
      var keyframes = [
        { [prop]: 'hsla(0, 100%, 50%, 0)' },
        { [prop]: 'hsla(120, 100%, 50%, 1)' }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      assertColor(element, prop, 'rgba(0, 0, 0, 0)');

      clock.fastForward(500);
      player.tick();

      assertColor(element, prop, 'rgba(0, 255, 0, 0.5)');

      clock.fastForward(1000);
      player.tick();

      assertColor(element, prop, 'rgba(0, 255, 0, 1)');
    });

    it('should be animated property when apart of an animation sequence', () => {
      var element = el('div');
      var keyframes = [
        { color: '#000', backgroundColor: 'rgb(255,0,0)', offset: 0 },
        { color: '#500', offset: 0.4 },
        { backgroundColor: 'rgb(0,255,0)', offset: 0.6 },
        { color: '#fff', backgroundColor: 'rgb(0,0,0)', offset: 1 }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      expect(s(element.style['color'])).toBe('rgb(0,0,0)');
      expect(s(element.style['backgroundColor'])).toBe('rgb(255,0,0)');

      clock.fastForward(500);
      player.tick();

      expect(s(element.style['color'])).toBe('rgb(113,42,42)');
      expect(s(element.style['backgroundColor'])).toBe('rgb(43,213,0)');

      clock.fastForward(100);
      player.tick();

      expect(s(element.style['color'])).toBe('rgb(142,85,85)');
      expect(s(element.style['backgroundColor'])).toBe('rgb(0,255,0)');

      clock.fastForward(400);
      player.tick();

      expect(s(element.style['color'])).toBe('rgb(255,255,255)');
      expect(s(element.style['backgroundColor'])).toBe('rgb(0,0,0)');
    });
  });

  describe('duration', function() {
    it('should allow setting a duration value as the option argument', () => {
      var element = el('div');
      var keyframes = [
        { opacity: 0 },
        { opacity: 1 }
      ];

      var player: Player = animate(element, keyframes, 1000);

      player.play();

      clock.fastForward(500);
      player.tick();

      expect(element.style.opacity).toBe('0.5');

      clock.fastForward(1000);
      player.tick();

      expect(element.style.opacity).toBe('1');
    });

  });

  describe('fill mode', () => {
    it('should use "none" by default and cleanup styles after the animation is complete', () => {
      var element = el('div');
      var keyframes = [
        { width: 100 },
        { width: '200px' }
      ];
      var options = {
        duration: 500
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(0);
      player.tick();

      expect(element.style.width).toBe('100px');

      clock.fastForward(250);
      player.tick();

      expect(element.style.width).toBe('150px');

      clock.fastForward(250);
      player.tick();

      expect(element.style.width).toBe('200px');
      player.tick();
      clock.flushCallbacks();

      expect(element.style.width).toBe('');
    });

    it('should cleanup styles after the animation is complete if fill "none" is passed', () => {
      var element = el('div');
      var keyframes = [
        { width: 100 },
        { width: '200px' }
      ];
      var options = {
        duration: 500,
        fill: 'none'
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(0);
      player.tick();

      expect(element.style.width).toBe('100px');

      clock.fastForward(250);
      player.tick();

      expect(element.style.width).toBe('150px');

      clock.fastForward(250);
      player.tick();

      expect(element.style.width).toBe('200px');
      clock.flushCallbacks();

      expect(element.style.width).toBe('');
    });

    it('should retain styles after the animation is complete if a fill of "forwards" is provided', () => {
      var element = el('div');
      var keyframes = [
        { width: '333px' },
        { width: '999px' }
      ];
      var options = {
        duration: 500,
        fill: 'forwards'
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(0);
      player.tick();

      expect(element.style.width).toBe('333px');

      clock.fastForward(600);
      player.tick();

      expect(element.style.width).toBe('999px');
      player.tick();

      expect(element.style.width).toBe('999px');
    });

    they('should not render styles on screen upon start if a fill mode of $prop or forwards is used', ['none', 'forwards', ''], (fillMode) => {
      var element = el('div');
      var keyframes = [
        { color: 'rgb(255,0,0)' },
        { color: 'rgb(0,255,0)' }
      ];
      var options = {
        delay: 500,
        duration: 500,
        fill: fillMode
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(0);
      player.tick();

      expect(s(element.style.color)).toBe('');

      clock.fastForward(500);
      player.tick();

      expect(s(element.style.color)).toBe('rgb(255,0,0)');

      clock.fastForward(500);
      player.tick();

      expect(s(element.style.color)).toBe('rgb(0,255,0)');
    });

    they('should render styles on screen upon start if a fill mode of $prop or forwards is used', ['both', 'backwards'], (fillMode) => {
      var element = el('div');
      var keyframes = [
        { color: 'rgb(255,0,0)' },
        { color: 'rgb(0,255,0)' }
      ];
      var options = {
        delay: 500,
        duration: 500,
        fill: fillMode
      };

      var player: Player = animate(element, keyframes, options);

      player.play();

      clock.fastForward(0);
      player.tick();

      expect(s(element.style.color)).toBe('rgb(255,0,0)');

      clock.fastForward(500);
      player.tick();

      expect(s(element.style.color)).toBe('rgb(255,0,0)');

      clock.fastForward(500);
      player.tick();

      expect(s(element.style.color)).toBe('rgb(0,255,0)');
    });

    they('should throw an error when an invalid fill mode (e.g. $prop) is passed in', ['NONE', 'BOTH', 'something'], (fillMode) => {
      var element = el('div');
      var keyframes = [
        { color: 'rgb(255,0,0)' },
        { color: 'rgb(0,255,0)' }
      ];
      var options = {
        duration: 500,
        fill: fillMode
      };

      expect(() => {
        animate(element, keyframes, options);
      }).toThrowError(Error, ANIMATION_ERRORS.INVALID_FILL_MODE);
    });

    describe('transform properties', () => {
      var propertiesToTest = [
        'translate',
        'translate3d',
        'translateX',
        'translateY',
        'translateZ',
        'scale',
        'scale3d',
        'scaleX',
        'scaleY',
        'scaleZ',
        'rotate',
        'rotateX',
        'rotateY',
        'rotateZ',
        'rotate3d',
        'skew',
        'skewX',
        'skewY'
      ];

      var defaultValuesTemplate = {
        from: {},
        to: {}
      };

      defaultValuesTemplate['from'][NO_UNIT] = '1';
      defaultValuesTemplate['to'][NO_UNIT] = '10';

      defaultValuesTemplate['from'][PX_UNIT] = '50px';
      defaultValuesTemplate['to'][PX_UNIT] = '100px';

      defaultValuesTemplate['from'][DEGREES_UNIT] = '20deg';
      defaultValuesTemplate['to'][DEGREES_UNIT] = '300deg';

      they('should animate the $prop property accordingly', propertiesToTest, (prop) => {
        var defaultData = TRANSFORM_VALUES_DICTIONARY[prop];
        var fromValues = defaultData.units.map(unit => {
          return defaultValuesTemplate['from'][unit];
        });

        var toValues = defaultData.units.map(unit => {
          return defaultValuesTemplate['to'][unit];
        });

        var from = prop + '(' + fromValues.join(', ') + ')';
        var to = prop + '(' + toValues.join(', ') + ')';

        var element = el('div');
        var keyframes = [
          { transform: from}, { transform: to}
        ];

        var options = {
          duration: 500,
          fill: 'forwards'
        };

        var player: Player = animate(element, keyframes, options);
        player.play();

        clock.fastForward(0);
        player.tick();

        expect(element.style.transform).toBe(from);

        clock.fastForward(500);
        player.tick();

        expect(element.style.transform).toBe(to);
      });

      it('should animate two properties', () => {
        var element = el('div');
        var keyframes = [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(2) rotate(360deg)' }
        ];

        var options = {
          duration: 500,
          fill: 'forwards'
        };

        var player: Player = animate(element, keyframes, options);
        player.play();

        clock.fastForward(0);
        player.tick();

        expect(element.style.transform).toBe('scale(1, 1) rotate(0deg)');

        clock.fastForward(500);
        player.tick();

        expect(element.style.transform).toBe('scale(2, 1) rotate(360deg)');
      });

      it('should animate two properties and invoke the default value for a property that is not provided', () => {
        var element = el('div');
        var keyframes = [
          { transform: 'scale(4)' },
          { transform: 'scale(8) rotate(360deg)' }
        ];

        var options = {
          duration: 500,
          fill: 'forwards'
        };

        var player: Player = animate(element, keyframes, options);
        player.play();

        clock.fastForward(0);
        player.tick();

        expect(element.style.transform).toBe('scale(4, 1) rotate(0deg)');

        clock.fastForward(500);
        player.tick();

        expect(element.style.transform).toBe('scale(8, 1) rotate(360deg)');
      });
    });
  });

  describe('error messages', () => {
    it('should throw when no argument is passed to animate()', () => {
      var element = el('div');

      expect(() => {
        animate(element, [], {});
      }).toThrowError(Error, ANIMATION_ERRORS.NO_KEYFRAMES);
    });

    they('should throw when keyframe properties do not match', [
      [
        { background: 'red' },
        { color: 'blue' }
      ],
      [
        { background: 'red', color: 'red' },
        { background: 'blue' }
      ]
    ], (keyframes) => {
      var element = el('div');

      expect(() => {
        animate(element, keyframes, 1000);
      }).toThrowError(Error, ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
    });

    they('should throw when duration is not a positive double', [
      false, true, 'string', {}, [], NaN, -1
    ], (value) => {
      var element = el('div');

      expect(() => {
        animate(element, [
          { background: 'red' },
          { background: 'blue' }
        ], value);
      }).toThrowError(Error, ANIMATION_ERRORS.INVALID_DURATION);
    });

  });


});

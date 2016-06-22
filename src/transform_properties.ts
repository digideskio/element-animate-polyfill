export var NO_UNIT = '';
export var DEGREES_UNIT = 'deg';
export var PX_UNIT = 'px';

export var TRANSFORM_PROPERTIES = [
  'transform',
  '-webkit-transform',
  'webkitTransform',
  'WebkitTransform',
  '-moz-transform',
  'mozTransform',
  'MozTransform'
];

export var TRANSFORM_VALUES_DICTIONARY = {
  'translate': {
    'defaults': [0,0],
    'units': [PX_UNIT, PX_UNIT]
  },
  'translate3d': {
    'defaults': [0,0,0],
    'units': [PX_UNIT, PX_UNIT, PX_UNIT]
  },
  'translateX': {
    'defaults': [0],
    'units': [PX_UNIT]
  },
  'translateY': {
    'defaults': [0],
    'units': [PX_UNIT]
  },
  'translateZ': {
    'defaults': [0],
    'units': [PX_UNIT]
  },
  'scale': {
    'defaults': [1,1],
    'units': [NO_UNIT, NO_UNIT]
  },
  'scale3d': {
    'defaults': [1,1,0],
    'units': [NO_UNIT, NO_UNIT, NO_UNIT]
  },
  'scaleX': {
    'defaults': [1],
    'units': [NO_UNIT]
  },
  'scaleY': {
    'defaults': [1],
    'units': [NO_UNIT]
  },
  'scaleZ': {
    'defaults': [0],
    'units': [NO_UNIT]
  },
  'rotate': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'rotate3d': {
    'defaults': [0,0,0,0],
    'units': [NO_UNIT, NO_UNIT, NO_UNIT, DEGREES_UNIT]
  },
  'rotateX': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'rotateY': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'rotateZ': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'skew': {
    'defaults': [0,0],
    'units': [DEGREES_UNIT, DEGREES_UNIT]
  },
  'skewX': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'skewY': {
    'defaults': [0],
    'units': [DEGREES_UNIT]
  },
  'perspective': {
    'defaults': [1],
    'units': [NO_UNIT]
  }
};


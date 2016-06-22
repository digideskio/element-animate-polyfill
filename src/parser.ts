import * as ANIMATION_ERRORS from './errors';
import {mapEach, arrayEquals, shallowCopy, forEach} from './util';
import {MIN_OFFSET, MAX_OFFSET, Keyframes} from './keyframes';
import {StyleCalculator} from './style_calculator';
import {DimensionalStyleCalculator} from './calculators/dimensional_style_calculator';
import {RoundedNumericalStyleCalculator, NumericalStyleCalculator} from './calculators/numerical_style_calculator';
import {TransformStyleCalculator} from './calculators/transform_style_calculator';
import {ColorStyleCalculator} from './calculators/color_style_calculator';
import {DIMENSIONAL_PROPERTIES} from './dimensional_properties';
import {TRANSFORM_VALUES_DICTIONARY, TRANSFORM_PROPERTIES} from './transform_properties';
import {ROUNDED_NUMERICAL_PROPERTIES, NUMERICAL_PROPERTIES} from './numerical_properties';
import {COLOR_PROPERTIES} from './color_properties';

export function normalizeAndValidateKeyframes(keyframes: Array<{[key: string]: string}|{[key: string]: string|number}>): {[key: string]: string|number}[] {
  var normalizedKeyframes = _normalizeKeyframeOffsets(keyframes);
  _validateKeyframeStyles(normalizedKeyframes);
  return normalizedKeyframes;
}

function _normalizeKeyframeOffsets(keyframes: {[key: string]: string|number}[]): {[key: string]: string|number}[] {
  //based on testing chrome, there are various reasons why partial keyframes surface
  //when invalid keyframe input data is provided.
  var newKeyframes = [];

  if(keyframes.length == 0) {
    throw new Error(ANIMATION_ERRORS.NO_KEYFRAMES);
  } else if(keyframes.length == 1) {
    throw new Error(ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
  }

  var total = keyframes.length;
  var limit = total - 1;
  var first = shallowCopy(keyframes[0]);
  var last = shallowCopy(keyframes[limit]);
  if (!first.offset) {
    first.offset = 0;
  }
  if (!last.offset) {
    last.offset = 1;
  }

  newKeyframes.push(first);

  var maxMiddleOffsets = total - 2;
  var totalMiddleKeyframesWithOffsets = 0;
  for (var i = 1; i < limit; i++) {
    let entry = shallowCopy(keyframes[i]);
    if (entry.offset) {
      totalMiddleKeyframesWithOffsets++;
    }
    newKeyframes.push(entry);
  }

  newKeyframes.push(last);

  if ((totalMiddleKeyframesWithOffsets > 0 && totalMiddleKeyframesWithOffsets < maxMiddleOffsets) ||
        first.offset != 0 ||
        last.offset !=  1) {
    throw new Error(ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
  }

  if (totalMiddleKeyframesWithOffsets == 0) {
    var margin = 1 / (total - 1);
    for (var i = 1; i < limit; i++) {
      newKeyframes[i].offset = i * margin;
    }
  }

  return newKeyframes;
}

function _validateKeyframeStyles(keyframes: {[key: string]: string|number}[]) {
  var firstKeyframe = keyframes[0];
  var firstKeyframeStyles = Object.keys(firstKeyframe);
  var lastKeyframe = keyframes[keyframes.length - 1];
  var lastKeyframeStyles = Object.keys(lastKeyframe);

  if (!arrayEquals(lastKeyframeStyles, firstKeyframeStyles)) {
    throw new Error(ANIMATION_ERRORS.PARTIAL_KEYFRAMES);
  }
}

export class StyleSpectrumEntry {
  public next: number;
  public jump: number;
  public offset: number;
  public valueIndex: number;
  constructor() {}
}

export class StyleValueEntry {
  constructor(public value: number|string, public offset: number) {}
}

export class SpectrumMapOutput {
  constructor(public totalOffsets: number, public spectrumMap: {[prop: string]: StyleSpectrumEntry[]}, public valuesMap: {[prop: string]: StyleValueEntry[]}) {}
}

export function createValueSpectrumFromKeyframes(keyframes: Keyframes, totalTime: number): SpectrumMapOutput {
  var valuesMap: {[prop: string]: StyleValueEntry[]} = {};
  keyframes.entries.forEach((stylesEntry, index) => {
    var offset = keyframes.offsets[index];
    forEach(stylesEntry, (value, prop) => {
      valuesMap[prop] = valuesMap[prop] || [];
      valuesMap[prop].push(new StyleValueEntry(value, offset));
    });
  });

  var allOffsets = [];

  var minOffsetVal = keyframes.lowestCommonOffset;

  var currentOffset = MIN_OFFSET;
  var i = 0;
  while (currentOffset < MAX_OFFSET) {
    allOffsets.push(currentOffset);
    currentOffset = ++i * minOffsetVal;
  }
  allOffsets.push(MAX_OFFSET);

  var spectrumMap: {[prop: string]: StyleSpectrumEntry[]} = {};
  forEach(valuesMap, (values, prop) => {
    var arr: StyleSpectrumEntry[] = [];
    spectrumMap[prop] = arr;

    var nextOffset = 0;
    var previousEntry;
    var previousIndex;
    var valueIndex = 0;

    var limit = values.length - 1;
    allOffsets.forEach((offset, offsetIndex) => {
      var entry = new StyleSpectrumEntry();
      entry.offset = offset / 100;
      if (offset == nextOffset) {
        entry.valueIndex = valueIndex;

        if (valueIndex < limit ) {
          entry.next = offsetIndex + 1;
          var nextEntry = values[++valueIndex];
          nextOffset = nextEntry.offset;
        }
        
        previousEntry = entry;
        previousIndex = offsetIndex;
      } else {
        entry.jump = previousIndex;
        previousEntry.next++;
      }
      arr.push(entry);
    });
  });

  return new SpectrumMapOutput(allOffsets.length, spectrumMap, valuesMap);
}

export function resolveStyleCalculator(prop: string, values: StyleValueEntry[]): StyleCalculator {
  var calc: StyleCalculator;
  if (DIMENSIONAL_PROPERTIES.indexOf(prop) >= 0) {
    calc = new DimensionalStyleCalculator();
  } else if (ROUNDED_NUMERICAL_PROPERTIES.indexOf(prop) >= 0) {
    calc = new RoundedNumericalStyleCalculator();
  } else if (NUMERICAL_PROPERTIES.indexOf(prop) >= 0) {
    calc = new NumericalStyleCalculator();
  } else if (TRANSFORM_PROPERTIES.indexOf(prop) >= 0) {
    calc = new TransformStyleCalculator();
  } else if (COLOR_PROPERTIES.indexOf(prop) >= 0) {
    calc = new ColorStyleCalculator();
  } else {
    return null;
  }
  
  calc.setKeyframeRange(values);
  return calc;
}

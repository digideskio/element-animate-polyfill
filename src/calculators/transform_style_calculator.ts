import {StyleCalculator} from '../style_calculator';
import {toInt, forEach, findDimensionalSuffix} from '../util';
import {TRANSFORM_VALUES_DICTIONARY, NO_UNIT, PX_UNIT, DEGREES_UNIT} from '../transform_properties';
import {StyleValueEntry} from '../parser';

export class TransformStyleCalculator implements StyleCalculator {
  private _range: _TransformStyleCalculationRangeEntry[];
  private _finalValue: string;

  setKeyframeRange(values: StyleValueEntry[]): void {
    var limit = values.length - 1;
    var range = [];
    for (var i = 0; i < limit; i++) {
      let from = values[i];
      let to = values[i + 1];

      let fromTransform = new _TransformDetails(from.value.toString());
      let toTransform = new _TransformDetails(to.value.toString());
      let transformKeyframes = generateKeyframesBetweenTransforms(fromTransform, toTransform);
      let template = compileTemplateFromTransformProperties(toTransform.properties);
      range.push(new _TransformStyleCalculationRangeEntry(transformKeyframes, template));
    }
    this._range = range;
  }

  calculate(index: number, percentage: number): string {
    var rangeEntry = this._range[index];
    for (var i = 0; i < rangeEntry.keyframes.length; i++) {
      let entry = rangeEntry.keyframes[i];
      let values = entry.calculateAtPercentage(percentage);
      var startIndex = rangeEntry.template.getStartIndexForProperty(entry.property);
      for (var j = 0; j < values.length; j++) {
        rangeEntry.template.set(startIndex + j + j, values[j]);
      }
    }
    return rangeEntry.template.eval();
  }

  getFinalValue(): string {
    return this.calculate(this._range.length - 1, 1);
  }
}

class _TransformStyleCalculationRangeEntry {
  constructor(public keyframes: _TransformKeyframeValue[], public template: _StyleTemplate) {}
}

class _StyleTemplate {
  constructor(private tokens: Array<string|number>, private _tokenLookup: {[key: string]: number}) {}

  set(index: number, value: string|number) {
    this.tokens[index] = value;
  }

  getStartIndexForProperty(property: string): number {
    return this._tokenLookup[property]; 
  }

  eval(): string {
    return this.tokens.join("");
  }
}

class _TransformInputValue {
  constructor(public value: number, public unit: string) {}
}

function splitTransformValue(value: string): _TransformInputValue[] {
  return value.split(/\s*,\s*/).map(rawValue => {
    return new _TransformInputValue(toInt(rawValue), findDimensionalSuffix(rawValue));
  });
}

class _TransformKeyframeValue {
  public length: number;
  public units: string[];
  public s1: number = 0;
  public s2: number = 0;
  public s3: number = 0;
  public s4: number = 0;
  public d1: number = 0;
  public d2: number = 0;
  public d3: number = 0;
  public d4: number = 0;

  constructor(public property: string, from: string, to: string) {
    var defaultEntry = TRANSFORM_VALUES_DICTIONARY[property];
    var defaultValues = defaultEntry['defaults'];
    var defaultUnits = defaultEntry['units'];
    this.length = defaultValues.length;

    var fromValues = splitTransformValue(from);
    var toValues = splitTransformValue(to);

    var f1 = fromValues[0];
    var t1 = toValues[0];
    this.s1 = f1.value;
    this.d1 = t1.value - f1.value;
    this.units = [defaultUnits[0]];

    var l = fromValues.length;
    if (this.length > 1) {
      let unit = defaultUnits[1];
      if (l > 1) {
        let f2 = fromValues[1];
        let t2 = toValues[1];
        unit = f2.unit;
        this.s2 = f2.value;
        this.d2 = t2.value - f2.value;
      } else {
        this.s2 = defaultValues[1];
      }
      this.units.push(unit);
    }

    if (this.length > 2) {
      let unit = defaultUnits[2];
      if (l > 2) {
        let f3 = fromValues[2];
        let t3 = toValues[2];
        unit = f3.unit;
        this.s3 = f3.value;
        this.d3 = t3.value - f3.value;
      } else {
        this.s3 = defaultValues[2];
      }
      this.units.push(unit);
    }

    if (this.length > 3) {
      let unit = defaultUnits[3];
      if (l > 3) {
        let f4 = fromValues[3];
        let t4 = toValues[3];
        unit = f4.unit;
        this.s4 = f4.value;
        this.d4 = t4.value - f4.value;
      } else {
        this.s4 = defaultValues[3];
      }
      this.units.push(unit);
    }
  }

  calculateAtPercentage(percentage: number): string[] {
    var units = this.units;
    var v1 = this.s1 + percentage * this.d1 + units[0];
    var v2 = this.s2 + percentage * this.d2 + units[1];
    var v3 = this.s3 + percentage * this.d3 + units[2];
    var v4 = this.s4 + percentage * this.d4 + units[3];
    var result = [v1,v2,v3,v4];
    result.length = this.length;
    return result;
  }
}

// we use look ahead here so that the split
// operation doesn't include the `\w+(` content
// as apart of the split delimeter.
var TRANSFORM_SPLIT_REGEX = new RegExp(
  '\\s+' + // look for spaces...
  '(?=\\w+\\()' // that are followed by a keyword containing a opening paren(
);

class _TransformDetails {
  public values: {[key: string]: string|number} = {};
  public properties: string[] = [];

  constructor(public style: string) {
    style.split(TRANSFORM_SPLIT_REGEX).forEach(token => {
      var parenOpen = token.indexOf('(');
      var parenClose = token.lastIndexOf(')');
      var lhs = token.substring(0, parenOpen);
      var rhs = token.substring(parenOpen + 1, parenClose);
      this.values[lhs] = rhs;
      this.properties.push(lhs);
    });
  }
}

function compileTemplateFromTransformProperties(properties: string[]): _StyleTemplate {
  var tokens = [];
  var tokenLookup: {[key: string]: number} = {};
  properties.forEach(prop => {
    var entry = TRANSFORM_VALUES_DICTIONARY[prop]['defaults'];
    tokens.push(prop);
    tokens.push("(");
    tokenLookup[prop] = tokens.length;
    for (var i = 0; i < entry.length; i++) {
      if (i > 0) {
        tokens.push(",");
      }
      tokens.push(true);
    }
    tokens.push(")");
    tokens.push(" ");
  });
  return new _StyleTemplate(tokens, tokenLookup);
}

function concatValuesAndUnits(values, units): string {
  var combined = [];
  for (var i = 0; i < values.length; i++) {
    combined.push(values[i] + units[i]);
  }
  return combined.join(',');
}

function generateKeyframesBetweenTransforms(a: _TransformDetails, b: _TransformDetails): _TransformKeyframeValue[] {
  var usedProperties = {};

  var from = {};
  var to = {};

  a.properties.forEach(prop => {
    usedProperties[prop] = 1;
    from[prop] = a.values[prop];
  });

  b.properties.forEach(prop => {
    var val = usedProperties[prop];
    usedProperties[prop] = val == 1 ? 0 : -1;
    to[prop] = b.values[prop];
  });

  var keyframes = [];
  forEach(usedProperties, (status, prop) => {
    let defaultValue = TRANSFORM_VALUES_DICTIONARY[prop];
    if (status == 1) {
      to[prop] = concatValuesAndUnits(defaultValue.defaults, defaultValue.units);
    } else if (status == -1) {
      from[prop] = concatValuesAndUnits(defaultValue.defaults, defaultValue.units);
    }
    keyframes.push(new _TransformKeyframeValue(prop, from[prop], to[prop]));
  });

  return keyframes;
}

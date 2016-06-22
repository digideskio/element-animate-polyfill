export function isNumber(value) {
  return typeof value == 'number';
}

export function toInt(value: string|number): number {
  return <number>(parseInt(value.toString(), 10));
}

export function toFloat(value: string|number): number {
  return <number>(parseFloat(value.toString()));
}

export function isPresent(value) {
  return value != null;
}

export function roundDecimal(value: number, totalDigits: number = 2) {
  var base = 1;
  for (var i = 0; i < totalDigits; i++) base *= 10;
  return Math.round(value * base) / base;
}

export function isArray(value: any) {
  return Array.isArray(value);
}

export function isStringMap(obj: any): boolean {
  return typeof obj === 'object' && obj !== null;
}

export function forEach(collection: any[]|{[key: string]: any}, fn: Function) {
  if (isArray(collection)) {
    (<any[]>collection).forEach((value, index) => fn(value, index));
  } else if (isStringMap(collection)) {
    for (var key in collection) {
      let value = collection[key];
      fn(value, key);
    }
  } else {
    throw new Error('invalid value passed into forEach');
  }
}

export function mapEach(collection: any[]|{[key: string]: any}, fn: Function) {
  if (isArray(collection)) {
    return (<any[]>collection).map((v,i) => fn(v,i));
  }
  
  var result: {[key: string]: any} = {};
  forEach(collection, (value, prop) => {
    result[prop] = fn(value, prop); 
  });
  return result; 
}

export function every(collection: any[]|{[key: string]: any}, fn: Function) {
  if (isArray(collection)) {
    return (<any[]>collection).every((value, index) => fn(value, index));
  } else if (isStringMap(collection)) {
    for (var key in collection) {
      let value = collection[key];
      var result = fn(value, key);
      if (!result) return false;
    }
    return true;
  } else {
    throw new Error('invalid value passed into forEach');
  }
}

export function toJson(value: any) {
  return JSON.stringify(value);
}

const _$0 = 48;
const _$9 = 57;
const _$PERIOD = 46;

export function findDimensionalSuffix(value: string): string {
  for (var i = 0; i < value.length; i++) {
    var c = value.charCodeAt(i);
    if ((c >= _$0 && c <= _$9) || c == _$PERIOD) continue;
    return value.substring(i, value.length);
  }
  return '';
}

export function shallowCopy(value: any): any {
  if (isStringMap(value)) {
    var newObj = {};
    forEach(value, (v,k) => {
      newObj[k] = v;
    });
    return newObj;
  }

  if (isArray(value)) {
    return value.map(value => value);
  }

  return value;
}

export function arrayEquals(a: any[], b: any[]) {
  var valuesMap = {};
  a.forEach(v => valuesMap[v] = 1);
  b.forEach(v => valuesMap[v] = (valuesMap[v] || 0) - 1);
  return every(valuesMap, (value, key) => value == 0);
}

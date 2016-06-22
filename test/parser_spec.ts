import {
  normalizeAndValidateKeyframes,
  createValueSpectrumFromKeyframes
} from '../src/parser';
import {Keyframes} from '../src/keyframes';
import * as ANIMATION_ERRORS from '../src/errors';

function _makeIntoReadableEntries(list: any[], params: string[]): any[] {
  return list.map(entry => {
    var data = {};
    params.forEach(param => {
      var value = entry[param];
      if (value != null) {
        data[param] = value;
      }
    });
    return data;
  })
}

describe('normalizeAndValidateKeyframes', () => {
  it('should apply a series of offsets if not present', () => {
    var keyframes: {[key: string]: string}[] = [
      { width: '100px' },
      { width: '200px' },
      { width: '300px' }
    ];
    expect(normalizeAndValidateKeyframes(keyframes)).toEqual([
      { width: '100px', offset: 0 },
      { width: '200px', offset: 0.5 },
      { width: '300px', offset: 1 }
    ]);
  });
});

describe('createValueSpectrumFromKeyframes', () => {
  it('should create a spectrum table based on the provided keyframe data', () => {
    var keyframes = new Keyframes([
      {color: "red", height: 0, offset: 0},
      {color: "blue", offset: 0.2},
      {color: "black", offset: 0.8},
      {color: "white", height: 100, offset: 1}
    ]);

    // offsets = 0 , 0.2 , 0.4 , 0.6 , 0.8 , 1
    var spectrum = createValueSpectrumFromKeyframes(keyframes, 1000).spectrumMap;
    var data = {};
    var dataParams = ['offset', 'next', 'jump'];
    data['color'] = _makeIntoReadableEntries(spectrum['color'], dataParams);
    data['height'] = _makeIntoReadableEntries(spectrum['height'], dataParams);

    expect(data).toEqual({
      color: [
        {offset: 0, next: 1},
        {offset: 0.2, next: 4},
        {offset: 0.4, jump: 1},
        {offset: 0.6, jump: 1},
        {offset: 0.8, next: 5},
        {offset: 1 }
      ],
      height: [
        {offset: 0, next: 5},
        {offset: 0.2, jump: 0},
        {offset: 0.4, jump: 0},
        {offset: 0.6, jump: 0},
        {offset: 0.8, jump: 0},
        {offset: 1 }
      ]
    });
  });
});

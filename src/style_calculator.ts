import {StyleValueEntry} from './parser';

export interface StyleCalculator {
  getFinalValue(): string;
  setKeyframeRange(values: StyleValueEntry[]): void;
  calculate(index: number, percentage: number): string;
}

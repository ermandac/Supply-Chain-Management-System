declare module 'ml-stat' {
  export interface MLStatArray {
    mean: (arr: number[]) => number;
    standardDeviation: (arr: number[], unbiased?: boolean) => number;
  }
  export const array: MLStatArray;
}

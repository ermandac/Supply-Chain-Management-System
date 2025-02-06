declare module 'ml-regression-simple-linear' {
  export class SimpleLinearRegression {
    constructor(x: number[], y: number[]);
    predict(x: number): number;
    slope: number;
    intercept: number;
    r2: number;
    toString(): string;
  }
}

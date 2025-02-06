declare module 'ml-regression' {
  export class PolynomialRegression {
    constructor(x: number[], y: number[], degree: number);
    predict(x: number): number;
    toString(precision?: number): string;
    coefficients: number[];
    degree: number;
    r2: number;
  }
}

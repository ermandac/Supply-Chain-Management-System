declare module 'arima' {
  interface ArimaOptions {
    auto?: boolean;
    p?: number;
    d?: number;
    q?: number;
    P?: number;
    D?: number;
    Q?: number;
    s?: number;
    verbose?: boolean;
    method?: number;
    seasonal?: boolean;
    period?: number;
  }

  class ARIMA {
    constructor(options?: ArimaOptions);
    train(data: number[]): Promise<void>;
    predict(steps: number): Promise<number[]>;
    getConfidenceInterval(alpha: number): [number[], number[]];
    getComponents(): {
      trend: number[];
      seasonal: number[];
      residual: number[];
    };
    getAccuracy(): number;
  }

  export default ARIMA;
}

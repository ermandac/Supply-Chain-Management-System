import { Injectable } from '@angular/core';
import { ForecastResult, ForecastData } from './forecasting.service';
import { PolynomialRegression } from 'ml-regression';

@Injectable({
  providedIn: 'root'
})
export class AIForecastingService {
  private model: PolynomialRegression | null = null;
  private readonly FORECAST_HORIZON = 3; // Predict next 3 months
  private readonly POLYNOMIAL_DEGREE = 3; // Cubic polynomial for trend

  constructor() {}

  private calculateSeasonality(data: number[]): number[] {
    const seasonalityPattern = new Array(12).fill(0);
    const seasonCount = new Array(12).fill(0);
    
    // Calculate average deviation for each month
    for (let i = 0; i < data.length; i++) {
      const month = i % 12;
      seasonalityPattern[month] += data[i];
      seasonCount[month]++;
    }
    
    // Calculate average for each month
    for (let i = 0; i < 12; i++) {
      seasonalityPattern[i] = seasonalityPattern[i] / seasonCount[i];
    }
    
    // Normalize seasonality pattern
    const mean = seasonalityPattern.reduce((a, b) => a + b) / 12;
    return seasonalityPattern.map(x => x - mean);
  }



  private preprocessData(data: { date: string; value: number }[]): {
    x: number[];
    y: number[];
    dates: Date[];
  } {
    // Sort data chronologically
    const sorted = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Convert to arrays
    const x = sorted.map((_, i) => i);
    const y = sorted.map(d => d.value);
    const dates = sorted.map(d => new Date(d.date));

    return { x, y, dates };
  }



  async trainModel(trainingData: { date: string; value: number }[]) {
    if (trainingData.length < 12) {
      throw new Error('Need at least 12 data points for training');
    }

    try {
      // Preprocess the data
      const { x, y } = this.preprocessData(trainingData);
      
      // Create and train polynomial regression model
      this.model = new PolynomialRegression(x, y, this.POLYNOMIAL_DEGREE);
      console.log('Model trained successfully');
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  }

  async calculateForecast(historicalData: { date: string; value: number }[]): Promise<ForecastData> {
    if (!this.model) {
      throw new Error('Model not trained. Please train the model first.');
    }
    if (historicalData.length < 12) {
      throw new Error('Need at least 12 data points for forecasting');
    }

    try {
      // Preprocess the data
      const { x, y, dates } = this.preprocessData(historicalData);
      
      // Calculate seasonality
      const seasonalityPattern = this.calculateSeasonality(y);
      
      // Generate forecasts
      const lastX = x[x.length - 1];
      const lastDate = dates[dates.length - 1];
      const forecasts: ForecastResult[] = [];
      
      for (let i = 1; i <= this.FORECAST_HORIZON; i++) {
        const forecastX = lastX + i;
        const trend = this.model.predict(forecastX);
        const month = (lastDate.getMonth() + i) % 12;
        const seasonal = seasonalityPattern[month];
        const forecast = trend + seasonal;
        
        // Calculate confidence interval (based on model's R-squared)
        const confidence = Math.sqrt(1 - this.model.r2);
        const margin = confidence * Math.abs(forecast) * 1.96; // 95% confidence interval
        
        const forecastDate = new Date(lastDate);
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        forecasts.push({
          date: forecastDate.toISOString().slice(0, 7),
          predictedValue: Math.max(0, forecast),
          upperBound: forecast + margin,
          lowerBound: Math.max(0, forecast - margin),
          confidence: 0.95
        });
      }
      
      return {
        productId: '',
        forecasts,
        seasonalityPattern,
        trend: this.model.predict(lastX),
        accuracy: this.model.r2
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw new Error('Failed to generate forecast');
    }
  }
}

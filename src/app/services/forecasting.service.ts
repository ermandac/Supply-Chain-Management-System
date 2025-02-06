import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardService } from '../dashboard/dashboard.service';

export interface ForecastResult {
  date: string;
  predictedValue: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

export interface ForecastData {
  productId: string;
  forecasts: ForecastResult[];
  seasonalityPattern: number[];
  trend: number;
  accuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class ForecastingService {
  private readonly ALPHA = 0.3; // Increased weight for recent data
  private readonly BETA = 0.15;  // Slightly increased trend factor
  private readonly GAMMA = 0.2; // Reduced seasonal factor for more stability
  private readonly SEASON_LENGTH = 12; // Monthly seasonality
  private readonly CONFIDENCE_LEVEL = 0.95;

  constructor(private dashboardService: DashboardService) {}

  /**
   * Calculate forecast for a specific product or overall demand
   */
  calculateForecast(historicalData: { date: string; value: number }[]): ForecastData {
    // Sort data by date
    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate seasonal indices
    const seasonalIndices = this.calculateSeasonalIndices(sortedData);
    
    // Deseasonalize data
    const deseasonalizedData = sortedData.map((point, index) => ({
      ...point,
      value: point.value / seasonalIndices[index % this.SEASON_LENGTH]
    }));

    // Calculate initial trend using linear regression
    const initialTrend = this.calculateTrend(deseasonalizedData);

    // Calculate level and trend components using Holt-Winters
    const { level, trend } = this.calculateHoltWinters(deseasonalizedData);

    // Generate forecasts for next 3 months
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    const forecasts: ForecastResult[] = [];

    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      const seasonalIndex = seasonalIndices[(lastDate.getMonth() + i) % this.SEASON_LENGTH];
      const forecastValue = (level + trend * i) * seasonalIndex;
      
      // Calculate prediction intervals with dampening factor
      const stdDev = this.calculateStandardDeviation(sortedData.slice(-6).map(d => d.value)); // Use recent data only
      const z = 1.645; // 90% confidence interval for tighter bounds
      const margin = z * stdDev * Math.sqrt(1 + (i/12)) * 0.8; // Dampen the margin growth

      // Ensure forecast doesn't deviate too far from recent values
      const recentAvg = this.calculateRecentAverage(sortedData);
      const boundedForecast = this.boundForecast(forecastValue, recentAvg);

      forecasts.push({
        date: forecastDate.toISOString().slice(0, 7), // YYYY-MM format
        predictedValue: boundedForecast,
        upperBound: Math.min(boundedForecast * 1.5, boundedForecast + margin),
        lowerBound: Math.max(boundedForecast * 0.5, boundedForecast - margin),
        confidence: 0.90 // Adjusted confidence level
      });
    }

    // Calculate forecast accuracy using MAPE
    const accuracy = this.calculateAccuracy(sortedData, seasonalIndices, trend);

    return {
      productId: '', // For overall demand forecast
      forecasts,
      seasonalityPattern: seasonalIndices,
      trend: initialTrend, // Use the initial trend for the overall pattern
      accuracy
    };
  }

  private calculateSeasonalIndices(data: { date: string; value: number }[]): number[] {
    const seasonalValues: number[][] = Array(this.SEASON_LENGTH).fill(0).map(() => []);
    
    // Group values by month
    data.forEach(point => {
      const month = new Date(point.date).getMonth();
      seasonalValues[month].push(point.value);
    });

    // Calculate average for each month
    const monthlyAverages = seasonalValues.map(values => 
      values.length ? values.reduce((a, b) => a + b) / values.length : 0
    );

    // Calculate overall average
    const overallAverage = monthlyAverages.reduce((a, b) => a + b) / this.SEASON_LENGTH;

    // Calculate seasonal indices
    return monthlyAverages.map(avg => avg / overallAverage);
  }

  private calculateTrend(data: { date: string; value: number }[]): number {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, point) => sum + point.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    data.forEach((point, index) => {
      numerator += (index - xMean) * (point.value - yMean);
      denominator += Math.pow(index - xMean, 2);
    });

    return numerator / denominator;
  }

  private calculateHoltWinters(data: { date: string; value: number }[]): { level: number; trend: number } {
    let level = data[0].value;
    let trend = this.calculateInitialTrend(data);

    for (let i = 1; i < data.length; i++) {
      const oldLevel = level;
      level = this.ALPHA * data[i].value + (1 - this.ALPHA) * (level + trend);
      trend = this.BETA * (level - oldLevel) + (1 - this.BETA) * trend;
    }

    return { level, trend };
  }

  private calculateInitialTrend(data: { date: string; value: number }[]): number {
    let sum = 0;
    const n = Math.min(data.length, 12); // Use up to first 12 points
    
    for (let i = 1; i < n; i++) {
      sum += (data[i].value - data[i-1].value);
    }
    
    return sum / n;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / values.length;
    return Math.sqrt(variance);
  }

  private calculateRecentAverage(data: { date: string; value: number }[]): number {
    const recentData = data.slice(-3); // Use last 3 months
    return recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length;
  }

  private boundForecast(forecast: number, recentAvg: number): number {
    const maxDeviation = recentAvg * 0.5; // Max 50% deviation from recent average
    const upperBound = recentAvg * 1.5;
    const lowerBound = recentAvg * 0.5;
    
    return Math.min(Math.max(forecast, lowerBound), upperBound);
  }

  private calculateAccuracy(
    actual: { date: string; value: number }[],
    seasonalIndices: number[],
    trend: number
  ): number {
    let totalError = 0;
    const n = actual.length;

    for (let i = 1; i < n; i++) {
      const predicted = actual[i-1].value * (1 + trend) * 
        seasonalIndices[new Date(actual[i].date).getMonth()];
      const actualValue = actual[i].value;
      totalError += Math.abs((actualValue - predicted) / actualValue);
    }

    return 1 - (totalError / (n - 1)); // Convert MAPE to accuracy percentage
  }
}

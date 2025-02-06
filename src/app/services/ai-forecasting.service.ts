import { Injectable } from '@angular/core';
import { ForecastResult, ForecastData } from './forecasting.service';
import { PolynomialRegression } from 'ml-regression';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { array as mlArray } from 'ml-stat';

@Injectable({
  providedIn: 'root'
})
export class AIForecastingService {
  private model: PolynomialRegression | null = null;
  private readonly FORECAST_HORIZON = 12; // Predict next 12 months
  private readonly CONFIDENCE_DEGRADATION_RATE = 0.05; // Confidence decreases by 5% each month into the future
  private readonly MIN_POLYNOMIAL_DEGREE = 2;
  private readonly MAX_POLYNOMIAL_DEGREE = 4;
  private readonly MIN_DATA_POINTS = 12;
  private scalingFactors: { mean: number; std: number } | null = null;

  constructor() {}

  private calculateSeasonality(data: number[], dates: Date[]): number[] {
    // Initialize arrays for seasonal calculations
    const seasonalIndices = new Array(12).fill(0);
    const seasonCount = new Array(12).fill(0);
    
    // First pass: Calculate trend using simple linear regression
    const x = dates.map(d => d.getTime());
    const y = [...data];
    const regression = new SimpleLinearRegression(x, y);
    
    // Second pass: Calculate seasonal indices
    const detrended = y.map((val, i) => val - regression.predict(x[i]));
    
    for (let i = 0; i < detrended.length; i++) {
      const month = dates[i].getMonth();
      seasonalIndices[month] += detrended[i];
      seasonCount[month]++;
    }
    
    // Calculate average seasonal index for each month
    for (let i = 0; i < 12; i++) {
      if (seasonCount[i] > 0) {
        seasonalIndices[i] = seasonalIndices[i] / seasonCount[i];
      }
    }
    
    // Normalize seasonal indices to ensure they sum to zero
    const meanIndex = mlArray.mean(seasonalIndices);
    return seasonalIndices.map(index => index - meanIndex);
  }



  private preprocessData(data: { date: string; value: number }[]): {
    x: number[];
    y: number[];
    dates: Date[];
    originalY: number[];
  } {
    // Sort data chronologically
    const sorted = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Convert to arrays
    const x = sorted.map((_, i) => i);
    const originalY = sorted.map(d => d.value);
    const dates = sorted.map(d => new Date(d.date));

    // Scale the y values
    const yMean = mlArray.mean(originalY);
    const yStd = mlArray.standardDeviation(originalY);
    const y = originalY.map(val => (val - yMean) / yStd);

    // Store scaling factors for later use
    this.scalingFactors = { mean: yMean, std: yStd };

    return { x, y, dates, originalY };
  }



  async trainModel(trainingData: { date: string; value: number }[]) {
    if (trainingData.length < this.MIN_DATA_POINTS) {
      throw new Error(`Need at least ${this.MIN_DATA_POINTS} data points for training`);
    }

    try {
      // Preprocess the data
      const { x, y } = this.preprocessData(trainingData);
      
      // Validate data
      const hasInvalidValues = y.some(val => isNaN(val) || !isFinite(val));
      if (hasInvalidValues) {
        throw new Error('Training data contains invalid values');
      }

      // Check if all values are the same
      const allSameValue = y.every(val => val === y[0]);
      if (allSameValue) {
        // If all values are the same, use a simple constant model
        this.model = new PolynomialRegression(x, y, 0);
        console.log('Using constant model for uniform data');
        return;
      }
      
      // Find optimal polynomial degree using cross-validation
      let bestModel: PolynomialRegression | null = null;
      let bestR2 = -Infinity;
      let bestDegree = this.MIN_POLYNOMIAL_DEGREE;
      
      for (let degree = this.MIN_POLYNOMIAL_DEGREE; degree <= this.MAX_POLYNOMIAL_DEGREE; degree++) {
        try {
          const tempModel = new PolynomialRegression(x, y, degree);
          const predictions = x.map(val => tempModel.predict(val));
          
          // Check for invalid predictions
          if (predictions.some(pred => isNaN(pred) || !isFinite(pred))) {
            console.log(`Skipping degree ${degree} due to invalid predictions`);
            continue;
          }
          
          const r2 = tempModel.r2;
          console.log(`Degree ${degree} R² = ${r2?.toFixed(4) || 'N/A'}`);
          
          if (r2 > bestR2 && !isNaN(r2)) {
            bestR2 = r2;
            bestModel = tempModel;
            bestDegree = degree;
          }
        } catch (err) {
          console.log(`Failed to train model with degree ${degree}:`, err);
        }
      }
      
      if (!bestModel) {
        // Fallback to simple linear regression if polynomial regression fails
        console.log('Falling back to simple linear regression');
        const linearModel = new SimpleLinearRegression(x, y);
        this.model = new PolynomialRegression(x, y, 1);
        return;
      }
      
      this.model = bestModel;
      console.log(`Model trained successfully with degree ${bestDegree}, R² = ${bestR2.toFixed(4)}`);
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async calculateForecast(historicalData: { date: string; value: number }[]): Promise<ForecastData> {
    if (!this.model || !this.scalingFactors) {
      throw new Error('Model not trained. Please train the model first.');
    }
    if (historicalData.length < this.MIN_DATA_POINTS) {
      throw new Error(`Need at least ${this.MIN_DATA_POINTS} data points for forecasting`);
    }

    try {
      // Preprocess the data
      const { x, y, dates, originalY } = this.preprocessData(historicalData);
      
      // Calculate seasonality using original (unscaled) values
      const seasonalityPattern = this.calculateSeasonality(originalY, dates);
      
      // Generate forecasts
      const lastX = x[x.length - 1];
      const lastDate = dates[dates.length - 1];
      const lastValue = originalY[originalY.length - 1];
      const forecasts: ForecastResult[] = [];
      
      // Calculate prediction intervals and confidence degradation based on residuals
      const residuals = y.map((actual, i) => actual - this.model!.predict(x[i]));
      const residualStd = mlArray.standardDeviation(residuals);
      const baseConfidence = 0.95; // Start with 95% confidence
      const tValue = 1.96; // 95% confidence level for normal distribution
      
      // Calculate trend direction and strength
      const recentTrend = originalY.slice(-6).reduce((acc, curr, i, arr) => {
        if (i === 0) return 0;
        return acc + (curr - arr[i - 1]);
      }, 0) / 5; // Average monthly change over last 6 months
      
      for (let i = 1; i <= this.FORECAST_HORIZON; i++) {
        const forecastX = lastX + i;
        const scaledTrend = this.model.predict(forecastX);
        
        // Adjust confidence based on how far into the future we're predicting
        const confidenceAdjustment = Math.max(
          0.5, // Minimum 50% confidence
          baseConfidence - (i * this.CONFIDENCE_DEGRADATION_RATE)
        );
        
        // Increase prediction interval width for longer-term forecasts
        const intervalMultiplier = 1 + (i * 0.1); // Gradually increase interval width
        
        // Unscale the prediction
        const trend = (scaledTrend * this.scalingFactors.std) + this.scalingFactors.mean;
        
        // Add seasonality
        const month = (lastDate.getMonth() + i) % 12;
        const seasonal = seasonalityPattern[month];
        
        // Combine trend and seasonality with dampening
        const dampingFactor = Math.pow(0.9, i); // Dampen the trend over time
        const baselineForecast = lastValue + (recentTrend * i * dampingFactor);
        const forecast = (trend + seasonal + baselineForecast) / 2; // Average of model and baseline
        
        // Calculate prediction intervals with increasing uncertainty
        const predictionError = residualStd * Math.sqrt(1 + (i / x.length));
        const margin = tValue * predictionError * this.scalingFactors.std * intervalMultiplier;
        
        const forecastDate = new Date(lastDate);
        forecastDate.setMonth(forecastDate.getMonth() + i);
        
        // Calculate bounds based on historical volatility
        const volatility = Math.abs(recentTrend) / lastValue; // Relative change per month
        const minValue = Math.max(0, lastValue * Math.pow(1 - volatility, i)); // Dynamic lower bound
        const maxValue = lastValue * Math.pow(1 + volatility, i); // Dynamic upper bound
        
        const boundedForecast = Math.min(maxValue, Math.max(minValue, forecast));
        
        forecasts.push({
          date: forecastDate.toISOString().slice(0, 7),
          predictedValue: boundedForecast,
          upperBound: Math.min(maxValue, boundedForecast + margin),
          lowerBound: Math.max(minValue, boundedForecast - margin),
          confidence: confidenceAdjustment
        });
      }
      
      // Calculate overall model accuracy using MAPE
      const mape = originalY.reduce((sum, actual, i) => {
        const predicted = (this.model!.predict(x[i]) * this.scalingFactors!.std) + this.scalingFactors!.mean;
        return sum + Math.abs((actual - predicted) / actual);
      }, 0) / originalY.length;
      
      return {
        productId: '',
        forecasts,
        seasonalityPattern,
        trend: (this.model.predict(lastX) * this.scalingFactors.std) + this.scalingFactors.mean,
        accuracy: 1 - mape // Convert MAPE to accuracy (0-1 scale)
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw new Error('Failed to generate forecast');
    }
  }
}

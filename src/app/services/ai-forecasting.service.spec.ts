import { TestBed } from '@angular/core/testing';
import { AIForecastingService } from './ai-forecasting.service';
import * as tf from '@tensorflow/tfjs';

describe('AIForecastingService', () => {
  let service: AIForecastingService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AIForecastingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize model', async () => {
    // Wait for model initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(service['model']).toBeTruthy();
    expect(service['isModelReady']).toBeTrue();
  });

  it('should train and forecast', async () => {
    // Generate sample data
    const historicalData = Array.from({ length: 24 }, (_, i) => ({
      date: new Date(2024, i % 12, 1).toISOString(),
      value: 100 + Math.sin(i * Math.PI / 6) * 20 + Math.random() * 10
    }));

    // Train model
    await service.trainModel(historicalData);

    // Generate forecast
    const forecast = await service.calculateForecast(historicalData);
    
    expect(forecast).toBeTruthy();
    expect(forecast.forecasts.length).toBe(3); // FORECAST_HORIZON
    expect(forecast.seasonalityPattern.length).toBe(12);
    expect(forecast.trend).toBeDefined();
    expect(forecast.accuracy).toBeGreaterThan(0);
  });
});

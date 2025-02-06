import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { DashboardService, DashboardStats } from './dashboard.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AIForecastingService } from '../services/ai-forecasting.service';
import type { TooltipItem, ChartDataset } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  availableYears: number[] = [];
  selectedYear: number = new Date().getFullYear();
  private readonly REFRESH_INTERVAL = 60000; // 1 minute
  private refreshTimer?: any;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  dashboardStats?: DashboardStats;
  userRole: string = '';
  isLoading = true;

  // Order Trends Chart
  orderTrendsChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      { 
        data: [], 
        label: 'Number of Orders',
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        order: 2,
        spanGaps: true,
        tension: 0.3
      },
      { 
        data: [], 
        label: 'Total Amount', 
        yAxisID: 'amount',
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: true,
        order: 2,
        spanGaps: true,
        tension: 0.3
      },
      {
        data: [],
        label: 'Forecast (Orders)',
        borderColor: '#ff9800',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointStyle: 'circle',
        order: 1,
        spanGaps: true,
        tension: 0.3
      },
      {
        data: [],
        label: 'Confidence Interval',
        borderColor: 'transparent',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: true,
        order: 3,
        spanGaps: true
      }
    ]
  };

  orderTrendsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value) => value.toLocaleString()
        },
        title: {
          display: true,
          text: 'Number of Orders'
        }
      },
      amount: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: { 
          drawOnChartArea: false,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value) => `₱${value.toLocaleString()}`
        },
        title: {
          display: true,
          text: 'Total Amount (₱)'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          filter: (legendItem) => legendItem.text !== 'Confidence Interval'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>): string | string[] => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            
            if (label === 'Total Amount') {
              return `${label}: ₱${value.toLocaleString()}`;
            } else if (label === 'Forecast (Orders)') {
              const dataset = context.chart.data.datasets[3];
              const index = context.dataIndex;
              const dataValue = dataset.data[index];
              
              const tooltipValue = typeof value === 'number' ? value.toFixed(1) : '0.0';
              
              if (typeof dataValue === 'number') {
                const upperValue = dataValue;
                const lowerValue = dataset.data[dataset.data.length - 1 - index];
                
                if (typeof lowerValue === 'number' && index < dataset.data.length / 2) {
                  return [
                    `${label}: ${tooltipValue}`,
                    `Range: ${lowerValue.toFixed(1)} - ${upperValue.toFixed(1)}`
                  ];
                }
              }
              
              return `${label}: ${tooltipValue}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  // Product Categories Pie Chart
  productCategoriesChartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: [{ data: [] }]
  };

  productCategoriesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'right' }
    }
  };

  // Delivery Performance Chart
  deliveryPerformanceChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['On Time', 'Delayed'],
    datasets: [{ 
      data: [],
      backgroundColor: ['#4caf50', '#f44336']
    }]
  };

  deliveryPerformanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          padding: 20
        }
      }
    }
  };

  constructor(
    public authService: AuthService,
    private dashboardService: DashboardService,
    private aiForecasting: AIForecastingService,
    private cdr: ChangeDetectorRef
  ) {
    this.userRole = this.authService.currentUserValue?.role || '';
  }

  async ngOnInit() {
    await this.loadDashboardData();
    
    // Set up periodic refresh
    this.refreshTimer = setInterval(async () => {
      await this.loadDashboardData();
    }, this.REFRESH_INTERVAL);
  }

  ngOnDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private async loadDashboardData() {
    this.isLoading = true;
    try {
      const stats = await firstValueFrom(this.dashboardService.getDashboardStats());
      if (stats) {
        this.dashboardStats = stats;
        await this.updateCharts(stats);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }

  }

  async onYearChange(year: number) {
    this.selectedYear = year;
    if (this.dashboardStats) {
      await this.updateCharts(this.dashboardStats);
    }
  }

  private async updateCharts(stats: DashboardStats) {
    // Get all available years and update the filter if needed
    const dates = stats.monthlyOrderTrends.map(t => new Date(t.month + '-01'));
    this.availableYears = Array.from(new Set(dates.map(d => d.getFullYear()))).sort();
    
    if (!this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = Math.max(...this.availableYears);
    }
    
    // Filter data for the selected year
    const yearStart = new Date(this.selectedYear, 0, 1);
    const yearEnd = new Date(this.selectedYear, 11, 31);
    
    const yearData = stats.monthlyOrderTrends.filter(trend => {
      const trendDate = new Date(trend.month + '-01');
      return trendDate >= yearStart && trendDate <= yearEnd;
    });
    
    // Generate all months for the selected year
    const months = Array.from({ length: 12 }, (_, i) => {
      return `${this.selectedYear}-${String(i + 1).padStart(2, '0')}`;
    });

    // Create a map of the order trends for easy lookup
    const trendsMap = yearData.reduce((acc, trend) => {
      acc[trend.month] = trend;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Fill in missing months with zero values
    const filledTrends = months.map(month => ({
      month,
      count: trendsMap[month]?.count || 0,
      amount: trendsMap[month]?.amount || 0
    }));

    // Format month labels
    const monthLabels = filledTrends.map(t => {
      const [_, month] = t.month.split('-');
      const date = new Date(this.selectedYear, parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    });

    // Prepare data arrays for the chart
    const historicalOrders = filledTrends.map(t => t.count);
    const historicalAmounts = filledTrends.map(t => t.amount);
    
    // Initialize arrays for all months (past + future)
    const forecastData: (number | null)[] = Array(12).fill(null);
    const confidenceUpper: number[] = Array(12).fill(null);
    const confidenceLower: number[] = Array(12).fill(null);
    
    // Copy historical data for the first part of the forecast line
    // Only copy up to the last non-zero value to avoid trailing zeros
    let lastNonZeroIndex = historicalOrders.length - 1;
    while (lastNonZeroIndex >= 0 && historicalOrders[lastNonZeroIndex] === 0) {
      lastNonZeroIndex--;
    }
    
    for (let i = 0; i <= lastNonZeroIndex; i++) {
      forecastData[i] = historicalOrders[i];
    }
    
    try {
      const historicalData = stats.monthlyOrderTrends.map(t => ({
        date: t.month,
        value: t.count
      }));

      // Train and get forecast using AI
      await this.aiForecasting.trainModel(historicalData);
      const forecast = await this.aiForecasting.calculateForecast(historicalData);
      
      // Find the last non-zero historical value and its position
      let lastNonZeroIndex = historicalOrders.length - 1;
      while (lastNonZeroIndex >= 0 && historicalOrders[lastNonZeroIndex] === 0) {
        lastNonZeroIndex--;
      }
      const lastKnownValue = historicalOrders[lastNonZeroIndex] || 1; // Default to 1 if no non-zero values
      
      // Add forecast data starting from the last non-zero point
      forecast.forecasts.forEach((f, i) => {
        const position = lastNonZeroIndex + 1 + i;
        if (position < 12) {
          // Ensure forecast values are non-negative and maintain trend
          const minValue = Math.max(0, lastKnownValue * 0.5);
          const predictedValue = Math.max(minValue, f.predictedValue);
          
          // Set the forecast value
          forecastData[position] = predictedValue;
          
          // Calculate confidence intervals
          const range = f.upperBound - f.lowerBound;
          confidenceUpper[position] = predictedValue + range * 0.5;
          confidenceLower[position] = Math.max(minValue, predictedValue - range * 0.5);
        }
      });
      
      // Smooth the transition between historical and forecast data
      const firstForecast = forecastData[lastNonZeroIndex + 1];
      if (firstForecast !== undefined && firstForecast !== null) {
        // Add a transition point
        const transitionValue = (lastKnownValue + firstForecast) / 2;
        confidenceUpper[lastNonZeroIndex] = transitionValue * 1.1;
        confidenceLower[lastNonZeroIndex] = transitionValue * 0.9;
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
      // On error, future months will remain as initialized (null for forecast, 0 for confidence)
    }

    // Update Order Trends Chart
    this.orderTrendsChartData.labels = monthLabels;
    this.orderTrendsChartData.datasets[0].data = historicalOrders;
    this.orderTrendsChartData.datasets[1].data = historicalAmounts;
    this.orderTrendsChartData.datasets[2].data = forecastData;
    
    // Create confidence interval area
    const confidenceArea: number[] = [];
    
    // Find where the forecast starts (first non-null value after historical data)
    const forecastStartIndex = forecastData.findIndex((value, index) => 
      index > lastNonZeroIndex && value !== null
    );
    
    // Create the full confidence interval dataset
    let confidenceIntervals: (number | null)[] = Array(12).fill(null);
    
    if (forecastStartIndex !== -1) {
      // Add upper bounds
      for (let i = forecastStartIndex; i < 12; i++) {
        if (confidenceUpper[i] !== null) {
          confidenceArea.push(confidenceUpper[i]);
        }
      }
      
      // Add lower bounds in reverse order
      for (let i = 11; i >= forecastStartIndex; i--) {
        if (confidenceLower[i] !== null) {
          confidenceArea.push(confidenceLower[i]);
        }
      }
      
      // Fill in the confidence intervals
      confidenceIntervals = Array(12).fill(null);
      confidenceIntervals.splice(forecastStartIndex, confidenceArea.length, ...confidenceArea);
    }
    
    // Update chart datasets
    this.orderTrendsChartData.datasets[0].data = historicalOrders;
    this.orderTrendsChartData.datasets[1].data = historicalAmounts;
    this.orderTrendsChartData.datasets[2].data = forecastData;
    this.orderTrendsChartData.datasets[3].data = confidenceIntervals;

    // Update Product Categories Chart with formatted labels
    const categories = Object.entries(stats.productsByCategory)
      .map(([key, value]) => ({ key: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '), value }));
    this.productCategoriesChartData.labels = categories.map(c => c.key);
    this.productCategoriesChartData.datasets[0].data = categories.map(c => c.value);

    // Update Delivery Performance Chart
    this.deliveryPerformanceChartData.datasets[0].data = [
      stats.deliveryPerformance.onTime,
      stats.deliveryPerformance.delayed
    ];

    // Force chart updates
    setTimeout(() => {
      this.chart?.update('none');
    });
  }


}

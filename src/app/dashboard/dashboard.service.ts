import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface BaseModel {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface Delivery extends BaseModel {
  order: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
}

interface Order extends BaseModel {
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
}

interface Product extends BaseModel {
  name: string;
  category: string;
  status: string;
  quantity: number;
}

export interface DashboardStats {
  totalProducts: number;
  productsByCategory: { [key: string]: number };
  productsByStatus: { [key: string]: number };
  lowStockProducts: number;
  totalOrders: number;
  ordersByStatus: { [key: string]: number };
  monthlyOrderTrends: Array<{ month: string; count: number; amount: number }>;
  activeDeliveries: number;
  deliveryPerformance: { onTime: number; delayed: number; total: number };
  deliveryStatusCount: { [key: string]: number };
  averageDeliveryTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  private cachedStats?: { data: DashboardStats; timestamp: number };
  private readonly CACHE_DURATION = 30000; // 30 seconds

  getDashboardStats(): Observable<DashboardStats> {
    const apiUrl = environment.apiUrl;
    
    if (this.cachedStats && (Date.now() - this.cachedStats.timestamp) < this.CACHE_DURATION) {
      return new Observable(observer => {
        observer.next(this.cachedStats!.data);
        observer.complete();
      });
    }

    return forkJoin({
      products: this.http.get<Array<Product>>(`${apiUrl}/products`).pipe(map(data => data || [])),
      orders: this.http.get<Array<Order>>(`${apiUrl}/orders`).pipe(map(data => data || [])),
      deliveries: this.http.get<Array<Delivery>>(`${apiUrl}/deliveries`).pipe(map(data => data || []))
    }).pipe(
      map(({ products, orders, deliveries }) => {
        const stats = this.calculateStats(products, orders, deliveries);
        this.cachedStats = { data: stats, timestamp: Date.now() };
        return stats;
      })
    );
  }

  private calculateStats(products: Array<Product>, orders: Array<Order>, deliveries: Array<Delivery>): DashboardStats {
    return {
      totalProducts: products.length,
      productsByCategory: this.countByProperty(products, 'category'),
      productsByStatus: this.countByProperty(products, 'status'),
      lowStockProducts: products.filter(p => p.quantity < 10).length,
      totalOrders: orders.length,
      ordersByStatus: this.countByProperty(orders, 'status'),
      monthlyOrderTrends: this.calculateMonthlyTrends(orders),
      activeDeliveries: deliveries.filter(d => !['DELIVERED', 'FAILED'].includes(d.status)).length,
      deliveryPerformance: this.calculateDeliveryPerformance(deliveries),
      deliveryStatusCount: this.countByProperty(deliveries, 'status'),
      averageDeliveryTime: this.calculateAverageDeliveryTime(deliveries)
    };
  }

  private countByProperty<T extends Record<string, any>>(array: Array<T>, property: keyof T): { [key: string]: number } {
    return array.reduce((acc: { [key: string]: number }, item: T) => {
      const value = item[property];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateMonthlyTrends(orders: Array<Order>): Array<{ month: string; count: number; amount: number }> {
    const monthlyData: Record<string, { count: number; amount: number }> = {};
    
    orders.forEach(order => {
      const date = new Date(order.orderDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, amount: 0 };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].amount += order.totalAmount;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        amount: data.amount
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateDeliveryPerformance(deliveries: Array<Delivery>): { onTime: number; delayed: number; total: number } {
    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
    const delayedDeliveries = completedDeliveries.filter(d => {
      if (!d.actualDeliveryDate) return false;
      const estimated = new Date(d.estimatedDeliveryDate);
      const actual = new Date(d.actualDeliveryDate);
      return actual > estimated;
    });

    return {
      onTime: completedDeliveries.length - delayedDeliveries.length,
      delayed: delayedDeliveries.length,
      total: completedDeliveries.length
    };
  }

  private calculateAverageDeliveryTime(deliveries: Array<Delivery>): number {
    const completedDeliveries = deliveries.filter(d => 
      d.status === 'DELIVERED' && d.actualDeliveryDate !== undefined
    );
    
    if (completedDeliveries.length === 0) return 0;

    const totalDays = completedDeliveries.reduce((sum: number, delivery: Delivery) => {
      const start = new Date(delivery.createdAt);
      const end = new Date(delivery.actualDeliveryDate!);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);

    return Math.round(totalDays / completedDeliveries.length);
  }
}

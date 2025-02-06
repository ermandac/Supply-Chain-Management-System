import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order } from './orders.component';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  constructor(private http: HttpClient) {}

  getOrders(filters?: { userId?: string; status?: string }): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiUrl}/orders`, { params: filters || {} });
  }

  getOrder(_id: string): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${_id}`);
  }

  createOrder(order: Omit<Order, '_id' | 'createdAt' | 'updatedAt'>): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/orders`, order);
  }

  updateOrderStatus(_id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${environment.apiUrl}/orders/${_id}/status`, { status });
  }

  getPendingOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiUrl}/orders`, { 
      params: { status: 'PENDING' } 
    });
  }

  getRecentActivities(userId: string): Observable<Array<{
    id: string;
    type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'DELIVERY_UPDATED';
    title: string;
    description: string;
    icon: string;
    timestamp: Date;
  }>> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/${userId}/activities`);
  }

  cancelOrder(id: string): Observable<Order> {
    return this.http.patch<Order>(`${environment.apiUrl}/orders/${id}/cancel`, {});
  }
}

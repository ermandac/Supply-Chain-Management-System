import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Delivery } from './delivery.component';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  constructor(private http: HttpClient) {}

  getDeliveries(filters?: {
    status?: string;
    trackingNumber?: string;
  }): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${environment.apiUrl}/deliveries`, { params: filters || {} });
  }

  getDelivery(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${environment.apiUrl}/deliveries/${id}`);
  }

  getActiveDeliveries(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${environment.apiUrl}/deliveries/active`);
  }

  updateDeliveryStatus(id: string, status: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${environment.apiUrl}/deliveries/${id}/status`, { status });
  }

  updateDeliveryLocation(id: string, location: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${environment.apiUrl}/deliveries/${id}/location`, { location });
  }

  assignDriver(id: string, driverId: string): Observable<Delivery> {
    return this.http.patch<Delivery>(`${environment.apiUrl}/deliveries/${id}/driver`, { driverId });
  }

  addDeliveryNote(id: string, note: string): Observable<Delivery> {
    return this.http.post<Delivery>(`${environment.apiUrl}/deliveries/${id}/notes`, { note });
  }

  getDeliveryTracking(trackingNumber: string): Observable<{
    delivery: Delivery;
    trackingHistory: Array<{
      status: string;
      location: string;
      timestamp: Date;
      notes?: string;
    }>;
  }> {
    return this.http.get<any>(`${environment.apiUrl}/deliveries/track/${trackingNumber}`);
  }
}

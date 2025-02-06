import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  itemStatus?: 'demo' | 'inventory' | 'delivery' | 'sold' | 'returned' | 'maintenance';
  stockQuantity: number;
  manufacturer: string;
  specifications: { [key: string]: string };
  trackingDetails?: {
    serialNumber?: string;
    barcodeId?: string;
    locationTracking?: {
      currentLocation?: string;
      lastUpdated?: Date;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(filters?: {
    status?: string;
    category?: string;
  }): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { params: filters || {} });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  updateProductStatus(id: string, status: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/status`, { status });
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product);
  }

  createProduct(product: Omit<Product, '_id'>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  scanBarcode(barcodeId: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/barcode/${barcodeId}`);
  }

  updateProductTracking(
    productId: string, 
    trackingDetails: {
      serialNumber?: string;
      barcodeId?: string;
      locationTracking?: {
        currentLocation?: string;
      }
    }
  ): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${productId}/tracking`, trackingDetails);
  }

  updateItemStatus(id: string, itemStatus: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/item-status`, { itemStatus });
  }
}

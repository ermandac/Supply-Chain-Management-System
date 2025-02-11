import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

export interface Product {
  _id: string;
  instanceId: string;  // Ensure this is explicitly defined
  productModelId?: string;  // Make this optional
  name: string;
  sku: string;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  itemStatus?: 'demo' | 'inventory' | 'delivery' | 'sold' | 'returned' | 'maintenance';
  stockQuantity: number;
  manufacturer: string;
  specifications: { [key: string]: string };
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpirationDate?: Date;
  currentLocation?: string;
  maintenanceHistory?: Array<{
    date: Date;
    description: string;
    performedBy: string;
  }>;
  trackingDetails?: {
    locationTracking?: {
      lastUpdated?: Date;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalProducts: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(
    page: number = 1, 
    limit: number = 50, 
    status?: string, 
    category?: string
  ): Observable<ProductResponse> {
    // Construct query parameters
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Add optional filters
    if (status) {
      params = params.set('status', status);
    }
    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<ProductResponse>(`${this.apiUrl}/products`, { params });
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

  updateProductTracking(id: string, trackingData: {
    serialNumber?: string;
    currentLocation?: string;
  }): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/tracking`, trackingData);
  }

  updateItemStatus(id: string, itemStatus: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/item-status`, { itemStatus });
  }

  createProductInstance(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products/instances`, product);
  }

  updateCurrentLocation(id: string, currentLocation: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/location`, { currentLocation });
  }

  getProductInstances(filters?: {
    productModelId?: string;
    status?: string;
    category?: string;
  }): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/instances`, { 
      params: filters ? { ...filters } : {} 
    });
  }

  updateProductSerialNumber(id: string, serialNumber: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/serial-number`, { serialNumber });
  }

  updatePurchaseDate(id: string, purchaseDate: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/purchase-date`, { purchaseDate });
  }

  updateWarrantyExpirationDate(id: string, warrantyExpirationDate: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}/warranty-expiration`, { warrantyExpirationDate });
  }

  // Count products by specific criteria
  countProducts(
    name?: string, 
    category?: string, 
    status?: string
  ): Observable<number> {
    // Construct query parameters
    let params = new HttpParams();
    
    if (name) {
      params = params.set('name', name);
    }
    
    if (category) {
      params = params.set('category', category);
    }
    
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ count: number }>(`${this.apiUrl}/products/count`, { params })
      .pipe(
        map(response => response.count)
      );
  }
}

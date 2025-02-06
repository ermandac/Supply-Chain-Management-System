import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  unit: 'unit' | 'set' | 'kit' | 'box' | 'pack' | 'case' | 'pair';
  stockQuantity: number;
  manufacturer: string;
  specifications: { [key: string]: string };
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private http: HttpClient) {}

  getProducts(filters?: {
    status?: string;
    category?: string;
  }): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`, { params: filters || {} });
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`);
  }

  updateProductStatus(id: string, status: string): Observable<Product> {
    return this.http.patch<Product>(`${environment.apiUrl}/products/${id}/status`, { status });
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, product);
  }

  createProduct(product: Omit<Product, '_id'>): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }
}

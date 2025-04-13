import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/v1/products`, productData);
  }
  
  getProduct(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/v1/products/${id}`);
  }
  
  getProducts(params?: any): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/v1/products`, { params });
  }
  
  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/v1/products/${id}`, productData);
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  
  getProducts(params: any): Observable<any> {
    let httpParams = new HttpParams();
    
    // Thêm tham số tìm kiếm
    if (params.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params.sku) {
      httpParams = httpParams.set('sku', params.sku);
    }
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.availableOnline !== null && params.availableOnline !== undefined) {
      httpParams = httpParams.set('availableOnline', params.availableOnline);
    }
    
    // Thêm tham số phân trang
    httpParams = httpParams.set('page', params.pageIndex - 1 || 0);
    httpParams = httpParams.set('size', params.size || 10);

    return this.http.get<any>(`${environment.apiUrl}/api/v1/products`, { params: httpParams });
  }
  
  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/v1/products/${id}`, productData);
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 
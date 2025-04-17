import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/v1/categories`;

  constructor(private http: HttpClient) { }

  getCategories(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params) {
      // Thêm tham số tìm kiếm
      if (params.name) {
        httpParams = httpParams.set('name', params.name);
      }
      if (params.parentCategoryId) {
        httpParams = httpParams.set('parentCategoryId', params.parentCategoryId);
      }
      if (params.slug) {
        httpParams = httpParams.set('slug', params.slug);
      }
      if (params.status) {
        httpParams = httpParams.set('status', params.status);
      }
      
      // Thêm tham số phân trang
      if (params.page !== undefined) {
        httpParams = httpParams.set('page', params.page);
      }
      if (params.size !== undefined) {
        httpParams = httpParams.set('size', params.size);
      }
    }

    return this.http.get<any>(this.apiUrl, { params: httpParams });
  }

  getCategory(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCategory(categoryData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, categoryData);
  }

  updateCategory(id: string, categoryData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, categoryData);
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 
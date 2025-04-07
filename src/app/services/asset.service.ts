import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
    uploadAsset(formData: FormData) {
        return this.http.post<any>(`${environment.apiUrl}/assets`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
  }
  private apiUrl = `${environment.apiUrl}/assets`;

  constructor(private http: HttpClient) { 
    
  }
} 
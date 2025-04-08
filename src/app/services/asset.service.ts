import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
    uploadAsset(formData: FormData) {
        return this.http.post<any>(`${environment.apiUrl}/api/v1/asset/upload`, formData);
  }

  constructor(private http: HttpClient) { 
    
  }
} 
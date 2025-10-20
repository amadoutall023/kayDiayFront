import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ad, CreateAdRequest, AdsResponse, ExtendAdRequest, Category } from '../models/ad';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class AdsService {
  private apiUrl = 'http://localhost:3009/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAds(page: number = 1, limit: number = 10, categoryId?: number, status: string = 'active'): Observable<AdsResponse> {
    const params: any = { page, limit, status };
    if (categoryId) params.categoryId = categoryId;

    return this.http.get<AdsResponse>(`${this.apiUrl}/ads`, { params });
  }

  createAd(adData: CreateAdRequest): Observable<{ ad: Ad }> {
    return this.http.post<{ ad: Ad }>(`${this.apiUrl}/ads`, adData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  uploadPhoto(formData: FormData): Observable<{ url: string; publicId: string }> {
    return this.http.post<{ url: string; publicId: string }>(`${this.apiUrl}/ads/upload-photo`, formData, {
      headers: { 'Authorization': this.authService.getAuthHeaders().get('Authorization') || '' }
    });
  }

  extendAd(extendData: ExtendAdRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/ads/extend`, extendData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(`${this.apiUrl}/categories`);
  }

  createCategory(name: string): Observable<{ category: Category }> {
    return this.http.post<{ category: Category }>(`${this.apiUrl}/categories`, { name }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateAd(id: number, adData: any): Observable<{ ad: Ad }> {
    return this.http.put<{ ad: Ad }>(`${this.apiUrl}/ads/${id}`, adData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteAd(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/ads/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateCategory(id: number, name: string): Observable<{ category: Category }> {
    return this.http.put<{ category: Category }>(`${this.apiUrl}/categories/${id}`, { name }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteCategory(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/categories/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}

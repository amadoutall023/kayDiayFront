import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:3009/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/profile`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateProfile(userData: { name: string }): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/profile`, userData, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getSellerRequests(): Observable<{ requests: any[] }> {
    return this.http.get<{ requests: any[] }>(`${this.apiUrl}/seller-requests`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  approveSellerRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/seller-requests/${requestId}/approve`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  rejectSellerRequest(requestId: number, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/seller-requests/${requestId}/reject`, { reason }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getSellers(): Observable<{ sellers: any[] }> {
    return this.http.get<{ sellers: any[] }>(`${this.apiUrl}/sellers`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  suspendSeller(sellerId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/sellers/${sellerId}/suspend`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  activateSeller(sellerId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/sellers/${sellerId}/activate`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteSeller(sellerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sellers/${sellerId}`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}

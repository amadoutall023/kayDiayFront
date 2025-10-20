import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { Ad } from '../../models/ad';

@Component({
  selector: 'app-verification',
  imports: [CommonModule],
  templateUrl: './verification.html',
  styleUrl: './verification.css'
})
export class Verification implements OnInit {
  pendingAds: Ad[] = [];
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadPendingAds();
  }

  loadPendingAds() {
    this.loading = true;
    this.error = '';

    this.http.get<{ ads: Ad[] }>('http://localhost:3009/api/verification/pending', {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response) => {
        this.pendingAds = response.ads;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des annonces en attente';
        console.error('Erreur:', err);
      }
    });
  }

  approveAd(adId: number) {
    this.http.put(`http://localhost:3009/api/verification/${adId}/approve`, {}, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.loadPendingAds(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur lors de l\'approbation:', err);
        this.error = 'Erreur lors de l\'approbation de l\'annonce';
      }
    });
  }

  rejectAd(adId: number) {
    const reason = prompt('Raison du rejet (optionnel):');
    const body = reason ? { reason } : {};

    this.http.put(`http://localhost:3009/api/verification/${adId}/reject`, body, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.loadPendingAds(); // Recharger la liste
      },
      error: (err) => {
        console.error('Erreur lors du rejet:', err);
        this.error = 'Erreur lors du rejet de l\'annonce';
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  }
}

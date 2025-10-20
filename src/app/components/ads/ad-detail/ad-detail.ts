import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdsService } from '../../../services/ads';
import { Ad } from '../../../models/ad';

@Component({
  selector: 'app-ad-detail',
  imports: [CommonModule],
  templateUrl: './ad-detail.html',
  styleUrl: './ad-detail.css'
})
export class AdDetail implements OnInit {
  ad: Ad | null = null;
  loading = false;
  error = '';
  currentImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adsService: AdsService
  ) {}

  ngOnInit() {
    const adId = this.route.snapshot.params['id'];
    if (adId) {
      this.loadAd(adId);
    }
  }

  loadAd(adId: string) {
    this.loading = true;
    this.error = '';

    // For now, we'll get ads and find the specific one
    // In a real app, you'd have a getAdById method
    this.adsService.getAds(1, 100).subscribe({
      next: (response) => {
        const foundAd = response.ads.find(ad => ad.id === parseInt(adId));
        if (foundAd) {
          this.ad = foundAd;
        } else {
          this.error = 'Annonce non trouvée';
        }
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement de l\'annonce';
        console.error('Erreur:', err);
      }
    });
  }

  nextImage() {
    if (this.ad && this.ad.images && this.ad.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.ad.images.length;
    }
  }

  prevImage() {
    if (this.ad && this.ad.images && this.ad.images.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 ? this.ad.images.length - 1 : this.currentImageIndex - 1;
    }
  }

  setCurrentImage(index: number) {
    this.currentImageIndex = index;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_verification': return 'bg-warning';
      case 'expired': return 'bg-secondary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_verification': return 'En attente';
      case 'expired': return 'Expirée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}

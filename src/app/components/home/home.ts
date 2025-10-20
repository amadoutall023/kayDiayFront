import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdsService } from '../../services/ads';
import { AuthService } from '../../services/auth';
import { Ad, Category, AdsResponse } from '../../models/ad';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  ads: Ad[] = [];
  categories: Category[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedAd: Ad | null = null;
  currentImageIndex = 0;
  showAdModal = false;

  constructor(
    private adsService: AdsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadAds();
  }

  loadCategories() {
    this.adsService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  loadAds() {
    this.loading = true;
    this.error = '';

    this.adsService.getAds(1, 12, this.selectedCategoryId || undefined, 'all').subscribe({
      next: (response: AdsResponse) => {
        this.ads = response.ads.filter(ad =>
          !this.searchQuery ||
          ad.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          ad.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des annonces';
        console.error('Erreur:', err);
      }
    });
  }

  onCategoryClick(categoryId: number) {
    this.router.navigate(['/dashboard/ads'], { queryParams: { categoryId } });
  }

  onSearchChange() {
    this.loadAds();
  }

  onCategoryFilterChange() {
    this.loadAds();
  }

  onCategorySelectChange() {
    this.loadAds();
  }

  clearSearch() {
    this.searchQuery = '';
    this.loadAds();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge bg-success';
      case 'pending_verification': return 'badge bg-warning';
      case 'expired': return 'badge bg-secondary';
      case 'rejected': return 'badge bg-danger';
      default: return 'badge bg-secondary';
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

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  openAdModal(ad: Ad) {
    this.selectedAd = ad;
    this.currentImageIndex = 0;
    this.showAdModal = true;
  }

  closeAdModal() {
    this.showAdModal = false;
    this.selectedAd = null;
    this.currentImageIndex = 0;
  }

  nextImage() {
    if (this.selectedAd && this.selectedAd.images && this.selectedAd.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedAd.images.length;
    }
  }

  prevImage() {
    if (this.selectedAd && this.selectedAd.images && this.selectedAd.images.length > 0) {
      this.currentImageIndex = this.currentImageIndex === 0 ? this.selectedAd.images.length - 1 : this.currentImageIndex - 1;
    }
  }

  setCurrentImage(index: number) {
    this.currentImageIndex = index;
  }
}

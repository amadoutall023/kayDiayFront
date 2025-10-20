import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdsService } from '../../../services/ads';
import { Ad, Category, AdsResponse } from '../../../models/ad';

@Component({
  selector: 'app-ad-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './ad-list.html',
  styleUrl: './ad-list.css'
})
export class AdList implements OnInit {
  ads: Ad[] = [];
  categories: Category[] = [];
  loading = false;
  error = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalAds = 0;

  // Filters
  selectedCategoryId: number | null = null;

  constructor(private adsService: AdsService, private router: Router) {}

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

    this.adsService.getAds(this.currentPage, 10, this.selectedCategoryId || undefined).subscribe({
      next: (response: AdsResponse) => {
        this.ads = response.ads;
        this.totalAds = response.pagination.total;
        this.totalPages = response.pagination.pages;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des annonces';
        console.error('Erreur:', err);
      }
    });
  }

  onCategoryChange() {
    this.currentPage = 1;
    this.loadAds();
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAds();
    }
  }

  getPagesArray(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
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

  editAd(ad: Ad) {
    // Navigate to edit page with ad data
    this.router.navigate(['/dashboard/ads/create'], {
      queryParams: { edit: ad.id }
    });
  }

  deleteAd(ad: Ad) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'annonce "${ad.title}" ?`)) {
      this.adsService.deleteAd(ad.id).subscribe({
        next: (response) => {
          console.log('Ad deleted:', response);
          this.loadAds(); // Reload the list
        },
        error: (err) => {
          console.error('Error deleting ad:', err);
          alert('Erreur lors de la suppression de l\'annonce');
        }
      });
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdsService } from '../../services/ads';
import { AuthService } from '../../services/auth';
import { Ad, Category, AdsResponse } from '../../models/ad';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, TitleCasePipe, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  ads: Ad[] = [];
  categories: Category[] = [];
  categoryAds: Ad[] = [];
  loading = false;
  error = '';
  categoryLoading = false;
  categoryError = '';
  searchQuery = '';
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;
  selectedAd: Ad | null = null;
  currentImageIndex = 0;
  showAdModal = false;

  constructor(
    private adsService: AdsService,
    private authService: AuthService,
    private router: Router
  ) { }

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
    this.selectedCategory = this.categories.find(category => category.id === categoryId) || null;
    this.selectedCategoryId = categoryId;
    this.loadAds();
    this.loadCategoryAds(categoryId);

    setTimeout(() => {
      const categorySection = document.querySelector('#category-products');
      if (categorySection) {
        categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }

  onExploreCategoryChange() {
    if (!this.selectedCategoryId) {
      this.selectedCategory = null;
      this.categoryAds = [];
      this.categoryError = '';
      this.loadAds();
      return;
    }

    this.onCategoryClick(this.selectedCategoryId);
  }

  loadCategoryAds(categoryId: number) {
    this.categoryLoading = true;
    this.categoryError = '';

    this.adsService.getAds(1, 12, categoryId, 'all').subscribe({
      next: (response: AdsResponse) => {
        this.categoryAds = response.ads;
        this.categoryLoading = false;
      },
      error: (err) => {
        this.categoryLoading = false;
        this.categoryError = 'Erreur lors du chargement des produits de cette categorie';
        console.error('Erreur:', err);
      }
    });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/login']);
  }

  goToDashboard() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  contactSellerOnWhatsApp() {
    if (!this.selectedAd?.phone) {
      alert('Ce vendeur n\'a pas renseigné de numéro WhatsApp.');
      return;
    }

    const sanitizedPhone = this.selectedAd.phone.replace(/\D/g, '');
    if (!sanitizedPhone) {
      alert('Le numéro du vendeur est invalide.');
      return;
    }

    const message = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par votre produit "${this.selectedAd.title}". Est-il toujours disponible ?`
    );
    window.open(`https://wa.me/${sanitizedPhone}?text=${message}`, '_blank');
  }
}

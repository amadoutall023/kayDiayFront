import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdsService } from '../../services/ads';
import { Ad, AdsResponse, Category } from '../../models/ad';

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, TitleCasePipe, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  ads: Ad[] = [];
  categories: Category[] = [];
  categoryAds: Ad[] = [];
  loading = false;
  error = '';
  categoryLoading = false;
  categoryError = '';
  searchQuery = '';
  searchCategoryId: number | null = null;
  selectedCategoryId: number | null = null;
  selectedCategory: Category | null = null;
  selectedAd: Ad | null = null;
  currentImageIndex = 0;
  showAdModal = false;
  contactMessage = '';

  readonly skeletonCards = [1, 2, 3, 4, 5, 6];

  @ViewChild('modalCloseButton') private modalCloseButton?: ElementRef<HTMLButtonElement>;

  private readonly searchInput$ = new Subject<string>();
  private readonly destroyRef: DestroyRef;
  private allAds: Ad[] = [];
  private adsRequestId = 0;
  private categoryRequestId = 0;
  private modalTrigger: HTMLElement | null = null;
  private previousBodyOverflow = '';

  constructor(
    private adsService: AdsService,
    private router: Router,
    destroyRef: DestroyRef
  ) {
    this.destroyRef = destroyRef;
  }

  ngOnInit() {
    this.searchInput$
      .pipe(debounceTime(180), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applySearch());

    this.loadCategories();
    this.loadAds();
  }

  ngOnDestroy() {
    if (this.showAdModal) {
      document.body.style.overflow = this.previousBodyOverflow;
    }
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

  loadAds(categoryId?: number) {
    const requestId = ++this.adsRequestId;
    this.loading = true;
    this.error = '';

    this.adsService.getAds(1, 12, categoryId, 'all').subscribe({
      next: (response: AdsResponse) => {
        if (requestId !== this.adsRequestId) {
          return;
        }

        this.allAds = response.ads;
        this.applySearch();
        this.loading = false;
      },
      error: (err) => {
        if (requestId !== this.adsRequestId) {
          return;
        }

        this.loading = false;
        this.error = 'Les annonces ne sont pas disponibles pour le moment.';
        console.error('Erreur:', err);
      }
    });
  }

  private applySearch() {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      this.ads = [...this.allAds];
      return;
    }

    this.ads = this.allAds.filter((ad) => {
      const searchableText = [
        ad.title,
        ad.description,
        ad.address,
        ad.category?.name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }

  onSearchChange() {
    this.searchInput$.next(this.searchQuery);
  }

  submitSearch() {
    this.applySearch();
    document.querySelector('#latest-listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onCategoryFilterChange() {
    this.loadAds(this.searchCategoryId ?? undefined);
  }

  clearSearch() {
    this.searchQuery = '';
    this.applySearch();
  }

  resetSearchFilters() {
    this.searchQuery = '';
    this.searchCategoryId = null;
    this.applySearch();
    this.loadAds();
  }

  onCategoryClick(categoryId: number) {
    this.selectedCategory = this.categories.find((category) => category.id === categoryId) || null;
    this.selectedCategoryId = categoryId;
    this.loadCategoryAds(categoryId);

    setTimeout(() => {
      document.querySelector('#category-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  onExploreCategoryChange() {
    if (!this.selectedCategoryId) {
      this.selectedCategory = null;
      this.categoryAds = [];
      this.categoryError = '';
      return;
    }

    this.onCategoryClick(this.selectedCategoryId);
  }

  retrySelectedCategory() {
    if (this.selectedCategoryId) {
      this.loadCategoryAds(this.selectedCategoryId);
    }
  }

  loadCategoryAds(categoryId: number) {
    const requestId = ++this.categoryRequestId;
    this.categoryLoading = true;
    this.categoryError = '';

    this.adsService.getAds(1, 12, categoryId, 'all').subscribe({
      next: (response: AdsResponse) => {
        if (requestId !== this.categoryRequestId) {
          return;
        }

        this.categoryAds = response.ads;
        this.categoryLoading = false;
      },
      error: (err) => {
        if (requestId !== this.categoryRequestId) {
          return;
        }

        this.categoryLoading = false;
        this.categoryError = 'Les annonces de cette catégorie ne sont pas disponibles pour le moment.';
        console.error('Erreur:', err);
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'badge home-status-badge home-status-badge--available';
      case 'pending_verification':
        return 'badge home-status-badge home-status-badge--pending';
      case 'expired':
        return 'badge home-status-badge home-status-badge--muted';
      case 'rejected':
        return 'badge home-status-badge home-status-badge--unavailable';
      default:
        return 'badge home-status-badge home-status-badge--muted';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Disponible';
      case 'pending_verification':
        return 'En vérification';
      case 'expired':
        return 'Expirée';
      case 'rejected':
        return 'Indisponible';
      default:
        return status;
    }
  }

  goToLogin() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/login']);
  }

  browseListings() {
    this.router.navigate(['/explorer']);
    window.scrollTo({ top: 0 });
  }

  goToDashboard() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/dashboard']);
  }

  openAdModal(ad: Ad, trigger?: EventTarget | null) {
    this.selectedAd = ad;
    this.currentImageIndex = 0;
    this.contactMessage = '';
    this.modalTrigger = trigger instanceof HTMLElement ? trigger : null;
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.showAdModal = true;

    setTimeout(() => this.modalCloseButton?.nativeElement.focus());
  }

  closeAdModal() {
    if (!this.showAdModal) {
      return;
    }

    this.showAdModal = false;
    this.selectedAd = null;
    this.currentImageIndex = 0;
    this.contactMessage = '';
    document.body.style.overflow = this.previousBodyOverflow;

    const trigger = this.modalTrigger;
    this.modalTrigger = null;
    setTimeout(() => {
      if (trigger?.isConnected) {
        trigger.focus();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showAdModal) {
      this.closeAdModal();
    }
  }

  handleModalKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') {
      return;
    }

    const modal = event.currentTarget as HTMLElement;
    const focusableElements = Array.from(
      modal.querySelectorAll<HTMLElement>('[data-modal-focusable]')
    ).filter((element) => !element.hasAttribute('disabled'));

    if (!focusableElements.length) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  nextImage() {
    if (this.selectedAd?.images?.length) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.selectedAd.images.length;
    }
  }

  prevImage() {
    if (this.selectedAd?.images?.length) {
      this.currentImageIndex =
        this.currentImageIndex === 0
          ? this.selectedAd.images.length - 1
          : this.currentImageIndex - 1;
    }
  }

  setCurrentImage(index: number) {
    this.currentImageIndex = index;
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    image.hidden = true;
    image.parentElement
      ?.querySelector<HTMLElement>('.home-image-fallback')
      ?.classList.add('home-image-fallback--visible');
  }

  contactSellerOnWhatsApp() {
    if (!this.selectedAd?.phone) {
      this.contactMessage = 'Ce vendeur n’a pas renseigné de numéro WhatsApp.';
      return;
    }

    const sanitizedPhone = this.selectedAd.phone.replace(/\D/g, '');
    if (!sanitizedPhone) {
      this.contactMessage = 'Le numéro du vendeur est invalide.';
      return;
    }

    const message = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par votre produit "${this.selectedAd.title}". Est-il toujours disponible ?`
    );
    this.contactMessage = '';
    window.open(`https://wa.me/${sanitizedPhone}?text=${message}`, '_blank', 'noopener');
  }
}

import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, expand, reduce } from 'rxjs';
import { AdsService } from '../../services/ads';
import { Ad, Category } from '../../models/ad';

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit {
  categories: Category[] = [];
  ads: Ad[] = [];
  filteredAds: Ad[] = [];
  searchQuery = '';
  selectedCategoryId: number | null = null;
  loading = true;
  error = '';
  categoryError = '';
  visibleCount = 12;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private adsService: AdsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.searchQuery = params.get('q') || '';
      const category = Number(params.get('category'));
      this.selectedCategoryId = Number.isInteger(category) && category > 0 ? category : null;
      this.filterAds();
    });
    this.loadCategories();
    this.loadAds();
  }

  loadCategories() {
    this.categoryError = '';
    this.adsService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.categories = response.categories; },
      error: () => { this.categoryError = 'Les catégories ne sont pas disponibles pour le moment.'; }
    });
  }

  loadAds() {
    this.loading = true;
    this.error = '';
    // Follow every API page so search also finds ads beyond the first results.
    this.adsService.getAds(1, 100, undefined, 'active').pipe(
      expand(response => response.pagination.page < response.pagination.pages
        ? this.adsService.getAds(response.pagination.page + 1, 100, undefined, 'active')
        : EMPTY),
      reduce((ads, response) => ads.concat(response.ads.filter(ad => ad.status === 'active')), [] as Ad[]),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ads => {
        this.ads = ads;
        this.filterAds();
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les annonces. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();
  }

  private filterAds() {
    const words = this.normalize(this.searchQuery).split(/\s+/).filter(Boolean);
    this.filteredAds = this.ads.filter(ad => {
      if (this.selectedCategoryId !== null && ad.categoryId !== this.selectedCategoryId) return false;
      const text = this.normalize([ad.title, ad.description, ad.address, ad.category?.name].filter(Boolean).join(' '));
      return words.every(word => text.includes(word));
    });
    this.visibleCount = 12;
  }

  updateFilters() {
    this.filterAds();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery || null, category: this.selectedCategoryId },
      replaceUrl: true
    });
  }

  selectCategory(categoryId: number | null) {
    this.selectedCategoryId = categoryId;
    this.updateFilters();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategoryId = null;
    this.updateFilters();
  }

  showMore() {
    this.visibleCount += 12;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(price);
  }
}

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Explore } from './explore';
import { AdDetail } from '../ads/ad-detail/ad-detail';
import { AdsService } from '../../services/ads';
import { Ad, AdsResponse } from '../../models/ad';

describe('Explore listings', () => {
  let adsService: jasmine.SpyObj<AdsService>;
  const categories = [
    { id: 1, name: 'Électronique', createdAt: '' },
    { id: 2, name: 'Mobilier', createdAt: '' }
  ];
  function ad(id: number, title = 'Téléphone', categoryId = 1): Ad {
    return {
      id, title, categoryId, category: categories[categoryId - 1],
      description: 'Objet en très bon état', address: 'Dakar', price: 5000,
      images: [], status: 'active', verificationStatus: 'verified', userId: 1,
      user: { id: 1, name: 'Vendeur', email: '' }, createdAt: '', updatedAt: ''
    };
  }
  function page(ads: Ad[], current = 1, pages = 1): AdsResponse {
    return { ads, pagination: { page: current, pages, total: ads.length, limit: 100 } };
  }
  beforeEach(async () => {
    adsService = jasmine.createSpyObj('AdsService', ['getCategories', 'getAds', 'getAdById']);
    adsService.getCategories.and.returnValue(of({ categories }));
    adsService.getAds.and.returnValue(of(page([ad(1), ad(2, 'Table', 2)])));
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'explorer', component: Explore }, { path: 'ads/:id', component: AdDetail }]),
        { provide: AdsService, useValue: adsService }
      ]
    }).compileComponents();
  });

  it('renders a public page with horizontally scrolling category buttons and a search input', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer', Explore);
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    expect(root.querySelector('h1')?.textContent).toContain('Explorer les annonces');
    expect(root.querySelector('input[type=search]')).not.toBeNull();
    expect(root.querySelectorAll('.explore-category').length).toBe(3);
    const rail = root.querySelector('.explore-categories')!;
    expect(getComputedStyle(rail).overflowX).toBe('auto');
    expect(getComputedStyle(rail).flexWrap).toBe('nowrap');
    expect(component.filteredAds.length).toBe(2);
  });

  it('loads subsequent API pages and finds an ad beyond the first page', async () => {
    adsService.getAds.and.callFake(current => of(current === 1
      ? page([ad(1)], 1, 2) : page([ad(151, 'Vélo rouge')], 2, 2)));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer?q=velo%20rouge', Explore);
    expect(adsService.getAds).toHaveBeenCalledWith(2, 100, undefined, 'active');
    expect(component.filteredAds.map(ad => ad.id)).toEqual([151]);
  });

  it('combines accent-insensitive search with a category and restores filters from the URL', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer?q=electronique&category=1', Explore);
    expect(component.selectedCategoryId).toBe(1);
    expect(component.filteredAds.map(ad => ad.id)).toEqual([1]);
    component.selectCategory(2);
    expect(component.filteredAds.length).toBe(0);
    component.resetFilters();
    expect(component.filteredAds.length).toBe(2);
  });

  it('keeps spaces while typing a multiword search and updates the URL', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer', Explore);
    component.searchQuery = 'velo ';
    component.updateFilters();
    await harness.fixture.whenStable();
    expect(component.searchQuery).toBe('velo ');
  });

  it('makes every result accessible with show more and excludes nonpublic ads', async () => {
    const records = Array.from({ length: 25 }, (_, i) => ad(i + 1));
    adsService.getAds.and.returnValue(of(page([...records, { ...ad(99), status: 'rejected' }])));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer', Explore);
    expect(component.filteredAds.length).toBe(25);
    expect(harness.routeNativeElement!.querySelectorAll('.explore-card').length).toBe(12);
    component.showMore();
    component.showMore();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('.explore-card').length).toBe(25);
    component.searchQuery = 'introuvable';
    component.updateFilters();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Aucune annonce ne correspond');
  });

  it('allows retrying failed listing and category requests', async () => {
    adsService.getAds.and.returnValue(throwError(() => new Error('offline')));
    adsService.getCategories.and.returnValue(throwError(() => new Error('offline')));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/explorer', Explore);
    expect(component.loading).toBeFalse();
    expect(component.error).toContain('Impossible');
    expect(component.categoryError).not.toBe('');
    adsService.getAds.and.returnValue(of(page([ad(1)])));
    adsService.getCategories.and.returnValue(of({ categories }));
    component.loadAds();
    component.loadCategories();
    expect(component.error).toBe('');
    expect(component.categoryError).toBe('');
    expect(component.filteredAds.length).toBe(1);
  });

  it('opens the detail of an ad beyond the first hundred using its ID', async () => {
    adsService.getAdById.and.returnValue(of({ ad: ad(151) }));
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/ads/151', AdDetail);
    expect(adsService.getAdById).toHaveBeenCalledOnceWith(151);
    expect(adsService.getAds).not.toHaveBeenCalled();
    expect(component.ad?.id).toBe(151);
  });
});

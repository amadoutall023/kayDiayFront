import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { Home } from './components/home/home';
import { Explore } from './components/explore/explore';
import { AdsService } from './services/ads';
import { AuthService } from './services/auth';

describe('Mobile page width', () => {
  let frames: HTMLIFrameElement[];
  beforeEach(async () => {
    frames = [];
    const categories = Array.from({ length: 14 }, (_, i) => ({
      id: i + 1, name: 'CatégorieAvecUnNomTrèsLongSansEspaces' + i, createdAt: ''
    }));
    const records = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1, title: 'TitreSansEspaces'.repeat(8), description: 'Description '.repeat(20),
      address: 'QuartierAvecUnNomTrèsLongSansEspaces', category: categories[0], categoryId: 1,
      status: 'active', images: [], price: 1000000
    }));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: '', component: Home }, { path: 'explorer', component: Explore }]),
        { provide: AdsService, useValue: {
          getAds: () => of({ ads: records, pagination: { page: 1, pages: 1, total: 4, limit: 100 } }),
          getCategories: () => of({ categories })
        } },
        { provide: AuthService, useValue: { isAuthenticated: () => false, getCurrentUser: () => null } }
      ]
    }).compileComponents();
  });

  afterEach(() => frames.forEach(frame => frame.remove()));

  for (const route of ['/', '/explorer']) {
    for (const width of [320, 390, 768]) {
      it(`keeps ${route} within ${width}px and confines category scrolling to its rail`, async () => {
        const fixture = TestBed.createComponent(App);
        fixture.detectChanges();
        await TestBed.inject(Router).navigateByUrl(route);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        // Use a real viewport so media queries and intrinsic grid sizing are exercised.
        const css = Array.from(document.styleSheets).map(sheet =>
          Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n')
        ).join('\n');
        const frame = document.createElement('iframe');
        frame.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:850px;border:0`;
        document.body.appendChild(frame);
        frames.push(frame);
        const doc = frame.contentDocument!;
        doc.open();
        doc.write('<!doctype html><html><head><style>' + css + '</style></head><body></body></html>');
        doc.close();
        doc.body.appendChild(fixture.nativeElement.cloneNode(true));
        const viewport = doc.documentElement.clientWidth;
        expect(doc.documentElement.scrollWidth).withContext('document width').toBeLessThanOrEqual(viewport + 1);
        for (const element of Array.from(doc.querySelectorAll<HTMLElement>(
          '.site-nav-inner, .footer-grid, .home-search-counter, .explore-filters, .explore-search'
        ))) {
          const bounds = element.getBoundingClientRect();
          expect(bounds.left).withContext(element.className + ' left').toBeGreaterThanOrEqual(-1);
          expect(bounds.right).withContext(element.className + ' right').toBeLessThanOrEqual(viewport + 1);
        }
        const menu = doc.querySelector('.menu-toggle')!;
        expect(frame.contentWindow!.getComputedStyle(menu).display).not.toBe('none');
        if (route === '/explorer') {
          const rail = doc.querySelector<HTMLElement>('.explore-categories')!;
          expect(rail.scrollWidth).toBeGreaterThan(rail.clientWidth);
          rail.scrollLeft = 150;
          expect(rail.scrollLeft).toBeGreaterThan(0);
          expect(doc.documentElement.scrollLeft).toBe(0);
        }
        if (width < 768) {
          for (const input of Array.from(doc.querySelectorAll('input, select, textarea'))) {
            expect(parseFloat(frame.contentWindow!.getComputedStyle(input).fontSize)).toBeGreaterThanOrEqual(16);
          }
        }
      });
    }
  }
});

import { Component, DestroyRef, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { PwaInstall } from './components/pwa-install/pwa-install';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, PwaInstall],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  menuOpen = false;
  readonly currentYear = new Date().getFullYear();
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('siteMenu') private siteMenu?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;

  constructor(public authService: AuthService, public router: Router) {
    router.events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.menuOpen = false; });
  }

  get isDashboard(): boolean { return this.router.url.split(/[?#]/)[0].startsWith('/dashboard'); }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent) {
    const target = event.target;
    if (!this.menuOpen || !(target instanceof Node)) return;

    if (!this.siteMenu?.nativeElement.contains(target) &&
        !this.menuToggle?.nativeElement.contains(target)) {
      this.menuOpen = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

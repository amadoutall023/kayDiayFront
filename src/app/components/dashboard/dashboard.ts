import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AdsService } from '../../services/ads';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  statsLoading = true;
  statsError = false;
  userAdsCount = 0;
  activeAdsCount = 0;
  pendingAdsCount = 0;

  constructor(
    public authService: AuthService,
    private adsService: AdsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserStats();
  }

  loadUserStats() {
    this.statsLoading = true;
    this.statsError = false;
    forkJoin({
      all: this.adsService.getMyAds(1, 1),
      active: this.adsService.getMyAds(1, 1, 'active'),
      pending: this.adsService.getMyAds(1, 1, 'pending_verification')
    }).subscribe({
      next: (response) => {
        this.statsLoading = false;
        this.userAdsCount = response.all.pagination.total;
        this.activeAdsCount = response.active.pagination.total;
        this.pendingAdsCount = response.pending.pagination.total;
      },
      error: (err) => {
        this.statsLoading = false;
        this.statsError = true;
        console.error('Erreur lors du chargement des statistiques:', err);
        this.userAdsCount = 0;
        this.activeAdsCount = 0;
        this.pendingAdsCount = 0;
      }
    });
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'moderator':
        return 'bg-warning text-dark';
      default:
        return 'bg-secondary';
    }
  }

  getRoleText(role?: string): string {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'moderator':
        return 'Modérateur';
      default:
        return 'Utilisateur';
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

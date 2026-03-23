import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AdsService } from '../../services/ads';
import { CommonModule } from '@angular/common';
import { Ad } from '../../models/ad';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
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
    this.adsService.getMyAds(1, 100).subscribe({
      next: (response) => {
        const ads = response.ads;
        this.userAdsCount = ads.length;
        this.activeAdsCount = ads.filter((ad: Ad) => ad.status === 'active').length;
        this.pendingAdsCount = ads.filter((ad: Ad) => ad.status === 'pending_verification').length;
      },
      error: (err) => {
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

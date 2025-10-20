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
  styleUrl: './dashboard.css'
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
    // Load user's ads to calculate stats
    // This would typically come from a dedicated endpoint
    // For now, we'll set some placeholder values
    this.userAdsCount = 0;
    this.activeAdsCount = 0;
    this.pendingAdsCount = 0;
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

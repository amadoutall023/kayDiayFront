import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { AdsService } from '../../../services/ads';
import { Ad, AdsResponse } from '../../../models/ad';
import { UsersService } from '../../../services/users';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h3><i class="fas fa-user me-2"></i>Mon profil</h3>
      </div>

      <!-- User Info -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Informations du compte</h5>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Nom:</strong> {{ user?.name }}</p>
              <p><strong>Email:</strong> {{ user?.email }}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Rôle:</strong> <span class="badge" [ngClass]="getRoleBadgeClass()">{{ getRoleText() }}</span></p>
              <p><strong>Statut:</strong> {{ user?.status }}</p>
            </div>
          </div>
          
          <!-- Become Seller Button -->
          <div *ngIf="user?.role === 'user'" class="mt-3 p-3 bg-light rounded">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <i class="fas fa-store me-2 text-primary"></i>
                <span class="text-muted">Vous souhaitez vendre vos produits ?</span>
              </div>
              <button class="btn btn-primary" (click)="requestSellerRole()" [disabled]="requestingSeller">
                <span *ngIf="requestingSeller" class="spinner-border spinner-border-sm me-1"></span>
                <i *ngIf="!requestingSeller" class="fas fa-user-plus me-1"></i>
                {{ requestingSeller ? 'Envoi...' : 'Devenir vendeur' }}
              </button>
            </div>
          </div>
          
          <!-- Seller Request Status -->
          <div *ngIf="user?.role === 'seller' && user?.status === 'pending'" class="mt-3 p-3 bg-warning rounded">
            <i class="fas fa-clock me-2"></i>
            <span>Votre demande de vendeur est en cours d'examen par l'administrateur.</span>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Changer le mot de passe</h5>

          <div *ngIf="passwordSuccess" class="alert alert-success">
            {{ passwordSuccess }}
          </div>

          <div *ngIf="passwordError" class="alert alert-danger">
            {{ passwordError }}
          </div>

          <form (ngSubmit)="changePassword()" #passwordForm="ngForm">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="currentPassword" class="form-label">Mot de passe actuel</label>
                <input
                  id="currentPassword"
                  type="password"
                  class="form-control"
                  name="currentPassword"
                  [(ngModel)]="passwordData.currentPassword"
                  required>
              </div>
              <div class="col-md-4 mb-3">
                <label for="newPassword" class="form-label">Nouveau mot de passe</label>
                <input
                  id="newPassword"
                  type="password"
                  class="form-control"
                  name="newPassword"
                  [(ngModel)]="passwordData.newPassword"
                  minlength="6"
                  required>
              </div>
              <div class="col-md-4 mb-3">
                <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control"
                  name="confirmPassword"
                  [(ngModel)]="passwordData.confirmPassword"
                  required>
              </div>
            </div>

            <button class="btn btn-primary" type="submit" [disabled]="changingPassword || passwordForm.invalid">
              <span *ngIf="changingPassword" class="spinner-border spinner-border-sm me-1"></span>
              <i *ngIf="!changingPassword" class="fas fa-key me-1"></i>
              {{ changingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
            </button>
          </form>
        </div>
      </div>

      <!-- My Ads -->
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="card-title mb-0"><i class="fas fa-list me-2"></i>Mes annonces</h5>
          </div>

          <div *ngIf="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Chargement...</span>
            </div>
          </div>

          <div *ngIf="!loading && myAds.length === 0" class="alert alert-info">
            Vous n'avez pas encore d'annonces. <a routerLink="/dashboard/ads/create">Créer une annonce</a>
          </div>

          <div *ngIf="!loading && myAds.length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ad of myAds">
                  <td>{{ ad.title }}</td>
                  <td>{{ ad.category.name }}</td>
                  <td>{{ ad.price | number:'1.0-0' }} CFA</td>
                  <td>
                    <span class="badge" [ngClass]="getStatusBadgeClass(ad.status)">
                      {{ getStatusText(ad.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" (click)="editAd(ad.id)" title="Modifier">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="confirmDelete(ad)" title="Supprimer">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <nav *ngIf="totalPages > 1" class="mt-3">
            <ul class="pagination justify-content-center">
              <li class="page-item" [class.disabled]="currentPage === 1">
                <a class="page-link" (click)="loadPage(currentPage - 1)">Précédent</a>
              </li>
              <li class="page-item" *ngFor="let page of [].constructor(totalPages); let i = index">
                <a class="page-link" (click)="loadPage(i + 1)" [class.active]="currentPage === i + 1">{{ i + 1 }}</a>
              </li>
              <li class="page-item" [class.disabled]="currentPage === totalPages">
                <a class="page-link" (click)="loadPage(currentPage + 1)">Suivant</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="adToDelete" class="modal d-block" style="background-color: rgba(0,0,0,0.5);">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirmer la suppression</h5>
              <button type="button" class="btn-close" (click)="adToDelete = null"></button>
            </div>
            <div class="modal-body">
              <p>Êtes-vous sûr de vouloir supprimer l'annonce "{{ adToDelete.title }}" ?</p>
              <p class="text-muted">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="adToDelete = null">Annuler</button>
              <button type="button" class="btn btn-danger" (click)="deleteAd()">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 20px;
    }
    .profile-header {
      margin-bottom: 20px;
    }
    .badge.bg-success {
      background-color: #28a745 !important;
    }
    .badge.bg-warning {
      background-color: #ffc107 !important;
      color: #000 !important;
    }
    .badge.bg-secondary {
      background-color: #6c757d !important;
    }
    .badge.bg-danger {
      background-color: #dc3545 !important;
    }
  `]
})
export class Profile implements OnInit {
  user: any;
  myAds: Ad[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  adToDelete: Ad | null = null;
  requestingSeller = false;
  changingPassword = false;
  passwordError = '';
  passwordSuccess = '';
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    public authService: AuthService,
    private adsService: AdsService,
    private usersService: UsersService,
    private router: Router
  ) { }

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadMyAds();
  }

  loadMyAds(page: number = 1) {
    this.loading = true;
    this.adsService.getMyAds(page, this.limit).subscribe({
      next: (response: AdsResponse) => {
        this.myAds = response.ads;
        this.currentPage = response.pagination.page;
        this.totalPages = response.pagination.pages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des annonces:', error);
        this.loading = false;
      }
    });
  }

  loadPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadMyAds(page);
    }
  }

  editAd(id: number) {
    // Navigate to edit ad page with query parameter (as supported by ad-create component)
    this.router.navigate(['/dashboard/ads/create'], { queryParams: { edit: id } });
  }

  confirmDelete(ad: Ad) {
    this.adToDelete = ad;
  }

  deleteAd() {
    if (!this.adToDelete) return;

    this.adsService.deleteAd(this.adToDelete.id).subscribe({
      next: () => {
        this.adToDelete = null;
        this.loadMyAds(this.currentPage);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.adToDelete = null;
      }
    });
  }

  getRoleBadgeClass(): string {
    switch (this.user?.role) {
      case 'admin': return 'bg-danger';
      case 'moderator': return 'bg-warning text-dark';
      case 'seller': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  getRoleText(): string {
    switch (this.user?.role) {
      case 'admin': return 'Administrateur';
      case 'moderator': return 'Modérateur';
      case 'seller': return 'Vendeur';
      default: return 'Utilisateur';
    }
  }

  requestSellerRole() {
    this.requestingSeller = true;
    this.authService.requestSellerRole().subscribe({
      next: (response) => {
        this.requestingSeller = false;
        // Rafraîchir les données utilisateur
        this.user = this.authService.getCurrentUser();
        alert(response.message || 'Votre demande de vendeur a été soumise. Elle sera examinée par un administrateur.');
      },
      error: (error) => {
        this.requestingSeller = false;
        console.error('Erreur lors de la demande de vendeur:', error);
        alert('Erreur lors de la demande de vendeur. Veuillez réessayer.');
      }
    });
  }

  changePassword() {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'La confirmation du mot de passe ne correspond pas';
      return;
    }

    this.changingPassword = true;

    this.usersService.changePassword(this.passwordData).subscribe({
      next: (response) => {
        this.changingPassword = false;
        this.passwordSuccess = response.message;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
      },
      error: (error) => {
        this.changingPassword = false;
        this.passwordError = error?.error?.error || 'Erreur lors du changement de mot de passe';
        console.error('Erreur lors du changement de mot de passe:', error);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_verification': return 'bg-warning text-dark';
      case 'expired': return 'bg-secondary';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
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
}

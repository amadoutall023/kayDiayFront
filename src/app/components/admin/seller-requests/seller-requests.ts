import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../services/users';

interface SellerRequest {
  id: number;
  userId: number;
  status: string;
  reason: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  };
}

@Component({
  selector: 'app-seller-requests',
  imports: [CommonModule],
  templateUrl: './seller-requests.html',
  styleUrl: './seller-requests.css'
})
export class SellerRequests implements OnInit {
  requests: SellerRequest[] = [];
  loading = false;
  error = '';

  constructor(
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.error = '';

    this.usersService.getSellerRequests().subscribe({
      next: (response: any) => {
        this.requests = response.requests;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des demandes';
        console.error('Erreur:', err);
      }
    });
  }

  approveRequest(requestId: number) {
    if (confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) {
      this.usersService.approveSellerRequest(requestId).subscribe({
        next: () => {
          this.loadRequests(); // Recharger la liste
        },
        error: (err: any) => {
          this.error = 'Erreur lors de l\'approbation';
          console.error('Erreur:', err);
        }
      });
    }
  }

  rejectRequest(requestId: number) {
    const reason = prompt('Raison du rejet (optionnel):');
    this.usersService.rejectSellerRequest(requestId, reason || undefined).subscribe({
      next: () => {
        this.loadRequests(); // Recharger la liste
      },
      error: (err: any) => {
        this.error = 'Erreur lors du rejet';
        console.error('Erreur:', err);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge bg-warning';
      case 'approved': return 'badge bg-success';
      case 'rejected': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return status;
    }
  }
}
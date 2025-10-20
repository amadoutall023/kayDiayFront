import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../services/users';

interface Seller {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ads: number;
  };
}

@Component({
  selector: 'app-sellers',
  imports: [CommonModule, FormsModule],
  templateUrl: './sellers.html',
  styleUrl: './sellers.css'
})
export class Sellers implements OnInit {
  sellers: Seller[] = [];
  filteredSellers: Seller[] = [];
  loading = false;
  error = '';
  searchQuery = '';

  constructor(
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.loadSellers();
  }

  onSearchChange() {
    this.filterSellers();
  }

  clearSearch() {
    this.searchQuery = '';
    this.filterSellers();
  }

  private filterSellers() {
    if (!this.searchQuery.trim()) {
      this.filteredSellers = this.sellers;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredSellers = this.sellers.filter(seller =>
        seller.name.toLowerCase().includes(query) ||
        seller.email.toLowerCase().includes(query)
      );
    }
  }

  loadSellers() {
    this.loading = true;
    this.error = '';

    this.usersService.getSellers().subscribe({
      next: (response: any) => {
        this.sellers = response.sellers;
        this.filteredSellers = response.sellers;
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des vendeurs';
        console.error('Erreur:', err);
      }
    });
  }

  suspendSeller(sellerId: number) {
    if (confirm('Êtes-vous sûr de vouloir suspendre ce vendeur ?')) {
      this.usersService.suspendSeller(sellerId).subscribe({
        next: () => {
          this.loadSellers(); // Recharger la liste
        },
        error: (err: any) => {
          this.error = 'Erreur lors de la suspension';
          console.error('Erreur:', err);
        }
      });
    }
  }

  activateSeller(sellerId: number) {
    if (confirm('Êtes-vous sûr de vouloir réactiver ce vendeur ?')) {
      this.usersService.activateSeller(sellerId).subscribe({
        next: () => {
          this.loadSellers(); // Recharger la liste
        },
        error: (err: any) => {
          this.error = 'Erreur lors de la réactivation';
          console.error('Erreur:', err);
        }
      });
    }
  }

  deleteSeller(sellerId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement ce vendeur ? Cette action est irréversible.')) {
      this.usersService.deleteSeller(sellerId).subscribe({
        next: () => {
          this.loadSellers(); // Recharger la liste
        },
        error: (err: any) => {
          this.error = 'Erreur lors de la suppression';
          console.error('Erreur:', err);
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge bg-success';
      case 'pending_verification': return 'badge bg-warning';
      case 'suspended': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'pending_verification': return 'En attente';
      case 'suspended': return 'Suspendu';
      default: return status;
    }
  }

  getRoleText(role: string): string {
    switch (role) {
      case 'seller': return 'Vendeur';
      case 'admin': return 'Admin';
      case 'moderator': return 'Modérateur';
      default: return 'Utilisateur';
    }
  }
}
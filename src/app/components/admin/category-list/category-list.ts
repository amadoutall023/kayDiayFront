import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdsService } from '../../../services/ads';
import { Category } from '../../../models/ad';

@Component({
  selector: 'app-category-list',
  imports: [CommonModule, RouterLink],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css'
})
export class CategoryList implements OnInit {
  categories: Category[] = [];
  loading = false;
  error = '';

  constructor(private adsService: AdsService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.error = '';

    this.adsService.getCategories().subscribe({
      next: (response) => {
        this.loading = false;
        this.categories = response.categories;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Erreur lors du chargement des catégories';
      }
    });
  }

  onRefresh() {
    this.loadCategories();
  }

  editCategory(category: Category) {
    // TODO: Implement edit functionality
    alert('Fonctionnalité de modification à implémenter');
  }

  deleteCategory(categoryId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      this.adsService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.loadCategories(); // Recharger la liste
        },
        error: (err: any) => {
          this.error = err.error?.error || 'Erreur lors de la suppression';
          console.error('Erreur:', err);
        }
      });
    }
  }
}

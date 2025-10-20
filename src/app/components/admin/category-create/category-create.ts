import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdsService } from '../../../services/ads';

@Component({
  selector: 'app-category-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-create.html',
  styleUrl: './category-create.css'
})
export class CategoryCreate {
  categoryForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private adsService: AdsService,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      this.adsService.createCategory(this.categoryForm.value.name).subscribe({
        next: (response) => {
          this.loading = false;
          this.success = 'Catégorie créée avec succès !';
          this.categoryForm.reset();
          setTimeout(() => {
            this.router.navigate(['/dashboard/categories']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error || 'Erreur lors de la création de la catégorie';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.categoryForm.controls).forEach(key => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  get name() { return this.categoryForm.get('name'); }
}

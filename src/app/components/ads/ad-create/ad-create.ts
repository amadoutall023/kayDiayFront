import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdsService } from '../../../services/ads';
import { Category, Ad } from '../../../models/ad';

@Component({
  selector: 'app-ad-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ad-create.html',
  styleUrl: './ad-create.css'
})
export class AdCreate implements OnInit {
  adForm: FormGroup;
  categories: Category[] = [];
  loading = false;
  error = '';
  success = '';

  // Camera capture
  capturedImages: string[] = [];
  isCapturing = false;
  maxImages = 4;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;

  // Edit mode
  isEditMode = false;
  editingAd: Ad | null = null;

  constructor(
    private fb: FormBuilder,
    private adsService: AdsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.adForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: ['', [Validators.required, Validators.min(0)]],
      phone: ['', [Validators.minLength(7)]],
      address: ['', [Validators.minLength(5)]],
      categoryId: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.checkEditMode();
  }

  checkEditMode() {
    const editId = this.route.snapshot.queryParams['edit'];
    if (editId) {
      this.isEditMode = true;
      this.loadAdForEdit(editId);
    }
  }

  loadAdForEdit(adId: string) {
    // For now, get all ads and find the specific one
    // In a real app, you'd have a getAdById method
    this.adsService.getAds(1, 100).subscribe({
      next: (response) => {
        const ad = response.ads.find(a => a.id === parseInt(adId));
        if (ad) {
          this.editingAd = ad;
          this.populateForm(ad);
        } else {
          this.error = 'Annonce non trouvée';
        }
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de l\'annonce';
        console.error('Erreur:', err);
      }
    });
  }

  populateForm(ad: Ad) {
    this.adForm.patchValue({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      phone: ad.phone || '',
      address: ad.address || '',
      categoryId: ad.categoryId
    });

    // Load existing images
    if (ad.images && ad.images.length > 0) {
      this.capturedImages = [...ad.images];
    }
  }

  loadCategories() {
    this.adsService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
        this.error = 'Erreur lors du chargement des catégories';
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve('');
        return;
      }

      this.uploadingImage = true;
      const formData = new FormData();
      formData.append('photo', this.selectedFile);

      this.adsService.uploadPhoto(formData).subscribe({
        next: (response) => {
          this.uploadingImage = false;
          resolve(response.url);
        },
        error: (err) => {
          this.uploadingImage = false;
          reject(err);
        }
      });
    });
  }

  async startCamera() {
    try {
      this.isCapturing = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      this.isCapturing = false;
    }
  }

  captureImage() {
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (videoElement && context) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0);

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      this.capturedImages.push(imageDataUrl);

      if (this.capturedImages.length >= this.maxImages) {
        this.stopCamera();
      }
    }
  }

  stopCamera() {
    this.isCapturing = false;
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
  }

  removeCapturedImage(index: number) {
    this.capturedImages.splice(index, 1);
  }

  async onSubmit() {
    if (this.adForm.valid && this.capturedImages.length > 0) {
      this.loading = true;
      this.error = '';
      this.success = '';

      try {
        // Upload all captured images to Cloudinary (only new ones)
        const uploadedImageUrls: string[] = [];

        for (const imageDataUrl of this.capturedImages) {
          // Check if it's already a URL (existing image) or base64 (new image)
          if (imageDataUrl.startsWith('http')) {
            // Existing image URL, keep it
            uploadedImageUrls.push(imageDataUrl);
          } else {
            // New image, upload it
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('photo', file);

            const uploadResult = await this.adsService.uploadPhoto(formData).toPromise();
            if (uploadResult && uploadResult.url) {
              uploadedImageUrls.push(uploadResult.url);
            }
          }
        }

        // Prepare ad data
        const adData = {
          ...this.adForm.value,
          images: uploadedImageUrls
        };

        if (this.isEditMode && this.editingAd) {
          // Update existing ad
          this.adsService.updateAd(this.editingAd.id, adData).subscribe({
            next: (response) => {
              this.loading = false;
              this.success = 'Annonce modifiée avec succès !';
              this.adForm.reset();
              this.capturedImages = [];

              // Redirect after 2 seconds
              setTimeout(() => {
                this.router.navigate(['/dashboard/ads']);
              }, 2000);
            },
            error: (err) => {
              this.loading = false;
              this.error = err.error?.error || 'Erreur lors de la modification de l\'annonce';
            }
          });
        } else {
          // Create new ad
          this.adsService.createAd(adData).subscribe({
            next: (response) => {
              this.loading = false;
              this.success = 'Annonce créée avec succès ! Elle sera visible après validation par un administrateur.';
              this.adForm.reset();
              this.capturedImages = [];

              // Redirect after 2 seconds
              setTimeout(() => {
                this.router.navigate(['/dashboard/ads']);
              }, 2000);
            },
            error: (err) => {
              this.loading = false;
              this.error = err.error?.error || 'Erreur lors de la création de l\'annonce';
            }
          });
        }
      } catch (error) {
        this.loading = false;
        this.error = 'Erreur lors de l\'upload des images';
      }
    } else {
      if (this.capturedImages.length === 0) {
        this.error = 'Veuillez prendre au moins une photo';
      }
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.adForm.controls).forEach(key => {
      const control = this.adForm.get(key);
      control?.markAsTouched();
    });
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  get title() { return this.adForm.get('title'); }
  get description() { return this.adForm.get('description'); }
  get price() { return this.adForm.get('price'); }
  get phone() { return this.adForm.get('phone'); }
  get address() { return this.adForm.get('address'); }
  get categoryId() { return this.adForm.get('categoryId'); }

  cancel() {
    if (this.isEditMode) {
      // If editing, go back to ad list
      this.router.navigate(['/dashboard/ads']);
    } else {
      // If creating, go back to dashboard
      this.router.navigate(['/dashboard']);
    }
  }
}

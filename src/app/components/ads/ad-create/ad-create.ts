import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdsService } from '../../../services/ads';
import { Category, Ad } from '../../../models/ad';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ad-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ad-create.html',
  styleUrl: './ad-create.css'
})
export class AdCreate implements OnInit, OnDestroy {
  adForm: FormGroup;
  categories: Category[] = [];
  loading = false;
  error = '';
  success = '';

  // Camera capture
  capturedImages: string[] = [];
  isCapturing = false;
  maxImages = 4;
  uploadingImage = false;
  photoError = '';
  private cameraStream: MediaStream | null = null;

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

  ngOnDestroy() {
    this.stopCamera();
  }

  checkEditMode() {
    const editId = this.route.snapshot.queryParams['edit'];
    if (editId) {
      this.isEditMode = true;
      this.loadAdForEdit(editId);
    }
  }

  loadAdForEdit(adId: string) {
    this.adsService.getAdById(parseInt(adId)).subscribe({
      next: (response) => {
        this.editingAd = response.ad;
        this.populateForm(response.ad);
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

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length || this.loading || this.uploadingImage || this.isCapturing) return;

    this.photoError = '';
    this.uploadingImage = true;
    const messages: string[] = [];

    try {
      for (const file of files) {
        if (this.capturedImages.length >= this.maxImages) {
          messages.push(`Vous pouvez ajouter au maximum ${this.maxImages} photos.`);
          break;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          messages.push(`${file.name} : choisissez une image JPG, PNG ou WebP.`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          messages.push(`${file.name} : la taille maximale est de 10 Mo.`);
          continue;
        }
        try {
          this.capturedImages.push(await this.preparePhoto(file));
        } catch {
          messages.push(`${file.name} : impossible de lire cette photo. Essayez une autre image.`);
        }
      }
    } finally {
      this.photoError = messages.join(' ');
      this.uploadingImage = false;
    }
  }

  private preparePhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image illisible'));
      };
      image.onload = () => {
        try {
          const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Préparation de la photo indisponible');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const result = canvas.toDataURL('image/jpeg', 0.85);
          if (!result.startsWith('data:image/jpeg;base64,') || result.length * 0.75 > 3 * 1024 * 1024) {
            throw new Error('Photo trop volumineuse');
          }
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      image.src = objectUrl;
    });
  }

  async startCamera() {
    if (this.loading || this.uploadingImage || this.isCapturing || this.capturedImages.length >= this.maxImages) return;
    try {
      this.isCapturing = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      if (!this.isCapturing) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      this.cameraStream = stream;

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
    if (this.loading || this.uploadingImage || this.capturedImages.length >= this.maxImages) return;
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (videoElement && context && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
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
    this.cameraStream?.getTracks().forEach(track => track.stop());
    this.cameraStream = null;
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
    }
  }

  removeCapturedImage(index: number) {
    if (this.loading || this.uploadingImage) return;
    this.capturedImages.splice(index, 1);
    this.photoError = '';
  }

  async onSubmit() {
    if (this.loading || this.uploadingImage) return;
    if (this.adForm.valid && this.capturedImages.length > 0) {
      this.stopCamera();
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

            const uploadResult = await firstValueFrom(this.adsService.uploadPhoto(formData));
            if (!uploadResult.url) throw new Error('Photo non transférée');
            uploadedImageUrls.push(uploadResult.url);
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
              this.success = this.publicationMessage(response.ad);
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
              this.success = this.publicationMessage(response.ad);
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
        this.error = 'Veuillez ajouter ou prendre au moins une photo';
      }
      this.markFormGroupTouched();
    }
  }

  private publicationMessage(ad: Ad): string {
    if (ad.status === 'active') return 'Votre annonce est approuvée et publiée !';
    if (ad.status === 'rejected') return `Annonce refusée : ${ad.verificationReason || 'contenu non autorisé'}`;
    return 'Annonce enregistrée. Elle sera visible après vérification par un modérateur.';
  }

  private markFormGroupTouched() {
    Object.keys(this.adForm.controls).forEach(key => {
      const control = this.adForm.get(key);
      control?.markAsTouched();
    });
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

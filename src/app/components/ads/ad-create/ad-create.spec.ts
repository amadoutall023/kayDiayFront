import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdCreate } from './ad-create';
import { AdsService } from '../../../services/ads';

describe('AdCreate photo selection', () => {
  let component: AdCreate;
  let fixture: ComponentFixture<AdCreate>;
  let ads: jasmine.SpyObj<AdsService>;

  beforeEach(async () => {
    ads = jasmine.createSpyObj('AdsService', ['getCategories', 'uploadPhoto', 'createAd']);
    ads.getCategories.and.returnValue(of({ categories: [] }));
    ads.uploadPhoto.and.returnValue(of({ url: 'https://example.com/new.jpg', publicId: 'new' }));
    ads.createAd.and.returnValue(of({ ad: { status: 'pending_verification' } as any }));
    await TestBed.configureTestingModule({
      imports: [AdCreate],
      providers: [
        { provide: AdsService, useValue: ads },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function select(files: File[]): HTMLInputElement {
    const input = fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement;
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    return input;
  }

  async function photo(name = 'photo.png', width = 32, height = 16): Promise<File> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#126341';
    context.fillRect(0, 0, width, height);
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'));
    return new File([blob], name, { type: 'image/png' });
  }

  it('opens a multiple-file picker without requesting the camera', () => {
    const input = select([]);
    spyOn(input, 'click');
    spyOn(component, 'startCamera');
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(button => button.textContent?.includes('Ajouter des photos'))!;
    button.click();
    expect(input.click).toHaveBeenCalled();
    expect(input.multiple).toBeTrue();
    expect(input.hasAttribute('capture')).toBeFalse();
    expect(component.startCamera).not.toHaveBeenCalled();
  });

  it('previews multiple files and resizes large images to JPEG before submission', async () => {
    const input = select([await photo('large.png', 2400, 1200), await photo('small.png')]);
    await component.onFileSelected({ target: input } as unknown as Event);
    expect(component.capturedImages.length).toBe(2);
    expect(component.capturedImages.every(url => url.startsWith('data:image/jpeg;base64,'))).toBeTrue();
    const image = new Image();
    image.src = component.capturedImages[0];
    await image.decode();
    expect(image.naturalWidth).toBe(1920);
    expect(image.naturalHeight).toBe(960);
    expect(input.value).toBe('');
    expect(component.uploadingImage).toBeFalse();
    expect(ads.uploadPhoto).not.toHaveBeenCalled();
  });

  it('counts existing and camera photos toward the same four-photo limit', async () => {
    component.capturedImages = ['https://example.com/existing.jpg', 'data:image/jpeg;base64,camera'];
    const input = select([await photo('one.png'), await photo('two.png'), await photo('extra.png')]);
    await component.onFileSelected({ target: input } as unknown as Event);
    expect(component.capturedImages.length).toBe(4);
    expect(component.capturedImages[0]).toBe('https://example.com/existing.jpg');
    expect(component.photoError).toContain('maximum 4');
    fixture.detectChanges();
    expect(input.disabled).toBeTrue();
    component.removeCapturedImage(2);
    fixture.detectChanges();
    expect(input.disabled).toBeFalse();
    await component.onFileSelected({ target: select([await photo('replacement.png')]) } as unknown as Event);
    expect(component.capturedImages.length).toBe(4);
  });

  it('rejects unsupported, oversized and unreadable files while keeping valid photos', async () => {
    const input = select([
      new File(['text'], 'document.txt', { type: 'text/plain' }),
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }),
      new File(['broken image'], 'broken.jpg', { type: 'image/jpeg' }),
      await photo('valid.png')
    ]);
    await component.onFileSelected({ target: input } as unknown as Event);
    expect(component.capturedImages.length).toBe(1);
    expect(component.photoError).toContain('JPG, PNG ou WebP');
    expect(component.photoError).toContain('10 Mo');
    expect(component.photoError).toContain('impossible de lire');
    expect(component.uploadingImage).toBeFalse();
  });

  it('keeps photos when the picker is cancelled', async () => {
    component.capturedImages = ['https://example.com/existing.jpg'];
    await component.onFileSelected({ target: select([]) } as unknown as Event);
    expect(component.capturedImages).toEqual(['https://example.com/existing.jpg']);
  });

  it('blocks publication while photos are being prepared', async () => {
    component.uploadingImage = true;
    component.capturedImages = ['https://example.com/existing.jpg'];
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBeTrue();
    await component.onSubmit();
    expect(ads.createAd).not.toHaveBeenCalled();
  });

  it('uploads new photos and preserves existing URLs when publishing', async () => {
    jasmine.clock().install();
    try {
      component.capturedImages = ['https://example.com/existing.jpg'];
      await component.onFileSelected({ target: select([await photo()]) } as unknown as Event);
      component.adForm.setValue({
        title: 'Vélo à vendre', description: 'Vélo en très bon état', price: 50000,
        phone: '771234567', address: 'Dakar', categoryId: 1
      });
      await component.onSubmit();
      expect(ads.uploadPhoto).toHaveBeenCalledTimes(1);
      const uploaded = ads.uploadPhoto.calls.mostRecent().args[0].get('photo') as File;
      expect(uploaded.type).toBe('image/jpeg');
      expect(uploaded.size).toBeGreaterThan(0);
      expect(ads.createAd.calls.mostRecent().args[0].images).toEqual([
        'https://example.com/existing.jpg', 'https://example.com/new.jpg'
      ]);
      jasmine.clock().tick(2000);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});

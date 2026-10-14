import { Component, HostListener } from '@angular/core';

type InstallPrompt = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

@Component({
  selector: 'app-pwa-install',
  template: `
    @if (!installed && !dismissed && (mobile || deferredPrompt)) {
      <aside class="install-banner" aria-label="Installer KayDiay">
        <img src="/icons/icon-192.png" width="40" height="40" alt="" />
        <div class="install-copy">
          <strong>KayDiay sur votre téléphone</strong>
          <p>Retrouvez l’application sur votre écran d’accueil.</p>
          @if (showHelp) {
            <p id="install-help" role="status">
              @if (ios) {
                Dans Safari, ouvrez Partager, puis « Sur l’écran d’accueil » et confirmez avec « Ajouter ».
              } @else {
                Dans Chrome, ouvrez le menu ⋮, puis « Installer l’application » ou « Ajouter à l’écran d’accueil », si cette option est disponible.
              }
              Si le lien est ouvert dans une autre application, ouvrez-le d’abord dans {{ ios ? 'Safari' : 'Chrome' }}.
            </p>
          }
        </div>
        <button class="install-action" type="button" (click)="install()" [disabled]="installing">
          {{ deferredPrompt ? 'Installer' : 'Comment installer ?' }}
        </button>
        <button class="install-close" type="button" aria-label="Masquer la proposition d’installation" (click)="dismissed = true">×</button>
      </aside>
    }
  `,
  styles: `
    :host { display: block; }
    .install-banner { display: flex; align-items: center; gap: .75rem; padding: 1rem; background: #fff; color: var(--primary-green); border-bottom: 1px solid var(--line); }
    img { border-radius: 10px; flex-shrink: 0; }
    .install-copy { flex: 1; min-width: 0; }
    p { margin: .25rem 0 0; font-size: .875rem; }
    #install-help { margin-top: .75rem; line-height: 1.5; }
    button { min-height: 44px; border: 0; cursor: pointer; }
    button:focus-visible { outline: 3px solid var(--orange); outline-offset: 3px; }
    .install-action { padding: .6rem .9rem; border-radius: 8px; background: var(--primary-green); color: white; font-weight: 600; }
    .install-action:disabled { opacity: .6; cursor: wait; }
    .install-close { min-width: 44px; background: transparent; color: var(--primary-green); font-size: 1.5rem; }
    @media (max-width: 480px) {
      .install-banner { display: grid; grid-template-columns: 40px 1fr 44px; }
      .install-copy { grid-column: 2; }
      .install-action { grid-column: 2; grid-row: 2; justify-self: start; }
      .install-close { grid-column: 3; grid-row: 1; align-self: start; }
    }
  `
})
export class PwaInstall {
  readonly ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  readonly mobile = this.ios || /Android/.test(navigator.userAgent);
  installed = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  dismissed = false;
  showHelp = false;
  installing = false;
  deferredPrompt: InstallPrompt | null = null;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onInstallPrompt(event: Event) {
    event.preventDefault();
    this.deferredPrompt = event as InstallPrompt;
    this.showHelp = false;
  }

  @HostListener('window:appinstalled')
  onInstalled() {
    this.installed = true;
    this.deferredPrompt = null;
  }

  async install() {
    if (this.installing) return;
    const prompt = this.deferredPrompt;
    if (!prompt) {
      this.showHelp = true;
      return;
    }
    this.installing = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') this.dismissed = true;
    } catch {
      this.showHelp = true;
    } finally {
      this.deferredPrompt = null;
      this.installing = false;
    }
  }
}

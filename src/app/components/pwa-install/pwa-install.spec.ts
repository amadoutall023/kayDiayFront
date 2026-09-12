import { PwaInstall } from './pwa-install';

describe('PwaInstall', () => {
  it('shows manual instructions when no browser prompt is available', async () => {
    const component = new PwaInstall();
    await component.install();
    expect(component.showHelp).toBeTrue();
  });

  it('only prompts after a click and consumes a dismissed prompt', async () => {
    const component = new PwaInstall();
    const prompt = jasmine.createSpy('prompt').and.resolveTo();
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'dismissed' as const })
    });
    component.onInstallPrompt(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(prompt).not.toHaveBeenCalled();
    await component.install();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(component.deferredPrompt).toBeNull();
    expect(component.installed).toBeFalse();
    await component.install();
    expect(component.showHelp).toBeTrue();
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('offers help if the browser rejects the prompt', async () => {
    const component = new PwaInstall();
    component.onInstallPrompt(Object.assign(new Event('beforeinstallprompt'), {
      prompt: () => Promise.reject(new Error('Unavailable')),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const })
    }));
    await component.install();
    expect(component.installing).toBeFalse();
    expect(component.showHelp).toBeTrue();
    expect(component.deferredPrompt).toBeNull();
  });

  it('hides the banner after installation', () => {
    const component = new PwaInstall();
    component.onInstalled();
    expect(component.installed).toBeTrue();
    expect(component.deferredPrompt).toBeNull();
  });
});

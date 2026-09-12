# PWA KayDiay

Compiler avec `npm ci` puis `npm run build`. Publier `dist/frontend/browser` sur l’hébergement du frontend en HTTPS.

Servir les fichiers statiques avant la réécriture des routes Angular vers `index.html`. Vérifier `/manifest.webmanifest`, `/ngsw-worker.js` et `/ngsw.json`. Ne pas appliquer de cache longue durée à `index.html`, `ngsw.json` ou `ngsw-worker.js`.

## Vérification

1. Ouvrir le site dans Chrome et attendre l’enregistrement du service worker (jusqu’à 30 secondes).
2. Dans les outils de développement, section Application, vérifier le manifeste, les icônes et le service worker actif. Recharger.
3. Utiliser « Installer l’application » dans le menu Chrome. Sur iPhone : Safari → Partager → Sur l’écran d’accueil.
4. Après une visite en ligne, passer hors connexion et recharger : l’interface doit se charger. Les annonces et les actions du compte nécessitent Internet. Les réponses API ne sont pas mises en cache par le service worker.
5. Après un déploiement, ouvrir le site en ligne pour télécharger la mise à jour, puis fermer tous ses onglets et fenêtres et le rouvrir.

`npm start` n’active pas le service worker. Pour tester localement, compiler en production puis exécuter `python3 -m http.server 8080 --directory dist/frontend/browser` et ouvrir `http://localhost:8080/`. Ce serveur simple ne gère pas les réécritures pour les liens profonds.

Bootstrap est inclus dans la compilation afin que le menu fonctionne aussi lorsque l’interface est chargée hors connexion.

Référence : https://angular.dev/ecosystem/service-workers/getting-started

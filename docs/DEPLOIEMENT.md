# Déploiement de KayDiay sur Ubuntu depuis un Mac

Documentation de la session du **21 octobre 2026**, fuseau Africa/Dakar.

Ce document reprend les commandes utilisées, leur contexte, les erreurs rencontrées et les étapes de mise à jour. Les commandes répétées à l'identique pendant les essais sont regroupées dans leur étape.

**C'est un historique commenté et un guide de maintenance. Ne pas exécuter tout le document sur le serveur déjà déployé : les premières étapes correspondent à son ancienne configuration HTTP.**

## 1. Résultat et architecture

| Élément | Valeur |
| --- | --- |
| Site public actuel | https://145.223.33.207:8085 |
| Serveur | 145.223.33.207 |
| Système | Ubuntu 24.04.4 LTS |
| Compte SSH utilisé | root |
| Dossier de l'application | /opt/kaydiay |
| Frontend | Angular 20, fichiers servis par Nginx |
| Fichiers frontend compilés | /opt/kaydiay/frontend/dist/frontend/browser |
| Backend | Node.js / Express / Prisma, dans Docker |
| Conteneur | kaydiay-backend |
| Image initialement déployée | kaydiay-backend:20261021 |
| Port backend sur le serveur | 127.0.0.1:3010 |
| Port public du site | 8085, désormais en HTTPS |
| Base de données | PostgreSQL hébergée sur Neon |
| Images | Cloudinary, selon les clés du fichier .env |
| Configuration Nginx KayDiay | /etc/nginx/sites-available/kaydiay |
| Lien Nginx actif | /etc/nginx/sites-enabled/kaydiay |
| Secrets du backend | /opt/kaydiay/backend/.env |
| Certificat | /etc/letsencrypt/live/kaydiay-ip/fullchain.pem |
| Clé privée TLS | /etc/letsencrypt/live/kaydiay-ip/privkey.pem |

Le navigateur communique avec Nginx sur le port 8085. Nginx sert Angular et transmet les chemins /api/ au backend. Le backend communique avec Neon et les services externes.

Le port 3010 est publié uniquement sur l'adresse locale du serveur. Il n'est pas ouvert directement sur Internet.

## 2. Les deux onglets du Terminal

Ouvrir Terminal sur le Mac avec **⌘ + Espace**, rechercher « Terminal », puis Entrée.

Utiliser **⌘ + T** pour ouvrir le deuxième onglet.

| Onglet | Où les commandes s'exécutent | Invite typique |
| --- | --- | --- |
| A — Serveur | Sur Ubuntu, après connexion SSH | root@srv799434:~# |
| B — Mac | Sur le Mac, pour transférer les fichiers | mac@MacBook-Pro-4 ~ % |

Les noms A et B servent de repères. Vérifier l'invite avant chaque commande : le numéro réel de l'onglet n'a pas d'importance.

Ne pas copier l'invite elle-même, uniquement les commandes.

**Ne jamais envoyer de mot de passe, de clé privée ou de contenu du fichier .env dans une conversation ou une capture.**

## 3. Connexion SSH

### Onglet A — Depuis le Mac

~~~bash
ssh root@145.223.33.207
~~~

Lors de la première connexion, le message reçu était :

~~~text
The authenticity of host '145.223.33.207' can't be established.
ED25519 key fingerprint is SHA256:/dT5oewkZLXaCumEIguqbbuCpBkqHX3w/vNnJcBOZxo.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
~~~

Comparer l'empreinte avec une source de confiance de l'hébergeur avant de confirmer. La réponse saisie pendant la session était :

~~~text
yes
~~~

Saisir ensuite le mot de passe SSH. Aucun caractère ne s'affiche pendant la saisie.

Des tentatives ont d'abord échoué avec :

~~~text
Permission denied, please try again.
Connection closed by 145.223.33.207 port 22
~~~

La même commande SSH a été relancée, puis la connexion a réussi :

~~~text
Welcome to Ubuntu 24.04.4 LTS
root@srv799434:~#
~~~

Si la connexion échoue, vérifier le compte et le mot de passe du serveur dans l'espace hébergeur. Le mot de passe du compte hébergeur peut être différent.

## 4. État initial du serveur

### Onglet A — Serveur

~~~bash
node --version
npm --version
nginx -v
docker --version
df -h /
free -h
ss -lntp
~~~

Versions et ressources observées :

- Node.js : v22.22.3.
- npm : 10.9.8.
- Nginx : 1.24.0.
- Docker : 29.1.3.
- Disque : environ 31 Go disponibles.
- Mémoire : environ 3,8 Gio au total.

Identification des applications existantes :

~~~bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
ls -l /etc/nginx/sites-enabled/
ls /opt /var/www
~~~

Applications présentes avant KayDiay :

| Application ou service | Port observé |
| --- | --- |
| in-odc-backend | 3000 |
| react_ets | 3002 |
| spring-boot_ets | 8082 |
| postgres_ets | 5434 |
| Application Node de soutenance | 3006 |
| Application Next.js | 3001 |
| Nginx | 80 et 443 |
| SSH | 22 |

Fichiers Nginx déjà actifs : default, ethioyeservice.com et in-odc-frontend.

Les ports 3010 et 8085 ont été choisis pour KayDiay après vérification de leur disponibilité.

## 5. Préparation locale du projet

### Modification effectuée sur le Mac

Le frontend appelait auparavant le backend Render. Le fichier **frontend/src/app/api.config.ts** a été adapté :

~~~typescript
const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalEnvironment = hostname === 'localhost' || hostname === '127.0.0.1';

export const API_BASE_URL = isLocalEnvironment
  ? 'http://localhost:3000/api'
  : '/api';
~~~

En production, les appels /api sont ainsi envoyés au même serveur que le frontend, via Nginx.

### Sur le Mac — Préparation de l'archive

Ces commandes ont été exécutées par l'assistant sur le Mac pendant la session, depuis le dossier du projet :

~~~bash
cd /Users/mac/Downloads/fotoljaayback--main

tar -czf /tmp/fotoljaay-deploy-20261021.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.angular \
  --exclude=.git \
  --exclude=.env \
  --exclude='.env.local' \
  --exclude='*.log' \
  backend frontend

shasum -a 256 /tmp/fotoljaay-deploy-20261021.tar.gz
~~~

Le fichier .env est exclu pour transférer les secrets séparément.

Empreinte de l'archive précise utilisée pendant cette session :

~~~text
d4b1795496e250ef282e1a3dd032724d3bccc9a7bb660158c953e3728e68b172
~~~

Une archive recréée plus tard peut avoir une empreinte différente. Il faut toujours comparer l'empreinte locale de l'archive transférée avec celle du serveur.

Le dossier /tmp est temporaire : l'archive peut disparaître après un nettoyage ou un redémarrage.

## 6. Transfert de l'archive : onglet B vers onglet A

### Onglet B — Mac

~~~bash
scp /tmp/fotoljaay-deploy-20261021.tar.gz root@145.223.33.207:/root/
~~~

Entrer le mot de passe SSH et attendre **100 % puis le retour de l'invite du Mac**.

Le répertoire /root sert ici de zone de réception temporaire. L'application sera installée dans /opt/kaydiay.

### Onglet A — Serveur

~~~bash
ls -lh /root/fotoljaay-deploy-20261021.tar.gz
ss -lntp '( sport = :8085 or sport = :3010 )'
sha256sum /root/fotoljaay-deploy-20261021.tar.gz
~~~

La vérification des ports n'affichait aucune ligne d'écoute pour 3010 et 8085.

### Incident de transfert rencontré

Le premier transfert a affiché « stalled ». Une première empreinte obtenue sur le serveur était :

~~~text
f088a6d29396ce9cf96e764df121a9a4a23a4f8c25b2f327c79be9a410e68de6
~~~

Elle ne correspondait pas à l'archive locale. Le transfert a été relancé avec la même commande scp dans l'onglet B, puis sha256sum a été relancé dans l'onglet A.

La dernière empreinte obtenue correspondait bien à d4b179…b172. L'extraction n'a commencé qu'après cette vérification.

Si un transfert est encore actif, **Ctrl + C** permet de l'arrêter. Ne pas lancer plusieurs transferts simultanés vers le même fichier.

Les messages locaux « /opt/homebrew/bin/brew: no such file or directory » et « compdef: command not found » provenaient de la configuration du shell du Mac. Ils n'ont pas empêché le transfert réussi et n'ont pas été corrigés pendant cette session.

## 7. Installation des dossiers

### Onglet A — Serveur

~~~bash
mkdir /opt/kaydiay
~~~

Cette commande était destinée à un dossier inexistant. Si le dossier existe déjà lors d'une nouvelle installation, inspecter son contenu avant de poursuivre.

~~~bash
tar -xzf /root/fotoljaay-deploy-20261021.tar.gz -C /opt/kaydiay
ls -la /opt/kaydiay
~~~

Résultat attendu :

~~~text
backend
frontend
~~~

L'extraction a affiché des avertissements :

~~~text
Ignoring unknown extended header keyword 'LIBARCHIVE.xattr.com.apple.provenance'
~~~

Ils concernaient les métadonnées macOS. Les dossiers ont bien été extraits. Des fichiers auxiliaires ._backend et ._frontend étaient également visibles ; ils ne sont pas utilisés par l'application.

## 8. Transfert du fichier de configuration confidentiel

### Onglet B — Mac

~~~bash
scp /Users/mac/Downloads/fotoljaayback--main/backend/.env root@145.223.33.207:/opt/kaydiay/backend/.env
~~~

Attendre la fin du transfert avant de revenir à l'onglet A.

### Onglet A — Serveur

~~~bash
chmod 600 /opt/kaydiay/backend/.env
cd /opt/kaydiay/backend
npm ci && npx prisma generate && npm run build
~~~

Ces étapes installent les dépendances, génèrent le client Prisma et compilent TypeScript.

**Aucune commande de modification du schéma Neon n'a été exécutée.** La base existante possédait déjà les tables nécessaires.

Le fichier .env contient notamment les connexions Neon, les secrets JWT et les clés des services externes. Ne pas le publier ni le copier dans le frontend.

## 9. Audit et correction des dépendances du backend

### Onglet A — Serveur

Premier audit des dépendances de production :

~~~bash
cd /opt/kaydiay/backend
npm audit --omit=dev
~~~

L'installation initiale signalait 17 vulnérabilités au total. L'audit limité à la production en signalait 10, dont une critique.

Corrections compatibles avec les versions déclarées :

~~~bash
cd /opt/kaydiay/backend
npm audit fix
npm run build
npm audit --omit=dev
~~~

Le rapport restant mentionnait notamment Nodemailer. Une mise à jour ciblée a été réalisée :

~~~bash
cd /opt/kaydiay/backend
npm install nodemailer@10.1.7 --save-exact
npm run build && npm test
npm audit --omit=dev
~~~

Résultats observés :

- Compilation réussie.
- 11 tests réussis, 0 échec.
- Audit de production : 0 vulnérabilité connue signalée au moment du contrôle.

Les messages « Analyse échouée » dans les tests de modération correspondaient à des scénarios d'erreur simulés, et non à des tests échoués.

La commande npm audit fix avec l'option --force a été évoquée par npm, mais **elle n'a pas été utilisée**. Elle peut introduire des changements incompatibles.

**Attention : ces modifications de package.json et package-lock.json ont été faites sur le serveur. Elles ne sont pas automatiquement présentes dans le projet du Mac. Les récupérer avant de remplacer ces fichiers depuis le Mac.**

Les tests exécutés ne valident pas l'envoi réel d'un e-mail. Ce contrôle reste à faire avec la configuration SMTP.

## 10. Compilation du frontend

### Onglet A — Serveur

~~~bash
cd /opt/kaydiay/frontend
npm ci && npm run build
~~~

Résultat :

~~~text
Application bundle generation complete.
Output location: /opt/kaydiay/frontend/dist/frontend
~~~

Nginx utilise le sous-dossier browser de cette sortie.

Deux avertissements non bloquants ont été observés :

- Bundle initial : environ 961,38 ko, supérieur au seuil d'avertissement de 500 ko.
- home.css : environ 24,30 ko, légèrement supérieur au seuil d'avertissement de 24 ko.

## 11. Configuration initiale HTTP

Cette étape décrit l'état **avant HTTPS**. Ne pas la réexécuter sur le déploiement actuel.

### Onglet A — Serveur

La première commande utilisée était :

~~~bash
cd /opt/kaydiay/backend

sed -i '/^PORT=/d; /^FRONTEND_URL=/d; /^ALLOWED_ORIGINS=/d' .env

cat >> .env <<'EOF'

PORT=3010
FRONTEND_URL=http://145.223.33.207:8085
ALLOWED_ORIGINS=http://145.223.33.207:8085
EOF

chmod 600 .env
~~~

### Correction d'un copier-coller

Les adresses avaient été collées sous forme de liens Markdown avec des crochets et parenthèses. Elles ont été corrigées avec ce script, qui ne contient pas d'URL complète susceptible d'être transformée par l'interface :

~~~bash
cd /opt/kaydiay/backend

python3 - <<'PY'
from pathlib import Path

path = Path(".env")
origin = "http://" + "145.223.33.207:8085"
updates = {
    "PORT": "3010",
    "FRONTEND_URL": origin,
    "ALLOWED_ORIGINS": origin,
}

lines = [
    line for line in path.read_text().splitlines()
    if line.split("=", 1)[0].strip() not in updates
]
lines.extend(f"{key}={value}" for key, value in updates.items())
path.write_text("\n".join(lines) + "\n")
print("Configuration corrigée")
PY
~~~

Toujours copier les commandes depuis les blocs de code. Une URL de configuration doit être une URL simple, sans syntaxe de lien Markdown.

## 12. Vérification de Neon, sans modification des données

### Onglet A — Serveur, dans /opt/kaydiay/backend

~~~bash
node - <<'NODE'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  try {
    await db.user.count();
    await db.category.count();
    await db.ad.count();
    console.log('OK : connexion Neon et tables accessibles');
  } catch (error) {
    console.log('Échec Neon. Code :', error.code || 'non précisé');
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
})();
NODE
~~~

Résultat obtenu :

~~~text
OK : connexion Neon et tables accessibles
~~~

Les requêtes comptent les lignes des tables User, Category et Ad. Elles ne changent pas les données et n'affichent pas les informations des utilisateurs.

## 13. Construction et démarrage du backend Docker

### Onglet A — Serveur

Construction de l'image :

~~~bash
cd /opt/kaydiay/backend
docker build -t kaydiay-backend:20261021 .
~~~

Résultat :

~~~text
Successfully built 7abfbb23e065
Successfully tagged kaydiay-backend:20261021
~~~

Lancement initial, à exécuter une seule fois si ce nom de conteneur n'existe pas :

~~~bash
docker run -d \
  --name kaydiay-backend \
  --restart unless-stopped \
  -p 127.0.0.1:3010:3010 \
  -e PORT=3010 \
  --mount type=bind,src=/opt/kaydiay/backend/.env,dst=/app/.env,readonly \
  kaydiay-backend:20261021
~~~

Le fichier .env est monté en lecture seule dans le conteneur. Le port 3010 du conteneur est publié uniquement sur 127.0.0.1.

L'option --restart unless-stopped permet le redémarrage automatique après un redémarrage du serveur. Si le conteneur a été arrêté volontairement, il reste arrêté jusqu'à son redémarrage explicite.

Vérification :

~~~bash
sleep 5
curl -i http://127.0.0.1:3010/health
~~~

Résultat obtenu :

~~~text
HTTP/1.1 200 OK
{"status":"ok"}
~~~

## 14. Configuration Nginx initiale de KayDiay

**Historique HTTP : ce bloc a ensuite été modifié pour HTTPS. Ne pas le recopier sur le site actuel.**

### Onglet A — Serveur

~~~bash
cat > /etc/nginx/sites-available/kaydiay <<'EOF'
server {
    listen 8085;
    server_name 145.223.33.207;

    root /opt/kaydiay/frontend/dist/frontend/browser;
    index index.html;
    client_max_body_size 15m;

    location /api/ {
        proxy_pass http://127.0.0.1:3010;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health {
        proxy_pass http://127.0.0.1:3010;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/kaydiay /etc/nginx/sites-enabled/kaydiay

nginx -t && systemctl reload nginx
~~~

Le proxy_pass de /api/ n'a pas de barre oblique finale : le chemin /api/ est conservé pour Express.

Le rechargement de Nginx concerne le service partagé. Les autres blocs de configuration restent chargés ; ce n'est pas un arrêt du serveur.

Tests initiaux :

~~~bash
curl -I localhost:8085
curl -i localhost:8085/health
ufw status
~~~

Les deux requêtes répondaient 200 OK. UFW était actif et autorisait seulement les ports 22, 80 et 443.

## 15. Ouverture du port public

### Onglet A — Serveur

~~~bash
ufw allow 8085/tcp
~~~

Le site a ensuite été ouvert dans le navigateur à l'ancienne adresse HTTP :

~~~text
http://145.223.33.207:8085
~~~

La page d'accueil était visible sur Internet. Après l'activation de TLS, cette même adresse doit être utilisée avec **https://**.

## 16. Voir les dossiers graphiquement avec VS Code

Sur le Mac :

1. Dans VS Code, ouvrir les extensions avec **⌘ + ⇧ + X**.
2. Installer **Remote - SSH**, publié par Microsoft.
3. Ouvrir la palette avec **⌘ + ⇧ + P**.
4. Choisir **Remote-SSH: Connect to Host...**.
5. Saisir root@145.223.33.207.
6. Choisir Linux si demandé et saisir le mot de passe SSH.
7. Dans la nouvelle fenêtre distante, utiliser **Ouvrir un dossier / Open Folder**.
8. Choisir /opt/kaydiay.

La mention SSH dans la barre d'état indique que la fenêtre travaille sur le serveur.

**Enregistrer un fichier dans cette fenêtre modifie directement le fichier du serveur.** Modifier les sources ne recompile pas automatiquement le frontend et ne reconstruit pas l'image Docker du backend.

Référence : https://code.visualstudio.com/docs/remote/ssh

## 17. Pourquoi la caméra ne fonctionnait pas

Sur le téléphone, le formulaire affichait « Impossible d'accéder à la caméra. Vérifiez les permissions. »

Le code utilise navigator.mediaDevices.getUserMedia. Cette fonction nécessite un contexte sécurisé, tel qu'une page HTTPS avec un certificat de confiance. L'adresse IP publique en HTTP ne remplissait pas cette condition.

L'activation HTTPS a donc été ajoutée au déploiement. Les permissions du navigateur restent également nécessaires.

Référence : https://developer.mozilla.org/en-US/docs/Web/API/Navigator/mediaDevices

## 18. Préparation du certificat HTTPS pour l'adresse IP

### Onglet A — Serveur

Vérification de Certbot :

~~~bash
certbot --version
~~~

Version observée : **certbot 5.8.0**.

Inspection ciblée de Nginx et du renouvellement :

~~~bash
nginx -T 2>/dev/null | grep -E 'configuration file|listen |server_name |root |proxy_pass |return 30|acme-challenge'

systemctl list-timers --all | grep -i certbot
~~~

La tâche snap.certbot.renew.timer était déjà active.

La configuration montrait que l'adresse IP sur le port 80 redirigeait déjà vers gestionecoleodc.com. Pour examiner le bloc exact :

~~~bash
cat /etc/nginx/sites-available/in-odc-frontend
~~~

Let’s Encrypt permet d'obtenir un certificat pour une adresse IP avec le profil shortlived. Sa durée est d'environ six jours, ce qui rend le renouvellement automatique nécessaire.

Référence : https://letsencrypt.org/2026/03/11/shorter-certs-certbot

## 19. Exception ACME dans la configuration partagée

**Cette étape a bien modifié le fichier in-odc-frontend.** L'objectif était de permettre la validation du certificat de l'IP sur le port 80, tout en conservant la redirection existante pour les autres chemins.

Les routes HTTPS des applications école et soutenance n'ont pas été réécrites par le script.

### Onglet A — Serveur

Le script exécuté :

~~~bash
python3 - <<'PY'
from pathlib import Path
import re

path = Path("/etc/nginx/sites-available/in-odc-frontend")
text = path.read_text()
pattern = r"server\s*\{\s*listen\s+80;\s*server_name\s+145\.223\.33\.207;\s*(return\s+301\s+[^;]+;)\s*\}"
matches = list(re.finditer(pattern, text))

if len(matches) != 1:
    raise SystemExit("Bloc différent de celui attendu : aucune modification.")

backup = path.with_name(path.name + ".before-kaydiay-https")
if backup.exists():
    raise SystemExit("Une sauvegarde existe déjà : aucune modification.")

backup.write_bytes(path.read_bytes())
redirect = matches[0].group(1)
replacement = "\n".join([
    "server {",
    "    listen 80;",
    "    server_name 145.223.33.207;",
    "    location ^~ /.well-known/acme-challenge/ {",
    "        root /var/www/certbot;",
    "        default_type text/plain;",
    "        try_files $uri =404;",
    "    }",
    "    location / {",
    "        " + redirect,
    "    }",
    "}",
])
path.write_text(pattern and re.sub(pattern, lambda _: replacement, text, count=1))
print("Exception ajoutée et sauvegarde créée.")
PY

nginx -t && systemctl reload nginx
~~~

Sauvegarde créée :

~~~text
/etc/nginx/sites-available/in-odc-frontend.before-kaydiay-https
~~~

Ne pas rejouer ce script sur la configuration actuelle : son contrôle initial ne correspond plus au bloc déjà modifié.

### Test du chemin de validation

~~~bash
mkdir -p /var/www/certbot/.well-known/acme-challenge
printf 'kaydiay-ok\n' > /var/www/certbot/.well-known/acme-challenge/kaydiay-check

curl -i -H 'Host: 145.223.33.207' localhost/.well-known/acme-challenge/kaydiay-check
~~~

Ce premier test a répondu 404. localhost pouvait utiliser IPv6, alors que le bloc de l'IP écoutait en IPv4.

Les tests suivants ont forcé IPv4 :

~~~bash
curl -4 -i -H 'Host: 145.223.33.207' localhost/.well-known/acme-challenge/kaydiay-check

curl -4 -i 145.223.33.207/.well-known/acme-challenge/kaydiay-check
~~~

Les deux ont répondu :

~~~text
HTTP/1.1 200 OK
kaydiay-ok
~~~

## 20. Obtention du certificat

### Onglet A — Serveur

~~~bash
certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --ip-address 145.223.33.207 \
  --preferred-profile shortlived \
  --cert-name kaydiay-ip \
  --deploy-hook "nginx -t && systemctl reload nginx"
~~~

Si Certbot demande des informations, utiliser une adresse e-mail à laquelle on a accès et lire ses conditions.

Résultat observé :

~~~text
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/kaydiay-ip/fullchain.pem
Key is saved at: /etc/letsencrypt/live/kaydiay-ip/privkey.pem
This certificate expires on 2026-10-28.
Certbot has set up a scheduled task to automatically renew this certificate.
~~~

La date ci-dessus est celle du certificat initial. Après renouvellement, elle change.

Certbot a affiché « Hook 'deploy-hook' ran with error output », suivi de messages Nginx indiquant que le test était réussi. Nginx écrit ces messages sur sa sortie d'erreur même quand la vérification réussit ; ce texte seul ne signifie donc pas que le hook a échoué.

Le hook permet de recharger les certificats dans Nginx après leur renouvellement.

## 21. Activation HTTPS sur le port 8085

### Onglet A — Serveur

~~~bash
python3 - <<'PY'
from pathlib import Path

path = Path("/etc/nginx/sites-available/kaydiay")
text = path.read_text()
if text.count("listen 8085;") != 1:
    raise SystemExit("Configuration inattendue : aucune modification.")

backup = path.with_name(path.name + ".before-https")
if not backup.exists():
    backup.write_text(text)

text = text.replace("listen 8085;", """listen 8085 ssl;
    ssl_certificate /etc/letsencrypt/live/kaydiay-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kaydiay-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;""")

path.write_text(text)
print("HTTPS configuré pour KayDiay.")
PY

nginx -t && systemctl reload nginx
~~~

Sauvegarde de l'ancienne configuration HTTP :

~~~text
/etc/nginx/sites-available/kaydiay.before-https
~~~

Les premières lignes de la configuration active sont désormais :

~~~nginx
server {
    listen 8085 ssl;
    ssl_certificate /etc/letsencrypt/live/kaydiay-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kaydiay-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    server_name 145.223.33.207;
~~~

Les emplacements /api/, /health et / restent ceux définis précédemment.

## 22. Adresse HTTPS dans le backend

### Onglet A — Serveur

~~~bash
python3 - <<'PY'
from pathlib import Path

path = Path("/opt/kaydiay/backend/.env")
origin = "https://" + "145.223.33.207:8085"
updates = {"FRONTEND_URL": origin, "ALLOWED_ORIGINS": origin}

lines = [
    line for line in path.read_text().splitlines()
    if line.split("=", 1)[0].strip() not in updates
]
lines.extend(f"{key}={value}" for key, value in updates.items())
path.write_text("\n".join(lines) + "\n")
print("Adresse HTTPS enregistrée.")
PY

docker restart kaydiay-backend
~~~

Valeurs attendues dans la configuration finale :

~~~dotenv
PORT=3010
FRONTEND_URL=https://145.223.33.207:8085
ALLOWED_ORIGINS=https://145.223.33.207:8085
~~~

Le redémarrage permet au backend de relire sa configuration.

## 23. Vérifications HTTPS

### Onglet A — Serveur

~~~bash
sleep 5
curl -I https://145.223.33.207:8085
curl -i https://145.223.33.207:8085/health
~~~

Les deux requêtes ont répondu **200 OK**. Le backend a répondu :

~~~json
{"status":"ok"}
~~~

Ces tests ont été exécutés sans désactiver la vérification TLS : le certificat a donc été accepté par curl sur le serveur.

### Navigateur du Mac ou du téléphone

Ouvrir explicitement :

~~~text
https://145.223.33.207:8085
~~~

L'ancienne adresse HTTP sur ce même port ne doit plus être utilisée.

Réessayer ensuite le bouton caméra et accepter la permission du navigateur.

### Test de renouvellement proposé, résultat non encore fourni

~~~bash
certbot renew --cert-name kaydiay-ip --dry-run --run-deploy-hooks
~~~

Cette commande a été donnée à la fin du déploiement. **Son résultat n'avait pas encore été communiqué lors de la rédaction de ce document.** Elle doit confirmer le fonctionnement du renouvellement et du hook.

## 24. Ce qui a changé sur le serveur

Ajouts :

- Archive reçue dans /root/fotoljaay-deploy-20261021.tar.gz.
- Application dans /opt/kaydiay.
- Image et conteneur Docker KayDiay.
- Configuration Nginx kaydiay et son lien d'activation.
- Autorisation UFW du port 8085.
- Certificat kaydiay-ip et configuration de renouvellement associée.
- Fichier de test ACME dans /var/www/certbot/.well-known/acme-challenge/.

Modification partagée :

- Exception ACME ajoutée dans le bloc HTTP de l'adresse IP du fichier in-odc-frontend.
- La redirection vers gestionecoleodc.com a été conservée pour les autres chemins.
- Une sauvegarde a été créée avant cette modification.

Les conteneurs des autres applications et leurs routes HTTPS n'ont pas été modifiés par les commandes de cette session. Leur fonctionnement complet après rechargement de Nginx n'a pas été vérifié dans les résultats partagés.

## 25. Mettre à jour le frontend

Cette procédure concerne des modifications faites **directement dans /opt/kaydiay/frontend sur le serveur**, par exemple avec VS Code Remote SSH.

### Onglet A — Serveur

~~~bash
cd /opt/kaydiay/frontend
npm run build
~~~

Après réussite, actualiser le navigateur. Nginx sert directement les fichiers compilés ; aucun redémarrage du backend n'est nécessaire.

Si les dépendances ont changé dans package.json et package-lock.json :

~~~bash
cd /opt/kaydiay/frontend
npm ci && npm run build
~~~

Une compilation directe dans le dossier servi peut interrompre brièvement l'accès aux fichiers pendant leur remplacement. Pour des mises à jour fréquentes sans interruption, prévoir ultérieurement des dossiers de versions séparés.

## 26. Mettre à jour le backend

Cette procédure a été proposée comme maintenance future ; elle n'a pas été exécutée pendant le déploiement initial.

### Onglet A — Serveur

Compiler, tester et construire avant d'arrêter le conteneur actuel :

~~~bash
cd /opt/kaydiay/backend
npm run build && npm test && docker build -t kaydiay-backend:latest .
~~~

Si les dépendances ont changé, lancer npm ci dans ce dossier avant la compilation et les tests.

**Uniquement si toutes les étapes réussissent**, remplacer le conteneur :

~~~bash
docker stop kaydiay-backend && \
docker rm kaydiay-backend && \
docker run -d \
  --name kaydiay-backend \
  --restart unless-stopped \
  -p 127.0.0.1:3010:3010 \
  -e PORT=3010 \
  --mount type=bind,src=/opt/kaydiay/backend/.env,dst=/app/.env,readonly \
  kaydiay-backend:latest
~~~

Vérifier ensuite :

~~~bash
sleep 5
curl -i https://145.223.33.207:8085/health
~~~

Le backend est indisponible pendant le remplacement du conteneur. L'image initiale kaydiay-backend:20261021 reste disponible tant qu'elle n'a pas été supprimée.

Un simple docker restart ne reconstruit pas le code : il relance la même image. Pour un changement du code backend, il faut reconstruire l'image puis recréer le conteneur.

## 27. Si les changements sont faits sur le Mac

Les dossiers du Mac et du serveur ne se synchronisent pas automatiquement.

Pendant cette session, le code a été transféré par archive, et non par Git. Aucune synchronisation permanente n'a été configurée.

Avant une prochaine mise à jour depuis le Mac :

1. Récupérer les corrections de dépendances faites sur le serveur.
2. Comparer les modifications locales et distantes.
3. Transférer les fichiers modifiés sans écraser le .env du serveur.
4. Compiler le frontend ou reconstruire et remplacer le backend selon les étapes ci-dessus.
5. Vérifier le site.

### Onglet B — Mac : récupérer les fichiers de dépendances pour comparaison

Commandes supplémentaires de maintenance, non exécutées pendant la session :

~~~bash
mkdir -p /tmp/kaydiay-server-dependencies
scp root@145.223.33.207:/opt/kaydiay/backend/package.json /tmp/kaydiay-server-dependencies/
scp root@145.223.33.207:/opt/kaydiay/backend/package-lock.json /tmp/kaydiay-server-dependencies/
~~~

Comparer ces fichiers avec ceux du backend local avant de les remplacer. Le .env local contient encore potentiellement les anciennes adresses : il ne doit pas écraser celui du serveur.

Ne pas transférer les node_modules du Mac vers Ubuntu : les dépendances doivent être installées dans leur environnement cible.

Une modification de prisma/schema.prisma peut demander une migration de base de données. Les simples commandes de reconstruction ne réalisent pas cette migration. Préparer la migration et une sauvegarde avant toute modification du schéma de production.

## 28. Commandes utiles pour la maintenance

Commandes de diagnostic proposées pour la suite ; elles n'ont pas toutes été exécutées pendant la session.

### Onglet A — Serveur

État du conteneur :

~~~bash
docker ps --filter name=kaydiay-backend
~~~

Journaux récents du backend :

~~~bash
docker logs --tail 100 kaydiay-backend
~~~

Les journaux peuvent contenir des informations sensibles. Les relire et masquer les secrets avant de les partager.

Test du backend local :

~~~bash
curl -i http://127.0.0.1:3010/health
~~~

Test public HTTPS :

~~~bash
curl -i https://145.223.33.207:8085/health
~~~

Validation de Nginx avant rechargement :

~~~bash
nginx -t && systemctl reload nginx
~~~

Informations du certificat :

~~~bash
certbot certificates --cert-name kaydiay-ip
~~~

Test du renouvellement :

~~~bash
certbot renew --cert-name kaydiay-ip --dry-run --run-deploy-hooks
~~~

Vérification du pare-feu et des ports :

~~~bash
ufw status
ss -lntp '( sport = :8085 or sport = :3010 )'
~~~

Quitter SSH :

~~~bash
exit
~~~

Quitter le Terminal ne coupe pas l'application : Nginx et Docker continuent de fonctionner sur le serveur.

## 29. Vérifications restant à confirmer

- Résultat du test de renouvellement automatique avec --dry-run.
- Accès effectif à la caméra sur le téléphone après passage à HTTPS.
- Parcours complet : connexion, affichage et publication d'une annonce avec images.
- Envoi réel d'un e-mail après la mise à jour de Nodemailer.
- Sauvegarde et restauration de la base Neon.
- Vérification des autres applications après le changement partagé de Nginx.

À la rédaction, les éléments confirmés étaient : frontend accessible depuis un navigateur externe, connexion Neon et tables accessibles, 11 tests backend réussis, audit de production sans vulnérabilité connue signalée, certificat obtenu et réponses HTTPS 200 du frontend et du backend.

## 30. Mise à jour : ajout de photos depuis l'appareil

Modification préparée sur le Mac après le déploiement initial. **Son installation sur le serveur n'a pas encore été confirmée.**

Le formulaire de création et de modification d'annonce propose :

- Ajouter des photos depuis les fichiers ou la photothèque.
- Sélectionner plusieurs fichiers JPG, PNG ou WebP, de 10 Mo maximum chacun.
- Prévisualiser et supprimer des photos avant publication.
- Combiner les photos importées avec les photos prises par la caméra, jusqu'à quatre photos au total.
- Redimensionner les images importées à 1920 pixels maximum sur leur plus grand côté et les convertir en JPEG avant l'envoi.

Les photos sont envoyées à Cloudinary au moment de la publication, via l'API existante.

Fichiers applicatifs modifiés :

~~~text
frontend/src/app/components/ads/ad-create/ad-create.ts
frontend/src/app/components/ads/ad-create/ad-create.html
~~~

Les tests du composant ont également été mis à jour, avec une configuration dédiée :

~~~text
frontend/src/app/components/ads/ad-create/ad-create.spec.ts
frontend/tsconfig.ad-create-test.json
~~~

Vérifications effectuées sur le Mac : compilation de production réussie et sept tests ChromeHeadless réussis. Les mêmes avertissements de taille du frontend restent présents. L'envoi Cloudinary est simulé dans les tests ; la publication réelle doit être vérifiée après transfert.

### Onglet A — Serveur : sauvegarder les sources du formulaire

Commande supplémentaire proposée pour cette mise à jour, non encore exécutée :

~~~bash
cp -a /opt/kaydiay/frontend/src/app/components/ads/ad-create "/opt/kaydiay/ad-create-backup-$(date +%Y%m%d-%H%M%S)"
~~~

### Onglet B — Mac : transférer les deux fichiers applicatifs

~~~bash
cd /Users/mac/Downloads/fotoljaayback--main

scp frontend/src/app/components/ads/ad-create/ad-create.ts \
  frontend/src/app/components/ads/ad-create/ad-create.html \
  root@145.223.33.207:/opt/kaydiay/frontend/src/app/components/ads/ad-create/
~~~

Attendre la fin du transfert avant de lancer la compilation sur le serveur.

### Onglet A — Serveur : compiler

~~~bash
cd /opt/kaydiay/frontend
npm run build
~~~

Après réussite, actualiser le site HTTPS. Si l'ancienne interface reste visible, fermer tous les onglets du site et le rouvrir pour permettre la prise en compte de la mise à jour du service worker.

Cette modification ne nécessite pas de migration Neon, de reconstruction du backend ou de changement Nginx.

### Vérifier la nouvelle fonction

1. Ouvrir le formulaire de création d'annonce.
2. Cliquer sur « Ajouter des photos » et choisir plusieurs photos.
3. Vérifier les aperçus, supprimer une photo et la remplacer.
4. Vérifier que le total reste limité à quatre photos.
5. Publier une annonce et vérifier que les images sont conservées.
6. Vérifier aussi l'ajout de photo en modification d'une annonce.

### Relancer les tests sur le Mac

~~~bash
cd /Users/mac/Downloads/fotoljaayback--main/frontend

./node_modules/.bin/ng test \
  --watch=false \
  --browsers=ChromeHeadless \
  --include=src/app/components/ads/ad-create/ad-create.spec.ts \
  --ts-config=tsconfig.ad-create-test.json
~~~

## 31. Mise à jour : cadrage des photos dans les cartes du tableau de bord

Modification préparée sur le Mac : dans ad-list.html, les images utilisent object-fit-contain au lieu de object-fit-cover. La photo reste entière, centrée et sans déformation dans un cadre de hauteur fixe, avec un fond clair dans l'espace restant. Cette modification concerne les cartes « Mes annonces » et « Gestion des annonces ». Elle ne corrige pas une rotation déjà présente dans la photo source.

### Onglet B — Mac

~~~bash
cd /Users/mac/Downloads/fotoljaayback--main

scp frontend/src/app/components/ads/ad-list/ad-list.html \
  root@145.223.33.207:/opt/kaydiay/frontend/src/app/components/ads/ad-list/
~~~

### Onglet A — Serveur

~~~bash
cd /opt/kaydiay/frontend
npm run build
~~~

Après réussite, recharger le site. Fermer puis rouvrir les onglets du site si le service worker affiche encore l'ancienne version.

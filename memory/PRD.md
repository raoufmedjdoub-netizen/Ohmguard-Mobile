# OhmGuard Mobile App - PRD (Product Requirements Document)

## Objectif
Application mobile cliente simplifiée pour la réception et l'acquittement des alertes de détection de chute de la plateforme OhmGuard.

## Plateformes Cibles
- Android (via Expo / React Native)
- iOS (via Expo / React Native)
- Web (pour tests et démo)

## Stack Technique
- **Frontend**: React Native / Expo Router
- **State Management**: Zustand
- **API Client**: Axios
- **Real-time**: Socket.IO Client
- **Storage**: Expo SecureStore (mobile) / AsyncStorage (web fallback)

## Fonctionnalités Implémentées

### 1. Authentification ✅
- Login avec email/password
- Gestion JWT (access token + refresh token)
- Stockage sécurisé des tokens
- Auto-refresh du token expiré
- Déconnexion

### 2. Liste des Alertes ✅
- Affichage chronologique des alertes de chute (FALL, PRE_FALL)
- Filtres par statut (Toutes, Nouvelles, Acquittées)
- Pull-to-refresh
- Badge compteur d'alertes en attente
- Informations affichées:
  - Type d'alerte (CHUTE / PRÉ-CHUTE)
  - Date et heure
  - Localisation (Client > Bâtiment > Étage > Chambre)
  - Nom du radar
  - Statut (NOUVELLE / ACQUITTÉE)

### 3. Détail d'une Alerte ✅
- Informations complètes:
  - Type et statut
  - Date et heure exacte
  - Localisation détaillée
  - Informations du radar (nom + S/N)
  - Niveau de sévérité
- Bouton ACQUITTER L'ALERTE (gros, visible, couleur urgence)

### 4. Acquittement ✅
- Confirmation avant acquittement
- Appel API PATCH /api/events/{id}
- Mise à jour temps réel du statut
- Message de succès/erreur

### 5. Temps Réel ✅
- Connexion Socket.IO automatique après login
- Réception des nouvelles alertes en temps réel
- Mise à jour des statuts en temps réel

### 6. Gestion des Droits ✅
- Respect des rôles définis côté backend
- Bouton d'acquittement désactivé si permissions insuffisantes

## Écrans

1. **Login** (`/login`)
   - Logo OhmGuard
   - Champs email/password
   - Bouton SE CONNECTER
   - Gestion des erreurs

2. **Liste des Alertes** (`/alerts`)
   - Header avec nom utilisateur + bouton déconnexion
   - Banner compteur alertes en attente
   - Onglets de filtrage
   - Liste des cartes d'alertes

3. **Détail Alerte** (`/alerts/[id]`)
   - Banner type d'alerte
   - Cartes d'informations
   - Bouton ACQUITTER en footer fixe

## API Endpoints Utilisés

```
POST /api/auth/login          - Connexion
POST /api/auth/refresh        - Refresh token
GET  /api/auth/me             - Utilisateur courant
GET  /api/events              - Liste des événements
GET  /api/events/{id}         - Détail d'un événement
PATCH /api/events/{id}        - Mise à jour (acquittement)
```

## Socket.IO Events

```
join_tenant     - Rejoindre la room tenant
new_event       - Nouvelle alerte reçue
event_updated   - Mise à jour d'une alerte
```

## Identifiants de Démo

```
Email: demo@ohmguard.com
Mot de passe: demo123
```

## Structure des Fichiers

```
frontend/
├── app/
│   ├── _layout.tsx        # Root layout avec AuthGuard
│   ├── index.tsx          # Redirect basé sur auth
│   ├── login.tsx          # Écran de connexion
│   └── alerts/
│       ├── index.tsx      # Liste des alertes
│       └── [id].tsx       # Détail d'une alerte
└── src/
    ├── components/
    │   └── AlertCard.tsx  # Composant carte alerte
    ├── services/
    │   ├── api.ts         # Client API + auth
    │   └── socket.ts      # Client Socket.IO
    ├── store/
    │   ├── authStore.ts   # État authentification
    │   └── alertStore.ts  # État alertes
    └── types/
        └── index.ts       # Types TypeScript
```

## Ce qui N'EST PAS Implémenté (hors scope)
- Gestion des utilisateurs
- Gestion des bâtiments/clients/radars
- Configuration
- Statistiques/Reporting
- Notifications push (structure prête, à configurer avec Firebase/APNs)
- Résolution finale des alertes

# Guide des Notifications Push - OhmGuard Mobile

## Configuration Complète ✅

L'implémentation des notifications push est complète ! Voici ce qui a été mis en place :

### Backend
- **POST /api/push-tokens** : Enregistrer un token push
- **DELETE /api/push-tokens** : Supprimer un token push
- **POST /api/create-fall-event** : Créer un événement de chute et envoyer une notification
- **POST /api/test-notification** : Envoyer une notification de test

### Frontend
- Service de notifications push (`src/services/pushNotifications.ts`)
- Intégration automatique lors de la connexion
- Navigation vers l'alerte lors du tap sur une notification
- Configuration `app.json` pour Android et iOS

---

## 🚀 Créer un Development Build

Depuis le SDK 53, les notifications push ne fonctionnent plus dans Expo Go. Vous devez créer un **Development Build**.

### Prérequis

1. **Installer EAS CLI** (si pas déjà fait) :
```bash
npm install -g eas-cli
```

2. **Se connecter à Expo** :
```bash
eas login
```

3. **Configurer votre projet** (si première fois) :
```bash
cd /app/frontend
eas build:configure
```

### Créer le Build Android (APK)

```bash
# Build de développement pour Android
eas build --profile development --platform android
```

Le build prend environ 10-15 minutes. Une fois terminé, vous recevrez un lien pour télécharger l'APK.

### Créer le Build iOS (Simulateur)

```bash
# Build de développement pour iOS Simulator
eas build --profile development --platform ios
```

**Note iOS** : Pour un appareil réel iOS, vous aurez besoin d'un compte Apple Developer et de configurer les certificats de push (APNs).

---

## 📱 Tester les Notifications

### 1. Installer le Development Build

- Téléchargez l'APK (Android) ou utilisez le simulateur (iOS)
- Installez l'application sur votre appareil

### 2. Lancer le serveur de développement

```bash
cd /app/frontend
npx expo start --dev-client
```

### 3. Scanner le QR code

Ouvrez l'application et scannez le QR code affiché dans le terminal.

### 4. Se connecter

- Email : `demo@ohmguard.com`
- Mot de passe : `demo123`

### 5. Tester une notification

Depuis un autre terminal ou via l'API :

```bash
# Se connecter et récupérer le token
TOKEN=$(curl -s -X POST https://votre-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@ohmguard.com","password":"demo123"}' | jq -r '.access_token')

# Créer un événement de chute (enverra une notification)
curl -X POST https://votre-backend.com/api/create-fall-event \
  -H "Authorization: Bearer $TOKEN"

# Ou envoyer une notification de test
curl -X POST https://votre-backend.com/api/test-notification \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📋 Fichiers de Configuration

### eas.json
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### app.json (notifications)
```json
{
  "plugins": [
    ["expo-notifications", {
      "icon": "./assets/images/notification-icon.png",
      "color": "#00BCD4"
    }]
  ],
  "notification": {
    "icon": "./assets/images/notification-icon.png",
    "color": "#00BCD4",
    "androidMode": "default"
  }
}
```

---

## 🔧 Dépannage

### Le token n'est pas enregistré
- Vérifiez que vous utilisez un Development Build, pas Expo Go
- Vérifiez que les permissions sont accordées
- Consultez les logs de l'application

### Les notifications n'arrivent pas
- Vérifiez que le token est bien enregistré sur le backend
- Vérifiez les logs du backend pour les erreurs d'envoi
- Assurez-vous que l'application n'est pas en mode économie d'énergie

### Erreur "DeviceNotRegistered"
- Le token n'est plus valide
- L'application a été désinstallée puis réinstallée
- Solution : Se déconnecter et se reconnecter pour obtenir un nouveau token

---

## 📞 Support

Pour toute question, consultez la documentation Expo :
- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

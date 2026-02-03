# ============================================
# MISE À JOUR DU BACKEND POUR LE SON PERSONNALISÉ
# ============================================
# 
# Pour activer le son personnalisé "notification_alert.wav" sur les notifications,
# vous devez modifier votre fichier push_notification_service.py sur votre serveur
# de production.
#
# MODIFICATION À FAIRE:
# ---------------------
# Dans la fonction qui envoie les notifications (send_push_notification ou similaire),
# ajoutez le paramètre "sound" dans le message:

# AVANT:
# message = {
#     "to": token,
#     "title": title,
#     "body": body,
#     "data": data or {},
#     "priority": "high",
# }

# APRÈS:
# message = {
#     "to": token,
#     "title": title,
#     "body": body,
#     "data": data or {},
#     "priority": "high",
#     "sound": "notification_alert.wav",  # <-- AJOUTER CETTE LIGNE
#     "channelId": "fall-alerts",         # <-- AJOUTER CETTE LIGNE (optionnel mais recommandé)
# }

# ============================================
# CODE COMPLET DE RÉFÉRENCE
# ============================================

import httpx
import logging

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: dict = None
) -> bool:
    """
    Envoie une notification push via Expo avec son personnalisé
    """
    if not token or not token.startswith("ExponentPushToken"):
        logger.warning(f"Invalid push token: {token}")
        return False
    
    message = {
        "to": token,
        "title": title,
        "body": body,
        "data": data or {},
        "priority": "high",
        "sound": "notification_alert.wav",  # Son personnalisé
        "channelId": "fall-alerts",         # Canal de notification Android
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=message,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("data", {}).get("status") == "ok":
                    logger.info(f"Push notification sent successfully to {token[:20]}...")
                    return True
                else:
                    logger.warning(f"Push notification failed: {result}")
                    return False
            else:
                logger.error(f"Push API error: {response.status_code}")
                return False
                
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
        return False


async def send_fall_alert_notification(tokens: list, resident_name: str, location: str):
    """
    Envoie une alerte de chute à tous les tokens enregistrés
    """
    title = "🚨 ALERTE CHUTE"
    body = f"Chute détectée - {resident_name}"
    if location:
        body += f" ({location})"
    
    data = {
        "type": "fall_alert",
        "resident": resident_name,
        "location": location,
        "timestamp": str(datetime.utcnow())
    }
    
    results = []
    for token in tokens:
        success = await send_push_notification(token, title, body, data)
        results.append({"token": token[:20] + "...", "success": success})
    
    return results

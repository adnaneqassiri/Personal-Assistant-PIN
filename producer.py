from kafka import KafkaProducer
import json

# -------------------------------
# Config Kafka
# -------------------------------
producer = KafkaProducer(
    bootstrap_servers='localhost:29092',  # depuis ton host
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# -------------------------------
# Message à envoyer
# -------------------------------
message = [{
  "context_id": "ctx_001",
  "user_id": "user_001",
  "created_at": "2026-04-25T15:00:05",

  "vision": {
    "timestamp": "2026-04-25T10:00:00",
    "objects": ["ordinateur", "bureau", "bouteille"],
    "scene_description": "Utilisateur assis devant un ordinateur avec une bouteille sur le bureau.",
    "confidence": 0.86,
    "media_ref": "capture_1000.jpg"
  },

  "audio": {
    "timestamp": "2026-04-25T15:00:00",
    "transcript": "Nous devons finaliser le pipeline VLM cette semaine.",
    "keywords": ["pipeline VLM", "deadline", "prototype"],
    "confidence": 0.80,
    "audio_ref": "audio_1500.wav"
  },

  "location": {
    "timestamp": "2026-04-25T09:00:00",
    "latitude": 35.7595,
    "longitude": -5.8340,
    "place_label": "maison",
    "zone_type": "domicile"
  }
}]

# -------------------------------
# Send message
# -------------------------------
producer.send("contextBuilder", message)
producer.flush()

print("✅ Message envoyé dans Kafka")
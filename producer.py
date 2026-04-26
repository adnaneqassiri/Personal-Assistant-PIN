from kafka import KafkaProducer
import json
from datetime import datetime, timedelta

# -------------------------------
# Config Kafka
# -------------------------------
producer = KafkaProducer(
    bootstrap_servers='localhost:29092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# -------------------------------
# Génération de 5 messages
# -------------------------------
base_time = datetime(2026, 4, 25, 15, 0, 0)

messages = []

for i in range(5):
    msg = [{
        "context_id": f"ctx_00{i+1}",
        "user_id": "user_001",
        "created_at": (base_time + timedelta(minutes=i)).isoformat(),

        "vision": {
            "timestamp": (base_time + timedelta(minutes=i)).isoformat(),
            "objects": ["ordinateur", "bureau", "bouteille"] if i < 3 else ["canapé", "téléphone"],
            "scene_description": "Utilisateur travaille sur ordinateur" if i < 3 else "Utilisateur en pause sur le canapé",
            "confidence": 0.85,
            "media_ref": f"capture_{1000+i}.jpg"
        },

        "audio": {
            "timestamp": (base_time + timedelta(minutes=i)).isoformat(),
            "transcript": "Discussion sur le pipeline VLM" if i < 2 else "Je vais prendre une pause",
            "keywords": ["pipeline VLM", "deadline"] if i < 2 else ["pause"],
            "confidence": 0.80,
            "audio_ref": f"audio_{1500+i}.wav"
        },

        "location": {
            "timestamp": (base_time + timedelta(minutes=i)).isoformat(),
            "latitude": 35.7595,
            "longitude": -5.8340,
            "place_label": "maison",
            "zone_type": "domicile"
        }
    }]

    messages.append(msg)

# -------------------------------
# Envoi
# -------------------------------
for msg in messages:
    producer.send("contextBuilder", msg)

producer.flush()

print("✅ 5 messages envoyés dans Kafka")
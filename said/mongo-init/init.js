db = db.getSiblingDB("ai_life_companion");

/* =========================
   RESET DATABASE
========================= */

db.users.drop();
db.contexts.drop();
db.decisions.drop();
db.notifications.drop();
db.llm_requests.drop();
db.llm_responses.drop();

/* =========================
   USERS
========================= */

db.users.insertMany([
  {
    user_id: "said",
    full_name: "said",
    email: "said@gmail.com",
    created_at: new Date("2026-04-25T08:00:00"),
    preferences: {
      language: "fr",
      notifications_enabled: true,
      productivity_tracking: true,
      wellbeing_tracking: true,
      meeting_assistant_enabled: true
    }
  }
]);

/* =========================
   CONTEXTS
   Résultat du Context Builder
   Il assemble les sorties VLM + Speech-to-Text + GPS
========================= */

db.contexts.insertMany([
{
  "context_id": "ctx_001",
  "user_id": "said",
  "created_at": "2026-04-25T10:30:05",
  "context_type": "professional_meeting",

  "vision": {
    "source": "vlm",
    "frame_id": "frame_meeting_001",
    "timestamp": "2026-04-25T10:30:00",
    "objects": [
      "table",
      "ordinateur portable",
      "écran de présentation",
      "chaises",
      "personnes",
      "carnet",
      "stylo"
    ],
    "scene_description": "L'utilisateur est assis dans une salle de réunion avec plusieurs personnes. Les participants discutent autour d'une table, avec des ordinateurs portables ouverts et un écran de présentation affichant des éléments liés à un projet.",
    "detected_activity": "réunion professionnelle",
    "environment": "salle de réunion",
    "confidence": 0.91,
    "media_ref": "capture_meeting_001.jpg"
  },

  "audio": {
    "source": "speech_to_text",
    "audio_id": "audio_meeting_001",
    "timestamp": "2026-04-25T10:30:00",
    "transcript": "Bonjour à tous. Aujourd'hui, nous allons faire le point sur l'avancement du projet d'assistant personnel intelligent. La première tâche concerne la finalisation du pipeline VLM pour analyser les scènes visuelles. Ensuite, nous devons connecter le backend FastAPI avec MongoDB afin de récupérer les contextes stockés. La troisième tâche consiste à intégrer le modèle LLM via Groq pour générer des réponses contextuelles. Nous devons également préparer une démonstration simple avec une interface chatbot Streamlit. La deadline pour le prototype fonctionnel est fixée à la fin de cette semaine. Oussama va s'occuper de la partie backend et de la connexion avec le LLM. L'équipe data va préparer les données simulées, tandis que l'équipe frontend va améliorer l'interface utilisateur.",
    "keywords": [
      "assistant personnel intelligent",
      "pipeline VLM",
      "FastAPI",
      "MongoDB",
      "Groq",
      "LLM",
      "Streamlit",
      "prototype",
      "deadline",
      "backend",
      "frontend"
    ],
    "language": "fr",
    "speaker_count": 4,
    "confidence": 0.87,
    "audio_ref": "audio_meeting_001.wav"
  },

  "location": {
    "source": "gps",
    "timestamp": "2026-04-25T10:30:00",
    "latitude": 35.759465,
    "longitude": -5.833954,
    "place_label": "NTT DATA",
    "zone_type": "entreprise",
    "city": "Tétouan",
    "is_known_place": true
  }
}
]);

/* =========================
    DECISIONS
    Résultat du Decision Engine
    Ici se fait l'interprétation réelle du contexte
========================= */

db.decisions.insertMany([
{
  "decision_id": "dec_001",
  "user_id": "said",
  "context_id": "ctx_001",
  "created_at": "2026-04-25T10:30:10",

  "detected_activity": "réunion_projet",
  "event_type": "meeting_summary_required",
  "priority": "high",
  "priority_score": 0.86,

  "recommendation": "Générer un résumé de réunion, extraire les décisions importantes, identifier les tâches assignées et préparer une liste d'actions à suivre.",
  "action_required": true,

  "actions": [
    {
      "type": "generate_meeting_summary",
      "target": "llm"
    },
    {
      "type": "extract_action_items",
      "target": "llm"
    },
    {
      "type": "save_meeting_event",
      "target": "database"
    },
    {
      "type": "notify_user",
      "target": "mobile_app"
    }
  ]
}
]);

/* =========================
    NOTIFICATIONS
    Messages envoyés à l'application utilisateur
========================= */

db.notifications.insertMany([
{
    "notification_id": "notif_001",
    "user_id": "said",
    "context_id": "ctx_001",
    "decision_id": "dec_001",
    "timestamp": "2026-04-25T10:30:15",
    "title": "Résumé de réunion disponible",
    "message": "Une réunion professionnelle a été détectée chez NTT DATA. Tu peux générer un résumé, extraire les décisions importantes et identifier les tâches à suivre.",
    "priority": "high",
    "notification_type": "meeting_summary",
    "status": "pending",
    "action": {
      "type": "open_chatbot",
      "label": "Résumer la réunion",
      "suggested_question": "Résume cette réunion et donne-moi les tâches importantes."
    }
}

])

/* =========================
    INDEXES
========================= */

db.users.createIndex({ user_id: 1 }, { unique: true });

db.contexts.createIndex({ context_id: 1 }, { unique: true });
db.contexts.createIndex({ user_id: 1, created_at: -1 });
db.contexts.createIndex({ context_type: 1 });

db.decisions.createIndex({ decision_id: 1 }, { unique: true });
db.decisions.createIndex({ user_id: 1, created_at: -1 });
db.decisions.createIndex({ context_id: 1 });
db.decisions.createIndex({ event_type: 1 });
db.decisions.createIndex({ priority: 1 });

db.notifications.createIndex({ notification_id: 1 }, { unique: true });
db.notifications.createIndex({ user_id: 1, timestamp: -1 });
db.notifications.createIndex({ decision_id: 1 });
db.notifications.createIndex({ status: 1 });



print("Database ai_life_companion initialized successfully with simplified backend-oriented architecture.");
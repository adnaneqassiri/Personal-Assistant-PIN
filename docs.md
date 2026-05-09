# Personal Assistant PIN - Guide Simple

Ce guide explique comment lancer, tester et debugger le projet complet en local.

## 1. Vue D'ensemble

Le projet est organisé autour de ce pipeline:

```text
Image + audio + location
-> context_ingestion producers
-> Kafka raw topics
   - video_stream
   - audio_stream
   - location_stream
-> context_ingestion builder
-> Kafka normalized-context
-> Decision_engine
-> MongoDB + ChromaDB
-> Kafka decision.actions
-> backend / chatbot / UI
```

Structure principale:

```text
.
├── Decision_engine/
├── context_ingestion/
├── scripts/
├── tests/
├── compose.yaml
├── .env
├── requirements.txt
├── README.md
└── docs.md
```

## 2. Rôle De Chaque Partie

### Context Ingestion

Dossier: `context_ingestion/`

Responsabilité:

- lire les données audio depuis `context_ingestion/data/audio/`
- lire les images depuis `context_ingestion/data/video/`
- produire une localisation simulée
- envoyer les données brutes vers Kafka
- construire un contexte normalisé
- publier le contexte final dans le topic Kafka `normalized-context`

Topics utilisés:

```text
video_stream
audio_stream
location_stream
normalized-context
```

### Decision Engine

Dossier: `Decision_engine/`

Responsabilité:

- consommer `normalized-context`
- valider le message
- transformer en modèle interne
- détecter si le contexte est significatif
- appeler Groq si nécessaire
- appliquer les règles métier
- écrire dans MongoDB
- indexer la mémoire utile dans ChromaDB
- publier les actions dans `decision.actions`

Collections MongoDB utilisées:

```text
assistant_db.raw_context_events
assistant_db.normalized_contexts
assistant_db.user_state
assistant_db.activities
assistant_db.meetings
assistant_db.notifications
assistant_db.decisions_history
assistant_db.daily_summaries
```

### Backend

Le backend doit se brancher après le Decision Engine.

Rôle recommandé:

- lire MongoDB pour afficher l'historique, les décisions et l'état utilisateur
- exposer des endpoints REST/WebSocket pour le frontend ou chatbot
- écouter `decision.actions` si des notifications temps réel sont nécessaires

Contrats utiles:

```text
MongoDB assistant_db.normalized_contexts
MongoDB assistant_db.decisions_history
MongoDB assistant_db.notifications
Kafka topic decision.actions
```

### Chatbot

Le chatbot doit utiliser les données déjà traitées, pas les données brutes.

Rôle recommandé:

- répondre aux questions utilisateur avec l'historique MongoDB
- utiliser ChromaDB pour récupérer les souvenirs pertinents
- afficher ou expliquer les décisions prises
- envoyer des commandes utilisateur au backend si nécessaire

Sources recommandées:

```text
MongoDB assistant_db.decisions_history
MongoDB assistant_db.normalized_contexts
MongoDB assistant_db.user_state
ChromaDB ./chroma
```

## 3. Fichier `.env`

Le projet charge les variables depuis le fichier `.env` à la racine.

Exemple:

```env
GROQ_API_KEY=replace_with_your_groq_api_key

KAFKA_BOOTSTRAP_SERVERS=localhost:29092
CONTEXT_TOPIC=normalized-context
KAFKA_TOPIC=normalized-context
KAFKA_SOURCE_TOPIC=normalized-context
KAFKA_AUTO_OFFSET_RESET=earliest
NOTIFICATION_TOPIC=decision.actions
KAFKA_ACTIONS_TOPIC=decision.actions

AUDIO_STREAM_TOPIC=audio_stream
VIDEO_STREAM_TOPIC=video_stream
LOCATION_STREAM_TOPIC=location_stream
CONTEXT_USER_ID=user_001
CONTEXT_POLL_INTERVAL_SECONDS=15
CONTEXT_BUCKET_SECONDS=15
CONTEXT_WATERMARK_DELAY="30 seconds"
CONTEXT_BUILDER_CHECKPOINT_LOCATION=./checkpoints/context_builder

SPARK_MASTER=local[*]
SPARK_CHECKPOINT_LOCATION=./checkpoints/decision_engine

MONGO_URI=mongodb://admin:admin123@localhost:27017
MONGO_DATABASE=assistant_db

CHROMA_PATH=./chroma

GROQ_MODEL=llama-3.1-8b-instant
LLM_RETRY_COUNT=3
APP_TIMEZONE=UTC
LOG_LEVEL=INFO
SIGNIFICANCE_PERIODIC_MINUTES=2
VISUAL_SIMILARITY_THRESHOLD=0.75
OBJECT_CHANGE_THRESHOLD=0.50
```

Important:

- `KAFKA_AUTO_OFFSET_RESET=earliest` est utile pour tester avec des messages déjà présents dans Kafka.
- Si MongoDB est supprimé mais que `checkpoints/decision_engine` reste, Spark peut croire que les messages Kafka sont déjà consommés.
- Si ChromaDB donne une erreur SQLite de schema, supprimer `chroma/`.

## 4. Installation

Active ton environnement Python, puis installe:

```bash
pip install -r requirements.txt
```

Runtime recommandé:

```text
Python 3.10+
```

Si tu utilises Python 3.8, les versions dans `requirements.txt` sont déjà adaptées:

```text
chromadb==0.5.23
langchain-core==0.2.43
langchain-groq==0.1.10
```

## 5. Démarrage Rapide

### 1. Lancer Kafka et MongoDB

```bash
docker compose up -d kafka mongodb kafka-ui mongo-express
```

Interfaces:

```text
Kafka UI:      http://localhost:8090
Mongo Express: http://localhost:8082
```

### 2. Lancer le pipeline complet

Terminal 1:

```bash
./scripts/run_all.sh
```

Ce script lance:

```text
context builder
decision engine
```

Logs:

```text
logs/context_builder.log
logs/decision_engine.log
```

### 3. Lancer les producers audio/video/location

Terminal 2:

```bash
python -m context_ingestion.producers.run_producers
```

Ce script tourne en boucle. Il va relire régulièrement:

```text
context_ingestion/data/video/frame1.jpg
context_ingestion/data/audio/1.mp3
```

C'est normal si Kafka reçoit plusieurs messages similaires.

## 6. Test Le Plus Simple

Pour tester seulement:

```bash
docker compose up -d kafka mongodb
./scripts/test_decision_engine_consumes_context.sh
```

Ce script:

- charge `.env`
- publie un message de test vers `normalized-context`
- lance le Decision Engine en mode `available-now`
- vérifie les logs suivants:

```text
Kafka message received
Kafka message parsed
Kafka message passes validation
Decision generated
Data written to MongoDB
```

## 7. Rejouer Kafka Vers MongoDB

Si Kafka contient déjà des messages mais MongoDB est vide:

```bash
rm -rf checkpoints/decision_engine
./scripts/replay_normalized_context_to_mongo.sh
```

Ce script utilise un checkpoint temporaire propre:

```text
/tmp/decision-engine-replay-normalized-context
```

Il lit `normalized-context` depuis `earliest` et écrit dans MongoDB.

## 8. Vérifier Kafka

Lister les topics:

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --list
```

Lire `normalized-context`:

```bash
docker exec -i kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic normalized-context \
  --from-beginning \
  --max-messages 5
```

Lire les actions:

```bash
docker exec -i kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic decision.actions \
  --from-beginning \
  --max-messages 5
```

## 9. Vérifier MongoDB

Ouvrir Mongo shell:

```bash
docker exec -it mongodb mongosh "mongodb://admin:admin123@localhost:27017/admin"
```

Puis:

```javascript
use assistant_db

db.raw_context_events.countDocuments()
db.normalized_contexts.countDocuments()
db.decisions_history.countDocuments()
db.user_state.countDocuments()
db.notifications.countDocuments()

db.raw_context_events.find().limit(3).pretty()
db.normalized_contexts.find().limit(3).pretty()
db.decisions_history.find().limit(3).pretty()
```

Dans Mongo Express:

```text
Database: assistant_db
Collections:
- raw_context_events
- normalized_contexts
- user_state
- decisions_history
- notifications
- activities
- meetings
- daily_summaries
```

## 10. Logs À Regarder

Context builder:

```bash
tail -f logs/context_builder.log
```

Tu dois voir:

```text
Raw data stream configured topic=video_stream
Raw data stream configured topic=audio_stream
Raw data stream configured topic=location_stream
Context built
Context published to Kafka
```

Decision Engine:

```bash
tail -f logs/decision_engine.log
```

Tu dois voir:

```text
Decision Engine startup
Building Kafka stream topic=normalized-context
Processing Spark batch
Kafka message received
Kafka message parsed
Kafka message passes validation
Decision generated
Data written to MongoDB
```

## 11. Nettoyer Et Repartir De Zéro

Attention: cette commande supprime Kafka, MongoDB, ChromaDB et les checkpoints locaux.

```bash
docker compose down -v
rm -rf chroma checkpoints logs
mkdir -p chroma checkpoints/context_builder checkpoints/decision_engine logs
docker compose up -d kafka mongodb kafka-ui mongo-express
```

Puis:

```bash
./scripts/test_decision_engine_consumes_context.sh
```

## 12. Problèmes Fréquents

### Kafka reçoit des messages mais MongoDB reste vide

Causes probables:

- Decision Engine a crashé.
- `checkpoints/decision_engine` contient déjà des offsets.
- ChromaDB a un ancien schema incompatible.
- Le message Kafka est invalide.

Solution rapide:

```bash
rm -rf checkpoints/decision_engine
rm -rf chroma
mkdir -p chroma
./scripts/replay_normalized_context_to_mongo.sh
```

Puis lire:

```bash
tail -n 200 logs/decision_engine.log
```

### Erreur ChromaDB: `no such column: collections.topic`

Cause:

```text
Le dossier ./chroma a été créé par une autre version de ChromaDB.
```

Solution:

```bash
rm -rf chroma
mkdir -p chroma
```

Puis relancer.

### Le même message apparaît plusieurs fois dans Kafka

C'est normal si `context_ingestion.producers.run_producers` tourne.
Les producers relisent périodiquement les mêmes fichiers de test.

Arrêter avec `Ctrl+C`.

### Spark ne relit pas les anciens messages

Supprimer le checkpoint du consumer:

```bash
rm -rf checkpoints/decision_engine
```

Ou utiliser:

```bash
./scripts/replay_normalized_context_to_mongo.sh
```

### Mongo Express ne montre rien

Vérifier la bonne database:

```text
assistant_db
```

Pas `admin`.

## 13. Commandes Utiles

Lancer tout:

```bash
./scripts/run_all.sh
```

Lancer seulement le context builder:

```bash
./scripts/run_context_builder.sh
```

Lancer seulement le Decision Engine:

```bash
./scripts/run_decision_engine.sh
```

Publier un message normalisé de test:

```bash
python -m context_ingestion.publish_sample_context
```

Lancer les producers bruts:

```bash
python -m context_ingestion.producers.run_producers
```

Rejouer Kafka vers MongoDB:

```bash
./scripts/replay_normalized_context_to_mongo.sh
```

Test complet minimal:

```bash
./scripts/test_decision_engine_consumes_context.sh
```

## 14. Contrat Pour Backend Et Chatbot

### Backend

Le backend ne doit pas consommer les topics bruts `video_stream`, `audio_stream`, `location_stream`.

Il doit utiliser:

```text
MongoDB assistant_db.*
Kafka decision.actions
```

Endpoints recommandés:

```text
GET /contexts
GET /contexts/{context_id}
GET /decisions
GET /notifications
GET /state/{user_id}
POST /chat
```

### Chatbot

Le chatbot doit poser ses questions au backend.

Exemples de questions supportées:

```text
Qu'est-ce que je fais maintenant ?
Pourquoi cette notification a été générée ?
Quels sont les derniers contextes détectés ?
Résume ma dernière session.
```

Sources:

```text
MongoDB decisions_history
MongoDB normalized_contexts
MongoDB user_state
ChromaDB memory
```

### Frontend

Le frontend peut afficher:

- dernier contexte reçu
- activité détectée
- notifications
- historique des décisions
- état utilisateur
- chat avec le chatbot

## 15. Résumé Des Topics

```text
video_stream          données visuelles brutes analysées
audio_stream          données audio transcrites/analysées
location_stream       localisation simulée
normalized-context    contexte final consommé par Decision Engine
decision.actions      actions publiées par Decision Engine
```

## 16. Résumé Des Collections MongoDB

```text
raw_context_events    messages Kafka reçus
normalized_contexts   contexte interne normalisé
user_state            état courant utilisateur
activities            activités détectées
meetings              réunions détectées
notifications         notifications à envoyer
decisions_history     historique complet des décisions
daily_summaries       résumés journaliers
```

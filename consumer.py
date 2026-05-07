from kafka import KafkaConsumer
import json
import os

consumer = KafkaConsumer(
    os.getenv("CONTEXT_TOPIC", os.getenv("KAFKA_TOPIC", "normalized-context")),
    bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092"),
    auto_offset_reset="earliest",
    value_deserializer=lambda m: json.loads(m.decode("utf-8"))
)

for msg in consumer:
    print(msg.value)

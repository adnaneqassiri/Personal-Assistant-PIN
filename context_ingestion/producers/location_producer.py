import json
import logging
import time
from datetime import datetime, timezone

from kafka import KafkaProducer

from context_ingestion.config import (
    KAFKA_BOOTSTRAP_SERVERS,
    LOCATION_STREAM_TOPIC,
    LOG_LEVEL,
    POLL_INTERVAL_SECONDS,
)


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda value: json.dumps(value).encode("utf-8"),
)

def get_next_boundary_timestamp():
    now = time.time()
    return int(now // POLL_INTERVAL_SECONDS + 1) * POLL_INTERVAL_SECONDS


def wait_until(timestamp):
    delay = timestamp - time.time()
    if delay > 0:
        time.sleep(delay)


def format_timestamp(timestamp):
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).replace(
        microsecond=0
    ).isoformat().replace("+00:00", "")


locations = [
    {
        "latitude": 35.7595,
        "longitude": -5.8340,
        "place_label": "office",
        "zone_type": "work",
    }
]


def main():
    location_index = 0
    next_boundary = get_next_boundary_timestamp()

    while True:
        wait_until(next_boundary)
        loc = locations[location_index % len(locations)]
        data = {
            "source": "gps",
            "timestamp": format_timestamp(next_boundary),
            "latitude": loc["latitude"],
            "longitude": loc["longitude"],
            "place_label": loc["place_label"],
            "zone_type": loc["zone_type"],
        }

        try:
            logger.info("Raw location data received payload=%s", data)
            producer.send(LOCATION_STREAM_TOPIC, data)
            producer.flush()
            logger.info("Location context sent topic=%s", LOCATION_STREAM_TOPIC)
        except Exception as exc:
            logger.exception("Error sending location message: %s", exc)

        location_index += 1
        next_boundary += POLL_INTERVAL_SECONDS


if __name__ == "__main__":
    main()

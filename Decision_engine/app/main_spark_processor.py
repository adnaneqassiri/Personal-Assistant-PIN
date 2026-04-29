import argparse

from Decision_engine.app.bootstrap import build_processor
from Decision_engine.config.settings import get_settings
from Decision_engine.kafka.spark_consumer import SparkKafkaConsumer


def parse_args():
    parser = argparse.ArgumentParser(
        description="Run the Decision Engine Spark Structured Streaming processor."
    )
    parser.add_argument(
        "--master",
        default="local[*]",
        help="Spark master URL. Default: local[*]",
    )
    parser.add_argument(
        "--checkpoint-location",
        default=None,
        help="Optional Spark checkpoint directory.",
    )
    parser.add_argument(
        "--available-now",
        action="store_true",
        help="Process currently available Kafka data and stop.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = get_settings()
    processor = build_processor(settings=settings)
    consumer = SparkKafkaConsumer(
        processor=processor,
        settings=settings,
        master=args.master,
        checkpoint_location=args.checkpoint_location,
        once=args.available_now,
    )
    consumer.run()


if __name__ == "__main__":
    main()

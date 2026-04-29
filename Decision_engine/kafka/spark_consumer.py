import json
import logging
from typing import Any, Dict, Optional

from Decision_engine.config.settings import Settings, get_settings

logger = logging.getLogger(__name__)


def parse_kafka_event(value: Any) -> Dict[str, Any]:
    if isinstance(value, bytes):
        value = value.decode("utf-8")

    if isinstance(value, str):
        payload = json.loads(value)
    else:
        payload = value

    if not isinstance(payload, dict):
        raise ValueError("Kafka message must contain a single JSON object event")

    return payload


class SparkKafkaConsumer(object):
    def __init__(
        self,
        processor,
        settings: Optional[Settings] = None,
        spark=None,
        master: str = "local[*]",
        checkpoint_location: Optional[str] = None,
        once: bool = False,
    ):
        self.processor = processor
        self.settings = settings or get_settings()
        self.spark = spark
        self.master = master
        self.checkpoint_location = checkpoint_location
        self.once = once

    def build_spark_session(self):
        if self.spark is not None:
            return self.spark

        try:
            from pyspark.sql import SparkSession
        except ImportError as exc:
            raise RuntimeError(
                "pyspark is required for SparkKafkaConsumer. "
                "Install it with 'pip install pyspark'."
            ) from exc

        spark = (
            SparkSession.builder.appName("DecisionEngineSparkProcessor")
            .master(self.master)
            .config(
                "spark.jars.packages",
                "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1",
            )
            .getOrCreate()
        )
        spark.sparkContext.setLogLevel("WARN")
        self.spark = spark
        return spark

    def build_stream(self, spark):
        logger.info(
            "Building Kafka stream topic=%s bootstrap_servers=%s",
            self.settings.kafka_source_topic,
            self.settings.kafka_bootstrap_servers,
        )
        raw_df = (
            spark.readStream.format("kafka")
            .option("kafka.bootstrap.servers", self.settings.kafka_bootstrap_servers)
            .option("subscribe", self.settings.kafka_source_topic)
            .option("startingOffsets", "latest")
            .load()
        )
        return raw_df.selectExpr("CAST(value AS STRING) AS value")

    def process_batch(self, batch_df, batch_id: int) -> None:
        rows = batch_df.collect()
        logger.info("Processing Spark batch batch_id=%s message_count=%s", batch_id, len(rows))
        for index, row in enumerate(rows, start=1):
            value = row["value"] if isinstance(row, dict) else row.value
            try:
                payload = parse_kafka_event(value)
            except Exception:
                logger.exception(
                    "Failed to parse Kafka message batch_id=%s row_number=%s",
                    batch_id,
                    index,
                )
                raise

            context_id = payload.get("context_id")
            user_id = payload.get("user_id")
            logger.info(
                "Processing Kafka message batch_id=%s row_number=%s context_id=%s user_id=%s",
                batch_id,
                index,
                context_id,
                user_id,
            )
            result = self.processor.process_event(payload)
            logger.info(
                "Processor result batch_id=%s row_number=%s context_id=%s status=%s significant=%s decision_id=%s error=%s",
                batch_id,
                index,
                getattr(result, "context_id", context_id),
                getattr(result, "status", None),
                getattr(result, "significant", None),
                getattr(result, "decision_id", None),
                getattr(result, "error", None),
            )

    def run(self) -> None:
        spark = self.build_spark_session()
        stream = self.build_stream(spark)
        writer = stream.writeStream.foreachBatch(self.process_batch).outputMode("append")

        if self.checkpoint_location:
            writer = writer.option("checkpointLocation", self.checkpoint_location)

        if self.once:
            writer = writer.trigger(availableNow=True)

        logger.info(
            "Starting Spark streaming source_topic=%s actions_topic=%s checkpoint=%s once=%s",
            self.settings.kafka_source_topic,
            self.settings.kafka_actions_topic,
            self.checkpoint_location,
            self.once,
        )
        query = writer.start()
        query.awaitTermination()

        if query.exception():
            raise query.exception()

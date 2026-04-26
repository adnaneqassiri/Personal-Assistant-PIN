import argparse
import json
import os
from typing import Any, Dict, Optional

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, explode, from_json
from pyspark.sql.types import (
    ArrayType,
    DoubleType,
    StringType,
    StructField,
    StructType,
)

from decision_engine import decide_activity


CONTEXT_SCHEMA = ArrayType(
    StructType(
        [
            StructField("context_id", StringType()),
            StructField("user_id", StringType()),
            StructField("created_at", StringType()),
            StructField(
                "vision",
                StructType(
                    [
                        StructField("timestamp", StringType()),
                        StructField("objects", ArrayType(StringType())),
                        StructField("scene_description", StringType()),
                        StructField("confidence", DoubleType()),
                        StructField("media_ref", StringType()),
                    ]
                ),
            ),
            StructField(
                "audio",
                StructType(
                    [
                        StructField("timestamp", StringType()),
                        StructField("transcript", StringType()),
                        StructField("keywords", ArrayType(StringType())),
                        StructField("confidence", DoubleType()),
                        StructField("audio_ref", StringType()),
                    ]
                ),
            ),
            StructField(
                "location",
                StructType(
                    [
                        StructField("timestamp", StringType()),
                        StructField("latitude", DoubleType()),
                        StructField("longitude", DoubleType()),
                        StructField("place_label", StringType()),
                        StructField("zone_type", StringType()),
                    ]
                ),
            ),
        ]
    )
)


def build_spark(master: str) -> SparkSession:
    spark = (
        SparkSession.builder.appName("DecisionEngineKafkaRunner")
        .master(master)
        .config(
            "spark.jars.packages",
            "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1",
        )
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    return spark


def build_context_stream(spark: SparkSession, bootstrap_servers: str, topic: str):
    raw_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", bootstrap_servers)
        .option("subscribe", topic)
        .option("startingOffsets", "earliest")
        .load()
    )

    return (
        raw_df.selectExpr("CAST(value AS STRING) AS value")
        .select(from_json(col("value"), CONTEXT_SCHEMA).alias("data"))
        .select(explode(col("data")).alias("context"))
    )


def print_decision(context: Dict[str, Any], batch_id: int, row_number: int) -> None:
    context_id = context.get("context_id", "unknown")
    print(
        f"\n===== BATCH {batch_id} | ROW {row_number} | CONTEXT {context_id} =====",
        flush=True,
    )
    print("Context input:", flush=True)
    print(json.dumps(context, indent=2, ensure_ascii=False), flush=True)

    decision = decide_activity(context)

    print("\nDecision engine output:", flush=True)
    print(json.dumps(decision, indent=2, ensure_ascii=False), flush=True)


def run(
    bootstrap_servers: str,
    topic: str,
    master: str,
    checkpoint_location: Optional[str],
    once: bool,
) -> None:
    spark = build_spark(master)

    def process_batch(batch_df, batch_id: int) -> None:
        rows = batch_df.collect()
        print(f"\n--- batch_id={batch_id} | rows={len(rows)} ---", flush=True)

        for row_number, row in enumerate(rows, start=1):
            try:
                context = row["context"].asDict(recursive=True)
                print_decision(context, batch_id, row_number)
            except Exception as exc:
                print(
                    f"[ERROR] batch_id={batch_id} row={row_number}: {exc}",
                    flush=True,
                )
                raise

    try:
        parsed_df = build_context_stream(spark, bootstrap_servers, topic)
        writer = parsed_df.writeStream.foreachBatch(process_batch).outputMode("append")

        if checkpoint_location:
            writer = writer.option("checkpointLocation", checkpoint_location)

        if once:
            writer = writer.trigger(availableNow=True)

        query = writer.start()
        print(
            f"Reading Kafka topic '{topic}' from '{bootstrap_servers}'.",
            flush=True,
        )
        print("Waiting for decision engine output...", flush=True)

        query.awaitTermination()

        if query.exception():
            raise query.exception()
    finally:
        spark.stop()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read contextBuilder Kafka topic data and print decision engine output."
    )
    parser.add_argument(
        "--bootstrap-servers",
        default=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092"),
        help="Kafka bootstrap servers. Default: localhost:29092",
    )
    parser.add_argument(
        "--topic",
        default=os.getenv("KAFKA_TOPIC", "contextBuilder"),
        help="Kafka topic to read. Default: contextBuilder",
    )
    parser.add_argument(
        "--master",
        default=os.getenv("SPARK_MASTER", "local[*]"),
        help="Spark master URL. Default: local[*]",
    )
    parser.add_argument(
        "--checkpoint-location",
        default=os.getenv("SPARK_CHECKPOINT_LOCATION"),
        help="Optional Spark streaming checkpoint directory.",
    )
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Keep listening for new Kafka data instead of processing available data and exiting.",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(
        bootstrap_servers=args.bootstrap_servers,
        topic=args.topic,
        master=args.master,
        checkpoint_location=args.checkpoint_location,
        once=not args.continuous,
    )

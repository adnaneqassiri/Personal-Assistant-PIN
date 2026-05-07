import json
import logging
from typing import Any, Dict

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    coalesce,
    col,
    current_timestamp,
    date_format,
    expr,
    first,
    from_json,
    lit,
    struct,
    to_timestamp,
)
from pyspark.sql.types import ArrayType, DoubleType, StringType, StructField, StructType

from context_ingestion.config import (
    AUDIO_STREAM_TOPIC,
    CONTEXT_BUCKET_SECONDS,
    CONTEXT_BUILDER_CHECKPOINT_LOCATION,
    CONTEXT_TOPIC,
    CONTEXT_USER_ID,
    CONTEXT_WATERMARK_DELAY,
    KAFKA_BOOTSTRAP_SERVERS,
    LOCATION_STREAM_TOPIC,
    LOG_LEVEL,
    VIDEO_STREAM_TOPIC,
)
from context_ingestion.kafka.context_producer import ContextProducer
from context_ingestion.kafka.topics import ensure_context_ingestion_topics


logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


VISION_SCHEMA = StructType(
    [
        StructField("source", StringType(), True),
        StructField("timestamp", StringType(), True),
        StructField("objects", ArrayType(StringType()), True),
        StructField("scene_description", StringType(), True),
        StructField("confidence", DoubleType(), True),
        StructField("media_ref", StringType(), True),
    ]
)

SPEECH_SCHEMA = StructType(
    [
        StructField("source", StringType(), True),
        StructField("timestamp", StringType(), True),
        StructField("transcript", StringType(), True),
        StructField("keywords", ArrayType(StringType()), True),
        StructField("confidence", DoubleType(), True),
        StructField("audio_ref", StringType(), True),
    ]
)

GPS_SCHEMA = StructType(
    [
        StructField("source", StringType(), True),
        StructField("timestamp", StringType(), True),
        StructField("latitude", DoubleType(), True),
        StructField("longitude", DoubleType(), True),
        StructField("place_label", StringType(), True),
        StructField("zone_type", StringType(), True),
    ]
)


def build_spark_session() -> SparkSession:
    spark = (
        SparkSession.builder.appName("ContextIngestionBuilder")
        .config(
            "spark.jars.packages",
            "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1",
        )
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("WARN")
    return spark


def read_kafka_topic(spark: SparkSession, topic_name: str, schema: StructType):
    logger.info(
        "Raw data stream configured topic=%s bootstrap_servers=%s",
        topic_name,
        KAFKA_BOOTSTRAP_SERVERS,
    )
    raw_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
        .option("subscribe", topic_name)
        .option("startingOffsets", "latest")
        .load()
    )

    return raw_df.select(
        from_json(col("value").cast("string"), schema).alias("data")
    ).select("data.*")


def add_bucket_columns(df):
    return (
        df.withColumn(
            "event_time",
            to_timestamp(col("timestamp"), "yyyy-MM-dd'T'HH:mm:ss"),
        )
        .withColumn(
            "bucket_ts",
            expr(
                f"CAST(UNIX_TIMESTAMP(event_time) - "
                f"(UNIX_TIMESTAMP(event_time) % {CONTEXT_BUCKET_SECONDS}) AS BIGINT)"
            ),
        )
        .withWatermark("event_time", CONTEXT_WATERMARK_DELAY)
    )


def build_context_stream(spark: SparkSession):
    vision_df = add_bucket_columns(
        read_kafka_topic(spark, VIDEO_STREAM_TOPIC, VISION_SCHEMA)
    ).select(
        col("bucket_ts"),
        col("event_time"),
        col("timestamp").alias("vision_timestamp"),
        col("objects").alias("vision_objects"),
        col("scene_description").alias("vision_scene_description"),
        col("confidence").alias("vision_confidence"),
        col("media_ref").alias("vision_media_ref"),
        lit(None).cast(StringType()).alias("audio_timestamp"),
        lit(None).cast(StringType()).alias("audio_transcript"),
        lit(None).cast(ArrayType(StringType())).alias("audio_keywords"),
        lit(None).cast(DoubleType()).alias("audio_confidence"),
        lit(None).cast(StringType()).alias("audio_ref"),
        lit(None).cast(StringType()).alias("location_timestamp"),
        lit(None).cast(DoubleType()).alias("location_latitude"),
        lit(None).cast(DoubleType()).alias("location_longitude"),
        lit(None).cast(StringType()).alias("location_label"),
        lit(None).cast(StringType()).alias("location_zone_type"),
    )

    speech_df = add_bucket_columns(
        read_kafka_topic(spark, AUDIO_STREAM_TOPIC, SPEECH_SCHEMA)
    ).select(
        col("bucket_ts"),
        col("event_time"),
        lit(None).cast(StringType()).alias("vision_timestamp"),
        lit(None).cast(ArrayType(StringType())).alias("vision_objects"),
        lit(None).cast(StringType()).alias("vision_scene_description"),
        lit(None).cast(DoubleType()).alias("vision_confidence"),
        lit(None).cast(StringType()).alias("vision_media_ref"),
        col("timestamp").alias("audio_timestamp"),
        col("transcript").alias("audio_transcript"),
        col("keywords").alias("audio_keywords"),
        col("confidence").alias("audio_confidence"),
        col("audio_ref").alias("audio_ref"),
        lit(None).cast(StringType()).alias("location_timestamp"),
        lit(None).cast(DoubleType()).alias("location_latitude"),
        lit(None).cast(DoubleType()).alias("location_longitude"),
        lit(None).cast(StringType()).alias("location_label"),
        lit(None).cast(StringType()).alias("location_zone_type"),
    )

    gps_df = add_bucket_columns(
        read_kafka_topic(spark, LOCATION_STREAM_TOPIC, GPS_SCHEMA)
    ).select(
        col("bucket_ts"),
        col("event_time"),
        lit(None).cast(StringType()).alias("vision_timestamp"),
        lit(None).cast(ArrayType(StringType())).alias("vision_objects"),
        lit(None).cast(StringType()).alias("vision_scene_description"),
        lit(None).cast(DoubleType()).alias("vision_confidence"),
        lit(None).cast(StringType()).alias("vision_media_ref"),
        lit(None).cast(StringType()).alias("audio_timestamp"),
        lit(None).cast(StringType()).alias("audio_transcript"),
        lit(None).cast(ArrayType(StringType())).alias("audio_keywords"),
        lit(None).cast(DoubleType()).alias("audio_confidence"),
        lit(None).cast(StringType()).alias("audio_ref"),
        col("timestamp").alias("location_timestamp"),
        col("latitude").alias("location_latitude"),
        col("longitude").alias("location_longitude"),
        coalesce(col("place_label"), col("zone_type")).alias("location_label"),
        col("zone_type").alias("location_zone_type"),
    )

    merged_df = vision_df.unionByName(speech_df).unionByName(gps_df)

    return (
        merged_df.groupBy("bucket_ts")
        .agg(
            first("vision_timestamp", ignorenulls=True).alias("vision_timestamp"),
            first("vision_objects", ignorenulls=True).alias("vision_objects"),
            first("vision_scene_description", ignorenulls=True).alias(
                "scene_description"
            ),
            first("vision_confidence", ignorenulls=True).alias("vision_confidence"),
            first("vision_media_ref", ignorenulls=True).alias("vision_media_ref"),
            first("audio_timestamp", ignorenulls=True).alias("audio_timestamp"),
            first("audio_transcript", ignorenulls=True).alias("audio_transcript"),
            first("audio_keywords", ignorenulls=True).alias("audio_keywords"),
            first("audio_confidence", ignorenulls=True).alias("audio_confidence"),
            first("audio_ref", ignorenulls=True).alias("audio_ref"),
            first("location_timestamp", ignorenulls=True).alias("location_timestamp"),
            first("location_latitude", ignorenulls=True).alias("latitude"),
            first("location_longitude", ignorenulls=True).alias("longitude"),
            first("location_label", ignorenulls=True).alias("label"),
            first("location_zone_type", ignorenulls=True).alias("zone_type"),
        )
        .select(
            expr("concat('ctx_', lpad(cast(bucket_ts as string), 12, '0'))").alias(
                "context_id"
            ),
            lit(CONTEXT_USER_ID).alias("user_id"),
            date_format(current_timestamp(), "yyyy-MM-dd'T'HH:mm:ss").alias(
                "created_at"
            ),
            coalesce(
                col("vision_timestamp"),
                col("audio_timestamp"),
                col("location_timestamp"),
                date_format(current_timestamp(), "yyyy-MM-dd'T'HH:mm:ss"),
            ).alias("timestamp"),
            coalesce(col("scene_description"), lit("")).alias("scene_description"),
            coalesce(col("audio_transcript"), lit("")).alias("audio_transcript"),
            struct(
                col("latitude").alias("latitude"),
                col("longitude").alias("longitude"),
                coalesce(col("label"), lit("")).alias("label"),
                coalesce(col("label"), lit("")).alias("place_label"),
                col("zone_type").alias("zone_type"),
            ).alias("location"),
            lit("context_ingestion").alias("source"),
            struct(
                col("vision_timestamp").alias("timestamp"),
                coalesce(
                    col("vision_objects"),
                    expr("array()").cast(ArrayType(StringType())),
                ).alias("objects"),
                coalesce(col("scene_description"), lit("")).alias("scene_description"),
                col("vision_confidence").alias("confidence"),
                col("vision_media_ref").alias("media_ref"),
            ).alias("vision"),
            struct(
                col("audio_timestamp").alias("timestamp"),
                coalesce(col("audio_transcript"), lit("")).alias("transcript"),
                coalesce(
                    col("audio_keywords"),
                    expr("array()").cast(ArrayType(StringType())),
                ).alias("keywords"),
                col("audio_confidence").alias("confidence"),
                col("audio_ref").alias("audio_ref"),
            ).alias("audio"),
        )
    )


def _row_to_context(row: Any) -> Dict[str, Any]:
    return json.loads(row.asDict(recursive=True)["value"])


def publish_context_batch(batch_df, batch_id: int) -> None:
    messages_df = batch_df.selectExpr("to_json(struct(*)) AS value")
    rows = messages_df.collect()
    logger.info("Context built batch_id=%s count=%s", batch_id, len(rows))

    if not rows:
        return

    producer = ContextProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        topic=CONTEXT_TOPIC,
    )
    try:
        for row in rows:
            context_message = _row_to_context(row)
            logger.info("Context built payload=%s", context_message)
            producer.publish(context_message)
    finally:
        producer.close()


def main() -> None:
    ensure_context_ingestion_topics()
    spark = build_spark_session()
    context_stream = build_context_stream(spark)
    query = (
        context_stream.writeStream.foreachBatch(publish_context_batch)
        .outputMode("update")
        .option("checkpointLocation", CONTEXT_BUILDER_CHECKPOINT_LOCATION)
        .start()
    )

    logger.info(
        "Context builder started bootstrap_servers=%s context_topic=%s checkpoint=%s",
        KAFKA_BOOTSTRAP_SERVERS,
        CONTEXT_TOPIC,
        CONTEXT_BUILDER_CHECKPOINT_LOCATION,
    )
    query.awaitTermination()


if __name__ == "__main__":
    main()

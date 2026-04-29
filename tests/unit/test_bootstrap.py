import unittest

from Decision_engine.app.bootstrap import build_processor
from Decision_engine.config.settings import Settings
from Decision_engine.kafka.spark_consumer import SparkKafkaConsumer, parse_kafka_event


class FakePort(object):
    pass


class FakeProcessor(object):
    def __init__(self):
        self.payloads = []

    def process_event(self, payload):
        self.payloads.append(payload)


class FakeRow(object):
    def __init__(self, value):
        self.value = value


class FakeBatchDataFrame(object):
    def __init__(self, rows):
        self.rows = rows

    def collect(self):
        return self.rows


class BootstrapTest(unittest.TestCase):
    def test_build_processor_uses_injected_ports(self):
        storage = FakePort()
        llm_client = FakePort()
        vector_store = FakePort()
        notification_producer = FakePort()

        processor = build_processor(
            settings=Settings(),
            storage=storage,
            llm_client=llm_client,
            vector_store=vector_store,
            notification_producer=notification_producer,
        )

        self.assertIs(processor.storage, storage)
        self.assertIs(processor.llm_client, llm_client)
        self.assertIs(processor.vector_store, vector_store)
        self.assertIs(processor.notification_producer, notification_producer)

    def test_parse_kafka_event_accepts_single_json_object(self):
        payload = parse_kafka_event('{"context_id": "ctx_001", "user_id": "user_001"}')

        self.assertEqual(payload["context_id"], "ctx_001")
        self.assertEqual(payload["user_id"], "user_001")

    def test_parse_kafka_event_rejects_list_payload(self):
        with self.assertRaises(ValueError):
            parse_kafka_event('[{"context_id": "ctx_001"}]')

    def test_process_batch_calls_processor_once_per_message(self):
        processor = FakeProcessor()
        consumer = SparkKafkaConsumer(
            processor=processor,
            settings=Settings(),
        )
        batch_df = FakeBatchDataFrame(
            [
                FakeRow('{"context_id": "ctx_001", "user_id": "user_001"}'),
                {"value": '{"context_id": "ctx_002", "user_id": "user_001"}'},
            ]
        )

        consumer.process_batch(batch_df, batch_id=1)

        self.assertEqual(len(processor.payloads), 2)
        self.assertEqual(processor.payloads[0]["context_id"], "ctx_001")
        self.assertEqual(processor.payloads[1]["context_id"], "ctx_002")


if __name__ == "__main__":
    unittest.main()

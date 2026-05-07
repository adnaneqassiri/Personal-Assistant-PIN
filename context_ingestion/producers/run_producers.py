import multiprocessing
import subprocess
import sys


PRODUCER_MODULES = {
    "video": "context_ingestion.producers.video_producer",
    "audio": "context_ingestion.producers.audio_producer",
    "location": "context_ingestion.producers.location_producer",
}


def run_module(module_name):
    subprocess.run([sys.executable, "-m", module_name], check=False)


def run_video():
    run_module(PRODUCER_MODULES["video"])


def run_audio():
    run_module(PRODUCER_MODULES["audio"])


def run_location():
    run_module(PRODUCER_MODULES["location"])


if __name__ == "__main__":
    processes = [
        multiprocessing.Process(target=run_video),
        multiprocessing.Process(target=run_audio),
        multiprocessing.Process(target=run_location),
    ]

    for process in processes:
        process.start()

    for process in processes:
        process.join()

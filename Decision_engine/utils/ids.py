from uuid import uuid4


def generate_id(prefix: str) -> str:
    return "%s_%s" % (prefix, uuid4().hex)

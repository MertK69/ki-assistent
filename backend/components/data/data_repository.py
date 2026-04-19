import json
from pathlib import Path

_data_dir = Path(__file__).parent.parent.parent / "data"


def _load_json(filename: str):
    with open(_data_dir / filename, encoding="utf-8") as f:
        return json.load(f)


STARTER_SNIPPETS = _load_json("snippets.json")
CONCEPT_LIBRARY = _load_json("concepts.json")
LEARNING_TASKS = _load_json("tasks.json")

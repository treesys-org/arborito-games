"""Load lessons from exported .arborito archives."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .quiz_v2 import (
    clean_lesson_text,
    load_arborito_archive as _load_archive,
    parse_all_challenges_from_content,
)


def load_arborito_archive(path: str | Path, lang: str = "ES") -> list[dict[str, Any]]:
    """Walk an `.arborito` ZIP and return its leaf/exam lessons in order.

    The archive's folder layout is the source of truth (no `tree:` block in
    the manifest), so we just reconstruct the in-memory tree and iterate
    through every leaf / exam node, preserving the on-disk ordering.
    """
    data = _load_archive(path)
    languages = (data.get("tree") or {}).get("languages") or {}
    lang_key = lang.upper()
    root = languages.get(lang_key) or languages.get("ES") or next(iter(languages.values()), None)
    if not root:
        raise ValueError(f"No language tree in {path}")

    lessons: list[dict[str, Any]] = []

    def walk(node: dict[str, Any]) -> None:
        ntype = node.get("type")
        if ntype in ("leaf", "exam"):
            raw = node.get("content") or ""
            challenges = parse_all_challenges_from_content(raw)
            lesson: dict[str, Any] = {
                "id": node["id"],
                "title": node.get("name") or node["id"],
                "text": clean_lesson_text(raw),
                "raw": raw,
            }
            if challenges:
                lesson["challenge"] = challenges[0]
                lesson["challenges"] = challenges
            lessons.append(lesson)
        for child in node.get("children") or []:
            if isinstance(child, dict):
                walk(child)

    walk(root)
    return lessons

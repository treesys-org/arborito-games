"""Quiz V2 parsing, modality helpers, and static quiz/match-pairs helpers.

Mirrors the canonical schema + modality helpers in
`arborito/src/features/learning/quiz-v2-schema.js`. Keep both files in sync
when the authoring schema or modality contract changes.

Authoring format (single fenced block per quiz):

    @quiz
    concept: GNU/Linux
    definition: {Sistema operativo} libre basado en el {kernel} Linux
    question: ¿Qué es GNU/Linux?
    answer: Un sistema operativo de código abierto
    modes: cloze,multiple,recall,chips
    traps:
    - Un editor de texto
    - Una base de datos relacional
    steps:
    - Step 1
    - Step 2
    @/quiz
"""

from __future__ import annotations

import random
import re
from typing import Any, Optional


QUIZ_MODE_MULTIPLE = "multiple"
QUIZ_MODE_RECALL = "recall"
QUIZ_MODE_CLOZE = "cloze"
QUIZ_MODE_CHIPS = "chips"
QUIZ_MODE_STEPS = "steps"

ALL_QUIZ_MODES = [
    QUIZ_MODE_MULTIPLE,
    QUIZ_MODE_RECALL,
    QUIZ_MODE_CLOZE,
    QUIZ_MODE_CHIPS,
    QUIZ_MODE_STEPS,
]

_QUIZ_OPEN = re.compile(r"^@quiz\s*$", re.IGNORECASE)
_QUIZ_CLOSE = re.compile(r"^@/quiz\s*$", re.IGNORECASE)
_TRUTHY = {"1", "true", "yes", "si", "sí", "on", "y"}
_KEY_MAP = {
    "concept": "core_concept",
    "definition": "short_definition",
    "question": "main_question",
    "answer": "correct_answer",
}


def new_challenge() -> dict[str, Any]:
    return {
        "core_concept": "",
        "short_definition": "",
        "main_question": "",
        "correct_answer": "",
        "traps": [],
        "cloze_indices": [],
        "steps": [],
        "modes": [],
        "answer_mode": "chips",
        "skip_multiple": False,
        "skip_ordering": False,
    }


def parse_inline_cloze(raw: str) -> tuple[str, list[int]]:
    """Strip `{phrase}` markers from a definition string.

    Returns ``(plain_text, word_indices)`` where ``word_indices`` lists the
    positions (0-based, whitespace-split) of the words that were enclosed in
    braces. Multi-word phrases like ``{Sistema operativo}`` produce two
    consecutive indices. Unmatched braces leave the input untouched.
    """
    s = raw or ""
    if "{" not in s or "}" not in s:
        return s.strip(), []
    plain_chars: list[str] = []
    masked: list[bool] = []
    inside = False
    for ch in s:
        if ch == "{" and not inside:
            inside = True
            continue
        if ch == "}" and inside:
            inside = False
            continue
        plain_chars.append(ch)
        masked.append(inside)
    if inside:
        return s.strip(), []
    plain = "".join(plain_chars)
    indices: list[int] = []
    for w_idx, m in enumerate(re.finditer(r"\S+", plain)):
        if any(masked[k] for k in range(m.start(), m.end())):
            indices.append(w_idx)
    return re.sub(r"\s+", " ", plain).strip(), indices


def parse_quiz_block(body_lines: list[str]) -> dict[str, Any]:
    """Parse the body lines (between @quiz/@/quiz) into a challenge dict."""
    c = new_challenge()
    list_key: Optional[str] = None
    for raw in body_lines:
        line = raw.rstrip()
        if not line.strip():
            continue
        m_item = re.match(r"^\s*-\s+(.*)$", line)
        if m_item and list_key:
            v = m_item.group(1).strip()
            if v:
                c[list_key].append(v)
            continue
        kv = re.match(r"^\s*([a-zA-Z_]+)\s*:\s*(.*)$", line)
        if not kv:
            list_key = None
            continue
        key = kv.group(1).lower()
        val = kv.group(2).strip()
        list_key = None
        if key == "definition":
            text, indices = parse_inline_cloze(val)
            c["short_definition"] = text
            if indices:
                c["cloze_indices"] = indices
            continue
        if key in _KEY_MAP:
            c[_KEY_MAP[key]] = val
            continue
        if key == "modes":
            c["modes"] = [m for m in re.split(r"[,|\s]+", val) if m in ALL_QUIZ_MODES]
            continue
        if key in ("traps", "steps"):
            list_key = key
            if val:
                c[key].append(val)
            continue
        if key == "skip_multiple":
            c["skip_multiple"] = val.lower() in _TRUTHY
            continue
        if key == "skip_ordering":
            c["skip_ordering"] = val.lower() in _TRUTHY
        # Unknown keys are silently ignored to keep the format extensible.
    if len(c["steps"]) >= 2:
        c["answer_mode"] = "steps"
    return c


def is_challenge_complete(challenge: dict[str, Any]) -> bool:
    cc = str(challenge.get("core_concept") or "").strip()
    sd = str(challenge.get("short_definition") or "").strip()
    ca = str(challenge.get("correct_answer") or "").strip()
    if cc and sd and ca:
        return True
    required = ["core_concept", "short_definition", "main_question", "correct_answer"]
    if not all(str(challenge.get(f) or "").strip() for f in required):
        return False
    return len(challenge.get("traps") or []) >= 1


_ORDER_PREFIX = re.compile(r"^\s*(\d+)\s*-\s*(.+?)\s*$")
_INFO_OPEN_RE = re.compile(r"^@info\s*$")
_INFO_CLOSE_RE = re.compile(r"^@/info\s*$")
_INFO_KEYS = {"title", "icon", "description", "exam", "discussion", "tags"}
_FLAG_KEYS = {"exam"}
_TRUTHY = {"yes", "true", "on", "1"}


def _strip_order_prefix(name: str) -> tuple[int | None, str]:
    m = _ORDER_PREFIX.match(name or "")
    if m:
        return int(m.group(1)), m.group(2).strip()
    return None, (name or "").strip()


def _slugify(s: str) -> str:
    t = re.sub(r"[^A-Za-z0-9]+", "-", (s or "").lower()).strip("-")
    return t or "node"


def _parse_info_line(line: str) -> tuple[str, Any] | None:
    """Parse a `key: value` line inside an `@info` block."""
    s = line.strip()
    if not s:
        return None
    colon = s.find(":")
    if colon < 0:
        return None
    key = s[:colon].strip().lower()
    raw = s[colon + 1 :].strip()
    if key not in _INFO_KEYS:
        return None
    if key == "tags":
        return key, [t.strip() for t in raw.split(",") if t.strip()]
    if key in _FLAG_KEYS:
        return key, raw.lower() in _TRUTHY
    return key, raw


def _parse_leaf_header(text: str) -> dict[str, Any]:
    """Parse the optional leading `@info … @/info` block of a leaf .md and
    return the recognised properties as a dict. The block must come first
    (only blank lines may precede it). When the block is absent, an empty
    dict is returned and the whole file is body content."""
    meta: dict[str, Any] = {}
    lines = (text or "").splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i >= len(lines) or not _INFO_OPEN_RE.match(lines[i].strip()):
        return meta
    i += 1
    while i < len(lines) and not _INFO_CLOSE_RE.match(lines[i].strip()):
        pair = _parse_info_line(lines[i])
        if pair is not None:
            meta[pair[0]] = pair[1]
        i += 1
    return meta


def _parse_module_readme(text: str) -> tuple[dict[str, Any], str]:
    """Parse optional module README.md — leading @info block + markdown body."""
    lines = (text or "").splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    meta: dict[str, Any] = {}
    if i < len(lines) and _INFO_OPEN_RE.match(lines[i].strip()):
        i += 1
        while i < len(lines) and not _INFO_CLOSE_RE.match(lines[i].strip()):
            pair = _parse_info_line(lines[i])
            if pair is not None:
                meta[pair[0]] = pair[1]
            i += 1
        if i < len(lines):
            i += 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    body = "\n".join(lines[i:]).strip()
    return meta, body


def load_arborito_archive(path: Any) -> dict[str, Any]:
    """Load a `.arborito` ZIP into the same in-memory shape the GUI uses.

    The archive's folder structure IS the tree: ``manifest.json`` holds only
    course-level metadata and the hierarchy is reconstructed by walking
    ``lessons/<LANG>/<NN folder>/…/<NN leaf>.md`` (folders may nest to any
    depth). Titles come from the ``NN - Name`` prefix in folder/file names;
    ``@info`` with ``title:`` only when the name cannot carry the full title
    (e.g. colons). Optional ``README.md`` in a module folder, or ``files/README.md``
    for the course. Bilingual courses use parallel ``lessons/ES/`` and
    ``lessons/EN/`` trees — same position links translations.
    The returned dict has the standard shape ``{ magic, version, meta, tree, files? }``
    with each leaf carrying its body in ``content``.
    """
    import json as _json
    import zipfile as _zipfile
    from pathlib import Path as _Path

    p = _Path(path)
    if p.read_bytes()[:4] != b"PK\x03\x04":
        raise ValueError(f"Not a valid .arborito archive (expected ZIP): {p}")

    with _zipfile.ZipFile(p) as zf:
        manifest = _json.loads(zf.read("manifest.json").decode("utf-8"))
        if manifest.get("magic") != "ARBORITO_ARCHIVE":
            raise ValueError(f"Archive manifest has wrong magic in {p}")
        meta = manifest.get("meta") or {}
        if not isinstance(meta, dict):
            raise ValueError(f"Archive manifest missing meta in {p}")

        entries: dict[str, bytes] = {}
        files: dict[str, str] = {}
        for info in zf.infolist():
            if info.is_dir():
                continue
            if info.filename.startswith("files/"):
                files[info.filename[len("files/"):]] = zf.read(info.filename).decode("utf-8")
            elif info.filename != "manifest.json":
                entries[info.filename] = zf.read(info.filename)

        languages = _reconstruct_languages(entries, meta)

        result: dict[str, Any] = {
            "magic": manifest["magic"],
            "version": manifest.get("version", 1),
            "meta": meta,
            "tree": {
                "generatedAt": meta.get("exportedAt", ""),
                "universeId": meta.get("id", ""),
                "universeName": meta.get("name", ""),
                "languages": languages,
            },
        }
        if files:
            result["files"] = files
        return result


def _natural_key(s: str) -> tuple[int, str]:
    """Sort by leading numeric prefix first, then case-folded name."""
    m = _ORDER_PREFIX.match(s)
    if m:
        return (int(m.group(1)), m.group(2).casefold())
    return (10**9, (s or "").casefold())


def _reconstruct_languages(
    entries: dict[str, bytes], course_meta: dict[str, Any]
) -> dict[str, Any]:
    """Group ``lessons/<LANG>/...`` entries by language and build each tree."""
    by_lang: dict[str, dict[str, bytes]] = {}
    for path, data in entries.items():
        if not path.startswith("lessons/"):
            continue
        rest = path[len("lessons/"):]
        slash = rest.find("/")
        if slash < 0:
            continue
        lang = rest[:slash]
        relative = rest[slash + 1 :]
        by_lang.setdefault(lang, {})[relative] = data

    out: dict[str, Any] = {}
    for lang, lang_entries in by_lang.items():
        out[lang] = _build_lang_root(lang, lang_entries, course_meta)
    return out


def _build_lang_root(
    lang: str, lang_entries: dict[str, bytes], course_meta: dict[str, Any]
) -> dict[str, Any]:
    universe_id = course_meta.get("id") or "tree"
    course_name = course_meta.get("name") or lang
    course_icon = course_meta.get("icon") or "🌳"
    course_description = course_meta.get("description") or ""

    root_meta: dict[str, Any] = {}
    root_md = lang_entries.get("_root.md")
    if root_md:
        root_meta = _parse_leaf_header(root_md.decode("utf-8"))

    root_name = root_meta.get("title") or course_name
    root_id = f"{universe_id}-{lang.lower()}-root"

    children = _collect_children(
        relative_prefix="",
        lang_entries=lang_entries,
        lang=lang,
        parent_id=root_id,
        parent_path=root_name,
    )

    return {
        "id": root_id,
        "name": root_name,
        "type": "root",
        "expanded": True,
        "icon": root_meta.get("icon") or course_icon,
        "description": root_meta.get("description") or course_description,
        "path": root_name,
        "children": children,
    }


def _collect_children(
    *,
    relative_prefix: str,
    lang_entries: dict[str, bytes],
    lang: str,
    parent_id: str,
    parent_path: str,
) -> list[dict[str, Any]]:
    direct: dict[str, dict[str, Any]] = {}
    for rel, _ in lang_entries.items():
        if relative_prefix and not rel.startswith(relative_prefix):
            continue
        tail = rel[len(relative_prefix):]
        if not tail:
            continue
        slash = tail.find("/")
        if slash < 0:
            if tail.lower() == "readme.md" or not tail.lower().endswith(".md"):
                continue
            direct.setdefault(tail, {"kind": "file", "name": tail})
        else:
            dir_name = tail[:slash]
            if dir_name.startswith("_"):
                continue
            direct.setdefault(dir_name, {"kind": "dir", "name": dir_name})

    sorted_children = sorted(direct.values(), key=lambda c: _natural_key(c["name"]))
    out: list[dict[str, Any]] = []
    for child in sorted_children:
        if child["kind"] == "dir":
            out.append(
                _build_branch(
                    relative_prefix=f"{relative_prefix}{child['name']}/",
                    lang_entries=lang_entries,
                    lang=lang,
                    parent_id=parent_id,
                    parent_path=parent_path,
                )
            )
        else:
            out.append(
                _build_leaf(
                    relative_path=f"{relative_prefix}{child['name']}",
                    lang_entries=lang_entries,
                    lang=lang,
                    parent_id=parent_id,
                    parent_path=parent_path,
                )
            )
    return out


def _build_branch(
    *,
    relative_prefix: str,
    lang_entries: dict[str, bytes],
    lang: str,
    parent_id: str,
    parent_path: str,
) -> dict[str, Any]:
    folder = relative_prefix.rstrip("/").rsplit("/", 1)[-1]
    order, fallback_name = _strip_order_prefix(folder)
    branch_meta_bytes = lang_entries.get(f"{relative_prefix}README.md")
    readme_raw = branch_meta_bytes.decode("utf-8") if branch_meta_bytes else ""
    branch_meta, readme_body = _parse_module_readme(readme_raw) if readme_raw else ({}, "")
    name = fallback_name
    branch_id = f"branch-{_slugify(f'{lang}/{relative_prefix}')}"
    branch_path = f"{parent_path} / {name}"

    children = _collect_children(
        relative_prefix=relative_prefix,
        lang_entries=lang_entries,
        lang=lang,
        parent_id=branch_id,
        parent_path=branch_path,
    )

    branch = {
        "id": branch_id,
        "parentId": parent_id,
        "name": name,
        "type": "branch",
        "icon": branch_meta.get("icon") or "📁",
        "path": branch_path,
        "order": str(order) if order is not None else "",
        "description": branch_meta.get("description") or readme_body,
        "expanded": True,
        "children": children,
    }
    if readme_raw:
        branch["content"] = readme_raw
    return branch


def _build_leaf(
    *,
    relative_path: str,
    lang_entries: dict[str, bytes],
    lang: str,
    parent_id: str,
    parent_path: str,
) -> dict[str, Any]:
    raw = lang_entries[relative_path].decode("utf-8")
    file_name = relative_path.rsplit("/", 1)[-1]
    if file_name.lower().endswith(".md"):
        file_name = file_name[:-3]
    order, fallback_name = _strip_order_prefix(file_name)
    meta = _parse_leaf_header(raw)
    name = meta.get("title") or fallback_name
    leaf_type = "exam" if meta.get("exam") else "leaf"

    return {
        "id": f"leaf-{_slugify(f'{lang}/{relative_path}')}",
        "parentId": parent_id,
        "name": name,
        "type": leaf_type,
        "icon": meta.get("icon") or ("📝" if leaf_type == "exam" else "📄"),
        "path": f"{parent_path} / {name}",
        "order": str(order) if order is not None else "",
        "description": meta.get("description") or "",
        "content": raw,
    }


def parse_all_challenges_from_content(content: str) -> list[dict[str, Any]]:
    """Scan a piece of markdown for every well-formed @quiz…@/quiz block.

    Unmatched openers (no closing fence before the next opener or EOF) are
    skipped, mirroring the JS parser.
    """
    if not content:
        return []
    lines = content.splitlines()
    out: list[dict[str, Any]] = []
    i = 0
    while i < len(lines):
        if not _QUIZ_OPEN.match(lines[i].strip()):
            i += 1
            continue
        close = -1
        for j in range(i + 1, len(lines)):
            if _QUIZ_CLOSE.match(lines[j].strip()):
                close = j
                break
            if _QUIZ_OPEN.match(lines[j].strip()):
                break
        if close == -1:
            i += 1
            continue
        challenge = parse_quiz_block(lines[i + 1 : close])
        if is_challenge_complete(challenge):
            out.append(challenge)
        i = close + 1
    return out


def clean_lesson_text(content: str) -> str:
    """Strip @quiz blocks, single-line @-tags and HTML, then collapse whitespace."""
    text = content or ""
    text = re.sub(
        r"^@quiz\s*\n.*?^@/quiz\s*$\n?",
        "",
        text,
        flags=re.IGNORECASE | re.MULTILINE | re.DOTALL,
    )
    text = re.sub(r"<[^>]*>", "", text)
    text = re.sub(r"@\w+:.*?\n", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_challenges_from_lesson(lesson: dict[str, Any]) -> list[dict[str, Any]]:
    if not lesson:
        return []
    if lesson.get("challenges"):
        return list(lesson["challenges"])
    if lesson.get("challenge"):
        return [lesson["challenge"]]
    return []


def pick_static_wrong(challenge: dict[str, Any]) -> str:
    for trap in challenge.get("traps") or []:
        t = str(trap or "").strip()
        if t and t != "—":
            return t
    sd = str(challenge.get("short_definition") or "").strip()
    ca = str(challenge.get("correct_answer") or "").strip()
    if sd and sd != ca:
        return sd
    return "—"


def static_quiz_from_challenge(challenge: dict[str, Any], title: str, count: int) -> list[dict[str, str]]:
    c = challenge
    items: list[dict[str, str]] = []
    if c.get("main_question") and c.get("correct_answer"):
        items.append(
            {
                "topic": str(c.get("core_concept") or title or "Topic")[:40],
                "q": str(c["main_question"]),
                "correct": str(c["correct_answer"]),
                "wrong": pick_static_wrong(c),
            }
        )
    for i, trap in enumerate(c.get("traps") or []):
        if not trap or not c.get("main_question"):
            continue
        trap_label = str(trap).strip()
        if len(trap_label) > 36:
            trap_label = trap_label[:34] + "…"
        items.append(
            {
                "topic": trap_label or f"{c.get('core_concept', 'Topic')} {i + 2}",
                "q": str(c["main_question"]),
                "correct": str(c["correct_answer"]),
                "wrong": str(trap),
            }
        )
    if not items and c.get("core_concept") and c.get("short_definition"):
        items.append(
            {
                "topic": str(c["core_concept"]),
                "q": f"What is {c['core_concept']}?",
                "correct": str(c["short_definition"]),
                "wrong": pick_static_wrong(c),
            }
        )
    return items[: max(1, count)]


def static_quiz_from_lesson(lesson: dict[str, Any], count: int = 3) -> list[dict[str, str]]:
    n = max(1, count)
    items: list[dict[str, str]] = []
    title = str(lesson.get("title") or "")
    for c in get_challenges_from_lesson(lesson):
        batch = static_quiz_from_challenge(c, title, n - len(items))
        items.extend(batch)
        if len(items) >= n:
            break
    return items[:n]


def static_match_pairs_from_challenge(challenge: dict[str, Any], max_pairs: int) -> list[dict[str, str]]:
    concept = str(challenge.get("core_concept") or "").strip()
    defn = str(challenge.get("short_definition") or "").strip()
    correct = str(challenge.get("correct_answer") or "").strip()
    topic_def = defn or correct
    out: list[dict[str, str]] = []
    if concept and topic_def:
        out.append({"t": concept[:48], "d": topic_def[:72]})
    steps = challenge.get("steps") or []
    for i in range(len(steps) - 1):
        out.append({"t": str(steps[i])[:48], "d": str(steps[i + 1])[:72]})
    if defn and challenge.get("cloze_indices"):
        words = defn.split()
        for idx in challenge["cloze_indices"]:
            if isinstance(idx, int) and 0 <= idx < len(words) and concept:
                w = words[idx]
                if w:
                    out.append({"t": w[:48], "d": concept[:72]})
    return out[: max(1, min(max_pairs, 8))]


def static_match_pairs_from_lessons(lessons: list[dict[str, Any]], count: int) -> list[dict[str, str]]:
    n = max(1, min(count, 8))
    out: list[dict[str, str]] = []
    seen: set[str] = set()
    for lesson in lessons:
        for c in get_challenges_from_lesson(lesson):
            for pair in static_match_pairs_from_challenge(c, n):
                kt = pair["t"].lower()
                kd = pair["d"].lower()
                if kt in seen or kd in seen or kt == kd:
                    continue
                seen.add(kt)
                seen.add(kd)
                out.append(pair)
                if len(out) >= n:
                    return out
    return out


# ---------------------------------------------------------------------------
# Quiz V2 modalities — multiple / recall / cloze / chips / steps
# ---------------------------------------------------------------------------
#
# Five student-facing modalities share the same Quiz V2 challenge. The helpers
# below detect which ones are playable, pick one deterministically, and build a
# UI-neutral card the caller can render. Equivalent to the JS helpers in
# `arborito/src/features/learning/quiz-v2-schema.js`.


def _normalize_challenge(raw: dict[str, Any] | None) -> dict[str, Any]:
    c = new_challenge()
    if not raw or not isinstance(raw, dict):
        return c
    c["core_concept"] = str(raw.get("core_concept") or "").strip()
    c["short_definition"] = str(raw.get("short_definition") or "").strip()
    c["main_question"] = str(raw.get("main_question") or "").strip()
    c["correct_answer"] = str(raw.get("correct_answer") or "").strip()
    c["traps"] = [
        str(t or "").strip() for t in (raw.get("traps") or []) if str(t or "").strip()
    ]
    c["cloze_indices"] = []
    for n in raw.get("cloze_indices") or []:
        try:
            c["cloze_indices"].append(int(n))
        except (TypeError, ValueError):
            continue
    c["answer_mode"] = "steps" if raw.get("answer_mode") == "steps" else "chips"
    c["steps"] = [
        str(s or "").strip() for s in (raw.get("steps") or []) if str(s or "").strip()
    ]
    c["skip_multiple"] = bool(raw.get("skip_multiple"))
    c["skip_ordering"] = bool(raw.get("skip_ordering"))
    modes = raw.get("modes")
    if isinstance(modes, list) and modes:
        c["modes"] = [m for m in modes if m in ALL_QUIZ_MODES]
    else:
        c["modes"] = list(ALL_QUIZ_MODES)
    return c


def mode_is_playable(challenge: dict[str, Any], mode: str) -> bool:
    c = _normalize_challenge(challenge)
    if mode == QUIZ_MODE_CLOZE:
        return bool(c["short_definition"] and c["cloze_indices"])
    if mode == QUIZ_MODE_MULTIPLE:
        return bool(
            c["main_question"]
            and c["correct_answer"]
            and c["traps"]
            and not c["skip_multiple"]
        )
    if mode == QUIZ_MODE_RECALL:
        return bool(c["core_concept"] and c["correct_answer"])
    if mode == QUIZ_MODE_CHIPS:
        return bool(c["correct_answer"] and " " in c["correct_answer"] and not c["skip_ordering"])
    if mode == QUIZ_MODE_STEPS:
        return bool(len(c["steps"]) >= 2 and c["answer_mode"] == "steps" and not c["skip_ordering"])
    return False


def playable_modes(challenge: dict[str, Any]) -> list[str]:
    c = _normalize_challenge(challenge)
    derived = [m for m in ALL_QUIZ_MODES if mode_is_playable(c, m)]
    authored = c.get("modes") or []
    if 0 < len(authored) < len(ALL_QUIZ_MODES):
        return [m for m in derived if m in authored]
    return derived


def _stable_hash(s: str) -> int:
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0x7FFFFFFF
    return h


def pick_study_mode(challenge: dict[str, Any], block_id: str, salt: str = "") -> str:
    c = _normalize_challenge(challenge)
    playable = playable_modes(c)
    if not playable:
        return QUIZ_MODE_MULTIPLE
    authored = c.get("modes") or []
    if 0 < len(authored) < len(ALL_QUIZ_MODES) and len(authored) == 1 and authored[0] in playable:
        return authored[0]
    return playable[_stable_hash(f"{block_id}:{salt}") % len(playable)]


_PROMPTS = {
    "ES": {
        "recall": lambda concept: f"¿Qué es «{concept}»?",
        "chips": lambda concept: f"Ordena las palabras para «{concept}».",
        "steps": lambda _concept: "Ordena los pasos correctamente.",
    },
    "EN": {
        "recall": lambda concept: f"What is «{concept}»?",
        "chips": lambda concept: f"Order the words for «{concept}».",
        "steps": lambda _concept: "Order the steps correctly.",
    },
}


def _build_options(correct: str, wrong_pool: list[str], count: int) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    c = (correct or "").strip()
    if c:
        out.append(c)
        seen.add(c.lower())
    for w in wrong_pool or []:
        t = (w or "").strip()
        if not t or len(out) >= count:
            continue
        k = t.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(t)
    random.shuffle(out)
    return out


def _build_cloze_view(c: dict[str, Any]) -> dict[str, Any]:
    words = (c.get("short_definition") or "").split()
    idxs = c.get("cloze_indices") or []
    blank_idx = idxs[0] if idxs else -1
    blank_word = (
        words[blank_idx] if 0 <= blank_idx < len(words) else str(c.get("correct_answer") or "")
    )
    display = " ".join("______" if i in idxs else w for i, w in enumerate(words))
    return {"display": display, "blank_word": blank_word}


def _distractor_words_except(text: str, exclude: str, limit: int = 3) -> list[str]:
    ex = (exclude or "").lower()
    out: list[str] = []
    for w in (text or "").split():
        clean = re.sub(r"[.,;:!?]+$", "", w)
        if clean and clean.lower() != ex and len(clean) > 1:
            out.append(clean)
        if len(out) >= limit:
            break
    return out


def build_mode_card(
    challenge: dict[str, Any],
    mode: str,
    *,
    lesson_title: str = "",
    lang: str = "ES",
    option_count: int = 4,
) -> Optional[dict[str, Any]]:
    """Build a UI-neutral card for one Quiz V2 modality.

    Returns None when ``mode`` is not playable on ``challenge``.
    """
    c = _normalize_challenge(challenge)
    if not mode_is_playable(c, mode):
        return None
    lang_key = lang.upper() if lang.upper() in _PROMPTS else "ES"
    prompts = _PROMPTS[lang_key]
    option_count = max(2, min(option_count, 6))
    concept = c["core_concept"] or lesson_title or "Concept"

    if mode == QUIZ_MODE_MULTIPLE:
        wrong = list(c["traps"])
        if c["short_definition"] and c["short_definition"] != c["correct_answer"]:
            wrong.append(c["short_definition"])
        return {
            "mode": mode,
            "concept": concept,
            "question": c["main_question"],
            "correct": c["correct_answer"],
            "options": _build_options(c["correct_answer"], wrong, option_count),
        }
    if mode == QUIZ_MODE_RECALL:
        wrong = list(c["traps"])
        if c["short_definition"] and c["short_definition"] != c["correct_answer"]:
            wrong.append(c["short_definition"])
        return {
            "mode": mode,
            "concept": concept,
            "question": prompts["recall"](concept),
            "correct": c["correct_answer"],
            "options": _build_options(c["correct_answer"], wrong, option_count),
        }
    if mode == QUIZ_MODE_CLOZE:
        view = _build_cloze_view(c)
        wrong = list(c["traps"])
        wrong.extend(_distractor_words_except(c["short_definition"], view["blank_word"]))
        return {
            "mode": mode,
            "concept": concept,
            "question": view["display"],
            "correct": view["blank_word"],
            "options": _build_options(view["blank_word"], wrong, option_count),
            "cloze_display": view["display"],
            "blank_word": view["blank_word"],
        }
    if mode == QUIZ_MODE_CHIPS:
        words = (c["correct_answer"] or "").split()
        shuffled = list(words)
        random.shuffle(shuffled)
        return {
            "mode": mode,
            "concept": concept,
            "question": prompts["chips"](concept),
            "correct": c["correct_answer"],
            "sequence": words,
            "chips": shuffled,
        }
    if mode == QUIZ_MODE_STEPS:
        steps = list(c["steps"])
        shuffled = list(steps)
        random.shuffle(shuffled)
        return {
            "mode": mode,
            "concept": concept,
            "question": prompts["steps"](concept),
            "correct": " → ".join(steps),
            "sequence": steps,
            "chips": shuffled,
        }
    return None


def build_study_card(
    challenge: dict[str, Any],
    block_id: str,
    *,
    lesson_title: str = "",
    lang: str = "ES",
    salt: str = "",
) -> Optional[dict[str, Any]]:
    """Convenience: pick a playable mode then build the card in one call."""
    playable = playable_modes(challenge)
    if not playable:
        return None
    mode = pick_study_mode(challenge, block_id, salt)
    if mode not in playable:
        mode = playable[0]
    return build_mode_card(challenge, mode, lesson_title=lesson_title, lang=lang)

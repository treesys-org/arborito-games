"""Arborito API mirror: lessons from arborito-library or .arborito + ask.json via a local llama.cpp server."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional

from .archive import load_arborito_archive
from .errors import (
    AI_EMPTY_RESPONSE,
    AI_NETWORK,
    AI_PARSE_ERROR,
    AI_SAGE_ERROR,
    ArboritoError,
    ERROR_CODES,
)
from .json_extract import parse_json_from_model_output
from .quiz_v2 import (
    ALL_QUIZ_MODES,
    QUIZ_MODE_CHIPS,
    QUIZ_MODE_CLOZE,
    QUIZ_MODE_MULTIPLE,
    QUIZ_MODE_RECALL,
    QUIZ_MODE_STEPS,
    build_mode_card,
    build_study_card,
    clean_lesson_text,
    get_challenges_from_lesson,
    is_challenge_complete,
    mode_is_playable,
    new_challenge,
    parse_all_challenges_from_content,
    pick_study_mode,
    playable_modes,
    static_match_pairs_from_lessons,
    static_quiz_from_lesson,
)


@dataclass
class User:
    username: str
    lang: str
    avatar: str = "🧑‍🎓"


def _parse_challenge_from_content(content: str) -> Optional[dict[str, Any]]:
    """First complete Quiz V2 block in lesson body."""
    blocks = parse_all_challenges_from_content(content)
    return blocks[0] if blocks else None


def _collect_leaves(library_root: Path, lang: str) -> list[dict[str, Any]]:
    lang_key = lang.lower()
    nodes_dir = library_root / "data" / "nodes" / lang_key
    if not nodes_dir.is_dir():
        raise FileNotFoundError(
            f"Missing {nodes_dir}. Run builder_script.py in arborito-library or clone data/."
        )
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    for path in sorted(nodes_dir.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if not isinstance(data, list):
            continue
        for node in data:
            if not isinstance(node, dict) or node.get("type") not in ("leaf", "exam"):
                continue
            nid = node.get("id")
            if not isinstance(nid, str) or nid in seen:
                continue
            cp = node.get("contentPath")
            if not isinstance(cp, str):
                continue
            content_file = library_root / "data" / "content" / cp
            if not content_file.is_file():
                continue
            try:
                payload = json.loads(content_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                continue
            text = payload.get("content") or ""
            challenges = parse_all_challenges_from_content(text)
            seen.add(nid)
            lesson: dict[str, Any] = {
                "id": nid,
                "title": node.get("title") or node.get("name") or nid,
                "text": clean_lesson_text(text),
                "raw": text,
            }
            if challenges:
                lesson["challenge"] = challenges[0]
                lesson["challenges"] = challenges
            out.append(lesson)
    return out


def _llamacpp_chat(host: str, model: Optional[str], user_text: str, timeout: float) -> str:
    """Call a local `llama-server` (llama.cpp) using the OpenAI-compatible endpoint.

    `host`  - base URL of the running server (default `http://127.0.0.1:8080`).
    `model` - optional model identifier; when the server only has one model loaded
              this can be left blank.
    """
    url = host.rstrip("/") + "/v1/chat/completions"
    payload: dict[str, Any] = {
        "messages": [{"role": "user", "content": user_text}],
        "stream": False,
        "temperature": 0.2,
    }
    if model:
        payload["model"] = model
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise ArboritoError(AI_NETWORK, f"llama.cpp HTTP {e.code}: {e.reason}") from e
    except OSError as e:
        raise ArboritoError(AI_NETWORK, str(e)) from e
    choices = data.get("choices") or []
    if not choices:
        return ""
    msg = (choices[0] or {}).get("message") or {}
    return (msg.get("content") or "").strip()


class Arborito:
    """
    Same command names as window.arborito: user, lesson, ask, quiz, matchPairs, challenge, memory.

    Offline: xp/save/load/memory are stubs (browser/Electron host provides real persistence).
    Use ai_mode='static' to read Quiz V2 from lessons without an AI server.

    Dynamic AI is served by a local **llama.cpp** server (`llama-server` from the
    llama.cpp project) exposing the OpenAI-compatible `/v1/chat/completions`
    endpoint. Configure via constructor args or env vars:

        LLAMA_CPP_HOST   default http://127.0.0.1:8080
        LLAMA_CPP_MODEL  optional; only needed when the server hosts >1 model

    To start a compatible server locally:

        llama-server -m path/to/model.gguf --port 8080
    """

    ERROR_CODES = ERROR_CODES

    def __init__(
        self,
        lessons: list[dict[str, Any]],
        user: User,
        *,
        ai_mode: str = "dynamic",
        llamacpp_host: Optional[str] = None,
        llamacpp_model: Optional[str] = None,
        ask_timeout: float = 120.0,
        max_json_attempts: int = 3,
    ):
        self._playlist = lessons
        self._cursor = 0
        self.user = user
        self._ai_mode = "static" if str(ai_mode).lower() == "static" else "dynamic"
        self._llamacpp_host = (
            llamacpp_host
            or os.environ.get("LLAMA_CPP_HOST")
            or "http://127.0.0.1:8080"
        )
        self._llamacpp_model = llamacpp_model or os.environ.get("LLAMA_CPP_MODEL") or ""
        self._ask_timeout = ask_timeout
        self._max_json_attempts = max_json_attempts
        attach_helpers(self)

    @classmethod
    def from_library(
        cls,
        library_root: str | Path,
        lang: str = "EN",
        *,
        username: str = "developer",
        avatar: str = "🐍",
        ai_mode: Optional[str] = None,
        **kwargs: Any,
    ) -> Arborito:
        root = Path(library_root).resolve()
        leaves = _collect_leaves(root, lang)
        user = User(username=username, lang=lang.upper(), avatar=avatar)
        mode = ai_mode or os.environ.get("ARBORITO_AI_MODE", "dynamic")
        return cls(leaves, user, ai_mode=mode, **kwargs)

    @classmethod
    def from_arborito(
        cls,
        archive_path: str | Path,
        lang: str = "ES",
        *,
        username: str = "developer",
        avatar: str = "🐍",
        ai_mode: str = "static",
        **kwargs: Any,
    ) -> Arborito:
        """Load a demo or exported tree (examples/linux-games-demo.arborito). Defaults to static mode."""
        lessons = load_arborito_archive(archive_path, lang=lang)
        user = User(username=username, lang=lang.upper(), avatar=avatar)
        return cls(lessons, user, ai_mode=ai_mode, **kwargs)

    def getAIMode(self) -> str:
        """'static' (Quiz V2 only) or 'dynamic' (local llama.cpp server for ask.json / AI helpers)."""
        return self._ai_mode

    @property
    def lesson(self) -> _LessonNS:
        return _LessonNS(self)

    @property
    def ask(self) -> _AskNS:
        return _AskNS(self)

    @property
    def challenge(self) -> _ChallengeNS:
        return _ChallengeNS()

    @property
    def meta(self) -> _MetaNS:
        return _MetaNS()

    def xp(self, _n: int) -> None:
        """No-op offline (browser sends XP to the host)."""
        return

    def save(self, _key: str, _value: Any) -> bool:
        return False

    def load(self, _key: str) -> Any:
        return None

    def exit(self) -> None:
        """No-op offline (browser closes the game modal)."""
        return

    @property
    def memory(self) -> _MemoryNS:
        return _MemoryNS()


class _MemoryNS:
    def due(self) -> list[str]:
        return []

    def getStatus(self, _node_id: str) -> dict[str, Any]:
        return {"health": 1.0, "interval": 0, "isDue": False}

    def isDue(self, _node_id: str) -> bool:
        return False

    def report(self, _node_id: str, _quality: int) -> None:
        return


class _MetaNS:
    def read(self, lesson: dict[str, Any]) -> dict[str, Any]:
        return _LessonNS.read_meta(lesson)


class _ChallengeModesNS:
    """Quiz V2 modalities: multiple, recall, cloze, chips, steps.

    Mirrors `window.arborito.challenge.modes` in the browser cartridge SDK.
    """

    ALL = list(ALL_QUIZ_MODES)
    MULTIPLE = QUIZ_MODE_MULTIPLE
    RECALL = QUIZ_MODE_RECALL
    CLOZE = QUIZ_MODE_CLOZE
    CHIPS = QUIZ_MODE_CHIPS
    STEPS = QUIZ_MODE_STEPS

    def isPlayable(self, challenge: dict[str, Any], mode: str) -> bool:
        return mode_is_playable(challenge, mode)

    def playable(self, challenge: dict[str, Any]) -> list[str]:
        return playable_modes(challenge)

    def pick(self, challenge: dict[str, Any], block_id: str, salt: str = "") -> str:
        return pick_study_mode(challenge, block_id, salt)

    def buildCard(
        self,
        challenge: dict[str, Any],
        mode: str,
        *,
        lesson_title: str = "",
        lang: str = "ES",
        option_count: int = 4,
    ) -> Optional[dict[str, Any]]:
        return build_mode_card(
            challenge,
            mode,
            lesson_title=lesson_title,
            lang=lang,
            option_count=option_count,
        )

    def buildStudyCard(
        self,
        challenge: dict[str, Any],
        block_id: str,
        *,
        lesson_title: str = "",
        lang: str = "ES",
        salt: str = "",
    ) -> Optional[dict[str, Any]]:
        return build_study_card(
            challenge,
            block_id,
            lesson_title=lesson_title,
            lang=lang,
            salt=salt,
        )


class _ChallengeNS:
    modes = _ChallengeModesNS()

    def isComplete(self, challenge: dict[str, Any]) -> bool:
        return is_challenge_complete(challenge)

    def getCompleteness(self, challenge: dict[str, Any]) -> dict[str, Any]:
        if not challenge:
            return {"complete": False, "score": 0, "total": 5}
        fields = ["core_concept", "short_definition", "main_question", "correct_answer"]
        score = sum(1 for f in fields if str(challenge.get(f) or "").strip())
        if challenge.get("traps"):
            score += 1
        return {"complete": score == 5, "score": score, "total": 5}

    def fromLesson(self, lesson: dict[str, Any]) -> list[dict[str, Any]]:
        return get_challenges_from_lesson(lesson)

    def template(self) -> dict[str, Any]:
        return new_challenge()

    def buildDuelDeck(self, lesson: dict[str, Any]) -> Optional[list[dict[str, Any]]]:
        c = lesson.get("challenge") if lesson else None
        if not c or not c.get("main_question") or not c.get("correct_answer"):
            return None
        traps = [t for t in (c.get("traps") or []) if t]
        wrong_pool = traps[:]
        sd = str(c.get("short_definition") or "").strip()
        ca = str(c.get("correct_answer") or "").strip()
        if sd and sd != ca:
            wrong_pool.append(sd)
        options = [ca] + wrong_pool[:3]
        return [
            {
                "id": "core",
                "name": c.get("core_concept") or lesson.get("title") or "Lesson",
                "effect": sd,
                "question": c.get("main_question"),
                "correct": ca,
                "options": options,
                "power": 100,
            }
        ]


class _LessonNS:
    def __init__(self, client: Arborito):
        self._c = client

    @staticmethod
    def read_meta(lesson: dict[str, Any]) -> dict[str, Any]:
        """Lesson `@info` block as a plain dict: just `tags` for now.

        Spaced-repetition status is decided by Arborito's own SRS engine
        (`memory.due()` / `memory.getStatus(lessonId)`); it is **not** an
        authoring flag, so it is intentionally not surfaced here.
        """
        meta = (lesson or {}).get("meta") or {}
        return {"tags": list(meta.get("tags") or [])}

    def readMeta(self, lesson: dict[str, Any]) -> dict[str, Any]:
        return self.read_meta(lesson)

    def list(self) -> list[dict[str, str]]:
        return [{"id": x["id"], "title": x["title"]} for x in self._c._playlist]

    def next(self) -> Optional[dict[str, Any]]:
        if not self._c._playlist:
            return None
        if self._c._cursor >= len(self._c._playlist):
            self._c._cursor = 0
        lesson = self._c._playlist[self._c._cursor]
        self._c._cursor += 1
        return dict(lesson)

    def at(self, idx: int) -> Optional[dict[str, Any]]:
        if idx < 0 or idx >= len(self._c._playlist):
            return None
        return dict(self._c._playlist[idx])


class _AskNS:
    def __init__(self, client: Arborito):
        self._c = client

    def json(
        self,
        prompt: str,
        on_complete: Optional[Callable[[Any], None]] = None,
        *,
        timeout_ms: Optional[int] = None,
        max_attempts: Optional[int] = None,
    ) -> Any:
        """Same role as window.arborito.ask.json (Python is synchronous here)."""
        if self._c.getAIMode() == "static":
            raise ArboritoError(
                AI_SAGE_ERROR,
                "AI not available in static mode. Use quiz()/matchPairs() or set ai_mode='dynamic'.",
            )
        augmented = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks."
        timeout = (timeout_ms / 1000.0) if timeout_ms else self._c._ask_timeout
        attempts = max_attempts if max_attempts is not None else self._c._max_json_attempts
        last_err: Optional[Exception] = None
        for attempt in range(attempts):
            try:
                raw = _llamacpp_chat(
                    self._c._llamacpp_host,
                    self._c._llamacpp_model,
                    augmented,
                    timeout,
                )
                try:
                    out = parse_json_from_model_output(raw)
                except json.JSONDecodeError as e:
                    last_err = ArboritoError(AI_PARSE_ERROR, str(e))
                    if attempt < attempts - 1:
                        continue
                    raise last_err from e
                except ValueError as e:
                    msg = str(e)
                    if msg == "SAGE_ERROR_MARKER":
                        raise ArboritoError(AI_SAGE_ERROR, (raw or "")[:2000]) from e
                    if msg == "EMPTY":
                        raise ArboritoError(AI_EMPTY_RESPONSE, "Model returned no JSON.") from e
                    raise
                if on_complete:
                    on_complete(out)
                return out
            except ArboritoError as e:
                if e.code in (AI_SAGE_ERROR, AI_EMPTY_RESPONSE):
                    raise
                last_err = e
                if attempt < attempts - 1:
                    continue
                raise
        if last_err:
            raise last_err
        raise ArboritoError(AI_PARSE_ERROR, "Exhausted retries.")

    def chat(self, messages: list[dict[str, str]], _ctx: Any = None) -> dict[str, Any]:
        if self._c.getAIMode() == "static":
            raise ArboritoError(AI_SAGE_ERROR, "AI not available in static mode.")
        text = ""
        for m in reversed(messages):
            if m.get("role") == "user" and isinstance(m.get("content"), str):
                text = m["content"]
                break
        raw = _llamacpp_chat(
            self._c._llamacpp_host,
            self._c._llamacpp_model,
            text,
            self._c._ask_timeout,
        )
        return {"rawText": raw, "text": raw}


def quiz_prompt(lesson: dict[str, Any], count: int, lang: str) -> str:
    lang_name = "Spanish" if lang.upper() == "ES" else "English"
    txt = (lesson.get("text") or "")[:800]
    return (
        f'Context: "{txt}".\n'
        f"The user language is {lang_name}.\n"
        f"Generate {count} distinct topics based on the context. For each topic, create a short question, "
        f"a CORRECT answer (max 3 words), and a PLAUSIBLE WRONG answer (max 3 words).\n"
        f"ALL output (topics, questions, answers) MUST be in {lang_name}.\n"
        "Return ONLY a valid JSON array matching this schema:\n"
        '[\n    { "topic": "Short Topic Name", "q": "Question text", "correct": "Correct Answer", "wrong": "Wrong Answer" }\n]'
    )


def match_pairs_prompt(lesson: dict[str, Any], n: int, lang: str) -> str:
    lang_name = "Spanish" if lang.upper() == "ES" else "English"
    txt = (lesson.get("text") or "")[:1000]
    return (
        f'Context: "{txt}".\n'
        f"Task: Create content for a Memory-style card matching game in {lang_name}.\n"
        f"Goal: Generate {n} pairs of concepts where the player must match a Term with its Definition.\n"
        f"Rules: Terms 1-3 words; definitions max 6 words; all in {lang_name}; pairs unique and logically connected.\n"
        'Output: ONLY a valid JSON array: [{"t": "Term", "d": "Definition"}, ...]'
    )


def attach_helpers(arborito: Arborito) -> None:
    """Add quiz() and matchPairs() like the browser SDK."""

    def quiz(lesson: dict[str, Any], opts: Optional[dict[str, Any]] = None) -> Any:
        opts = opts or {}
        count = int(opts.get("count", 3))
        if arborito.getAIMode() == "static":
            items = static_quiz_from_lesson(lesson, count)
            if not items:
                raise ArboritoError(
                    AI_SAGE_ERROR,
                    "STATIC_QUIZ: Fill the lesson questionnaire (Quiz V2) to play in static mode.",
                )
            return items
        return arborito.ask.json(quiz_prompt(lesson, count, arborito.user.lang))

    def match_pairs(lesson: dict[str, Any], opts: Optional[dict[str, Any]] = None) -> Any:
        opts = opts or {}
        n = int(opts.get("count", 6))
        fill = opts.get("fillFromCurriculum", True)

        if arborito.getAIMode() == "static" or get_challenges_from_lesson(lesson):
            lessons = [lesson] if lesson else []
            pairs = static_match_pairs_from_lessons(lessons, n)
            if fill and len(pairs) < n and lesson and lesson.get("id"):
                start = -1
                for i, L in enumerate(arborito._playlist):
                    if L.get("id") == lesson.get("id"):
                        start = i
                        break
                if start >= 0:
                    for follow in arborito._playlist[start + 1 :]:
                        lessons.append(follow)
                        pairs = static_match_pairs_from_lessons(lessons, n)
                        if len(pairs) >= n:
                            break
            if pairs:
                return pairs[:n]
            if arborito.getAIMode() == "static":
                raise ArboritoError(
                    AI_SAGE_ERROR,
                    "STATIC_PAIRS: Fill the lesson questionnaire (Quiz V2) to play in static mode.",
                )

        return arborito.ask.json(match_pairs_prompt(lesson, n, arborito.user.lang))

    setattr(arborito, "quiz", quiz)
    setattr(arborito, "matchPairs", match_pairs)

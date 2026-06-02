#!/usr/bin/env python3
"""
Arborito Quiz — single example game for the Python SDK.

Replaces the previous demo + mini_quiz scripts with one file that:

- Loads any .arborito archive (default tries examples/ingles-a1-demo.arborito).
- Walks every lesson AND every challenge inside it, so @exam nodes with many
  Quiz V2 blocks in one lesson are played in full, not just the first card.
- For each challenge, picks ONE playable Quiz V2 modality (multiple, recall,
  cloze, chips, steps) honouring the author's `modes:` directive, and
  renders the appropriate CLI interaction via the SDK helper
  `api.challenge.modes.buildCard(...)`.
- Tracks score and a per-mode tally so you can see which modalities the tree
  actually exercises.

Usage:

    python3 examples/quiz_game.py
    python3 examples/quiz_game.py --arborito ../../examples/ingles-a1-demo.arborito --lang ES
    python3 examples/quiz_game.py --arborito ../../deck-to-arborito/salida.arborito --rounds 20

Type `q` at any prompt to quit, `s` to skip a challenge.
"""

from __future__ import annotations

import argparse
import random
import sys
from pathlib import Path
from typing import Any, Iterator, Optional

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from arborito_sdk import Arborito, ArboritoError

DEFAULT_TREE = Path(__file__).resolve().parents[3] / "examples" / "ingles-a1-demo.arborito"


def iter_challenges(api: Arborito, shuffle: bool) -> Iterator[tuple[dict[str, Any], dict[str, Any]]]:
    """Yield (lesson, challenge) for every challenge in the playlist."""
    lessons = [api.lesson.at(i) for i in range(len(api.lesson.list()))]
    lessons = [L for L in lessons if L]
    if shuffle:
        random.shuffle(lessons)
    for lesson in lessons:
        challenges = api.challenge.fromLesson(lesson)
        if shuffle:
            challenges = list(challenges)
            random.shuffle(challenges)
        for c in challenges:
            yield lesson, c


def read_input(prompt: str) -> Optional[str]:
    """Returns None when the player wants to quit, '' to skip."""
    try:
        raw = input(prompt).strip()
    except (EOFError, KeyboardInterrupt):
        return None
    low = raw.lower()
    if low in ("q", "quit", "exit"):
        return None
    if low in ("s", "skip"):
        return ""
    return raw


def play_options_card(card: dict[str, Any]) -> Optional[bool]:
    """Multiple / recall / cloze — single-pick from N options."""
    print(f"  Q: {card['question']}")
    options = list(card.get("options") or [])
    for i, opt in enumerate(options, 1):
        print(f"    {i}) {opt}")
    while True:
        raw = read_input("  Pick (number, s=skip, q=quit): ")
        if raw is None:
            return None
        if raw == "":
            print(f"  Skipped — correct was: {card['correct']}")
            return False
        if not raw.isdigit():
            print("  Enter the option number.")
            continue
        idx = int(raw) - 1
        if idx < 0 or idx >= len(options):
            print("  Invalid option.")
            continue
        picked = options[idx]
        ok = picked.strip().lower() == str(card["correct"]).strip().lower()
        print("  Correct!" if ok else f"  Wrong — correct: {card['correct']}")
        return ok


def play_sequence_card(card: dict[str, Any]) -> Optional[bool]:
    """Chips / steps — order the shuffled chunks by typing their numbers."""
    chips = list(card.get("chips") or [])
    sequence = list(card.get("sequence") or [])
    if not chips or not sequence:
        print("  (no chips to order)")
        return False
    print(f"  Q: {card['question']}")
    for i, chip in enumerate(chips, 1):
        print(f"    {i}) {chip}")
    while True:
        raw = read_input(
            "  Type the order as space-separated numbers (e.g. 3 1 2), s=skip, q=quit: "
        )
        if raw is None:
            return None
        if raw == "":
            print(f"  Skipped — correct order: {' → '.join(sequence)}")
            return False
        tokens = raw.replace(",", " ").split()
        if not tokens:
            print("  Enter numbers separated by spaces.")
            continue
        try:
            indices = [int(t) - 1 for t in tokens]
        except ValueError:
            print("  All tokens must be numbers.")
            continue
        if len(indices) != len(chips) or sorted(indices) != list(range(len(chips))):
            print(f"  Use each chip exactly once ({len(chips)} numbers).")
            continue
        picked = [chips[i] for i in indices]
        ok = picked == sequence
        print(
            "  Correct!"
            if ok
            else f"  Wrong — correct order: {' → '.join(sequence)}"
        )
        return ok


def play_card(card: dict[str, Any]) -> Optional[bool]:
    mode = card.get("mode")
    if mode in ("multiple", "recall", "cloze"):
        return play_options_card(card)
    if mode in ("chips", "steps"):
        return play_sequence_card(card)
    print(f"  (unsupported mode: {mode!r}) — skipped")
    return False


def render_summary(score: int, attempted: int, per_mode: dict[str, dict[str, int]]) -> None:
    print()
    print("=" * 44)
    print(f"  Score: {score}/{attempted}")
    if per_mode:
        print("  By modality:")
        for mode in ("multiple", "recall", "cloze", "chips", "steps"):
            tally = per_mode.get(mode)
            if not tally:
                continue
            seen = tally["seen"]
            ok = tally["ok"]
            print(f"    {mode:<8}  {ok}/{seen}")
    if attempted:
        ratio = score / attempted
        if ratio == 1:
            verdict = "Perfect run!"
        elif ratio >= 0.5:
            verdict = "Good — keep practicing."
        else:
            verdict = "Review the tree and try again."
        print(f"  {verdict}")
    print("=" * 44)


def main() -> None:
    p = argparse.ArgumentParser(description="Arborito Quiz (SDK example game)")
    p.add_argument(
        "--arborito",
        type=Path,
        default=DEFAULT_TREE,
        help="Path to a .arborito archive.",
    )
    p.add_argument("--lang", default="ES", help="Display language (ES or EN).")
    p.add_argument(
        "--rounds",
        type=int,
        default=10,
        help="Maximum number of challenges to play in this session.",
    )
    p.add_argument(
        "--shuffle",
        action="store_true",
        help="Shuffle the order of lessons and challenges.",
    )
    p.add_argument(
        "--mode-only",
        choices=["multiple", "recall", "cloze", "chips", "steps"],
        help="Restrict play to a single modality (skips challenges where it is not playable).",
    )
    args = p.parse_args()

    archive = args.arborito.resolve()
    if not archive.is_file():
        print(f"Not found: {archive}", file=sys.stderr)
        sys.exit(1)

    try:
        api = Arborito.from_arborito(
            archive,
            lang=args.lang,
            username="player",
            avatar="🎮",
        )
    except (ArboritoError, ValueError) as e:
        print(f"Failed to load tree: {e}", file=sys.stderr)
        sys.exit(2)

    total_lessons = len(api.lesson.list())
    total_challenges = sum(
        len(api.challenge.fromLesson(api.lesson.at(i))) for i in range(total_lessons)
    )

    print("=" * 44)
    print("  ARBORITO QUIZ — Python SDK example")
    print("=" * 44)
    print(f"  Course:     {archive.name}")
    print(f"  Lessons:    {total_lessons}")
    print(f"  Challenges: {total_challenges}")
    print(f"  Mode:       {api.getAIMode()}  ·  lang: {api.user.lang}")
    if args.mode_only:
        print(f"  Modality:   {args.mode_only} only")
    print("=" * 44)

    score = 0
    attempted = 0
    per_mode: dict[str, dict[str, int]] = {}

    for round_num, (lesson, challenge) in enumerate(
        iter_challenges(api, args.shuffle), start=1
    ):
        if attempted >= args.rounds:
            break

        playable = api.challenge.modes.playable(challenge)
        if args.mode_only:
            if args.mode_only not in playable:
                continue
            mode = args.mode_only
        else:
            if not playable:
                continue
            block_id = str(challenge.get("core_concept") or lesson.get("id") or round_num)
            picked = api.challenge.modes.pick(challenge, block_id)
            mode = picked if picked in playable else playable[0]

        card = api.challenge.modes.buildCard(
            challenge,
            mode,
            lesson_title=lesson.get("title") or "",
            lang=api.user.lang,
        )
        if not card:
            continue

        attempted += 1
        print()
        title = (lesson.get("title") or "?")[:60]
        concept = (challenge.get("core_concept") or "?")[:40]
        label = mode.upper()
        print(f"--- Round {attempted}/{args.rounds} · {title} · {concept} [{label}] ---")

        outcome = play_card(card)
        if outcome is None:
            print("  Quit.")
            break

        tally = per_mode.setdefault(mode, {"seen": 0, "ok": 0})
        tally["seen"] += 1
        if outcome:
            tally["ok"] += 1
            score += 1
            api.xp(10)

    render_summary(score, attempted, per_mode)


if __name__ == "__main__":
    main()

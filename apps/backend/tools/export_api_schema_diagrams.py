#!/usr/bin/env python3
"""Extract Mermaid diagrams from API-SCHEMA-RELATION.md and render images."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

MERMAID_BLOCK_RE = re.compile(r"```mermaid\n(.*?)```", re.DOTALL)
HEADING_RE = re.compile(r"^##\s+(.+?)\s*$")


def slugify(text: str) -> str:
    lowered = text.lower().strip()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    lowered = lowered.strip("-")
    return lowered or "diagram"


def extract_headings(lines: list[str]) -> list[tuple[int, str]]:
    headings: list[tuple[int, str]] = []
    for idx, line in enumerate(lines):
        match = HEADING_RE.match(line)
        if match:
            headings.append((idx, match.group(1).strip()))
    return headings


def nearest_heading(headings: list[tuple[int, str]], line_index: int) -> str:
    title = "diagram"
    for idx, value in headings:
        if idx <= line_index:
            title = value
        else:
            break
    return title


def find_blocks(markdown_text: str) -> list[tuple[str, str]]:
    lines = markdown_text.splitlines()
    headings = extract_headings(lines)
    blocks: list[tuple[str, str]] = []

    for match in MERMAID_BLOCK_RE.finditer(markdown_text):
        block = match.group(1).strip() + "\n"
        line_index = markdown_text[: match.start()].count("\n")
        title = nearest_heading(headings, line_index)
        blocks.append((title, block))

    return blocks


def resolve_mmdc_command() -> list[str]:
    mmdc = shutil.which("mmdc")
    if mmdc:
        return [mmdc]
    npx = shutil.which("npx")
    if npx:
        return [npx, "-y", "@mermaid-js/mermaid-cli@10.9.1"]
    raise RuntimeError(
        "Could not find 'mmdc' or 'npx'. Install Node.js and Mermaid CLI first."
    )


def find_browser_executable() -> str | None:
    candidates = [
        Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
        Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
        Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return None


def render_diagram(
    mmdc_cmd: list[str],
    input_path: Path,
    output_path: Path,
    puppeteer_config: Path | None,
) -> None:
    cmd = [
        *mmdc_cmd,
        "-i",
        str(input_path),
        "-o",
        str(output_path),
        "-b",
        "transparent",
    ]
    if puppeteer_config is not None:
        cmd.extend(["-p", str(puppeteer_config)])
    subprocess.run(cmd, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export Mermaid diagrams from API-SCHEMA-RELATION.md"
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("API-SCHEMA-RELATION.md"),
        help="Path to markdown source file.",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("diagrams/api-schema-relations"),
        help="Directory where rendered diagrams are written.",
    )
    parser.add_argument(
        "--format",
        choices=["svg", "png"],
        default="svg",
        help="Output image format.",
    )
    parser.add_argument(
        "--extract-only",
        action="store_true",
        help="Only write .mmd files, do not render images.",
    )

    args = parser.parse_args()
    source_path = args.source.resolve()

    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    markdown = source_path.read_text(encoding="utf-8")
    blocks = find_blocks(markdown)
    if not blocks:
        raise RuntimeError("No Mermaid blocks found in source file.")

    out_dir = args.out_dir.resolve()
    mmd_dir = out_dir / "mmd"
    out_dir.mkdir(parents=True, exist_ok=True)
    mmd_dir.mkdir(parents=True, exist_ok=True)

    mmdc_cmd: list[str] | None = None
    puppeteer_config_path: Path | None = None
    if not args.extract_only:
        mmdc_cmd = resolve_mmdc_command()
        browser_executable = find_browser_executable()
        if browser_executable:
            config_data = {
                "executablePath": browser_executable,
                "args": ["--no-sandbox", "--disable-setuid-sandbox"],
            }
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                suffix=".json",
                delete=False,
            ) as temp_file:
                json.dump(config_data, temp_file)
                puppeteer_config_path = Path(temp_file.name)

    for index, (title, mermaid) in enumerate(blocks, start=1):
        base_name = f"{index:02d}-{slugify(title)}"
        mmd_path = mmd_dir / f"{base_name}.mmd"
        image_path = out_dir / f"{base_name}.{args.format}"

        mmd_path.write_text(mermaid, encoding="utf-8")

        if mmdc_cmd is not None:
            render_diagram(
                mmdc_cmd,
                mmd_path,
                image_path,
                puppeteer_config_path,
            )
            print(f"Rendered: {image_path}")
        else:
            print(f"Extracted: {mmd_path}")

    print(f"Completed. Diagrams processed: {len(blocks)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

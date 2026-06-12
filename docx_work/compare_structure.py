from __future__ import annotations

import re
from pathlib import Path

from docx import Document


def interesting(text: str, idx: int) -> bool:
    t = re.sub(r"\s+", " ", text.strip())
    u = t.upper().rstrip(":")
    if idx < 130:
        return True
    labels = {
        "DECLARATION",
        "CERTIFICATE",
        "ACKNOWLEDGMENT",
        "ACKNOWLEDGEMENTS",
        "CONTENTS",
        "TABLE OF CONTENTS",
        "ABSTRACT",
        "INTRODUCTION",
    }
    return (
        u in labels
        or "LIST OF" in u
        or "CHAPTER" in u
        or u.startswith(("AIM", "OBJECTIVE", "MATERIAL", "RESULT", "DISCUSSION", "CONCLUSION", "REFERENCES", "BIBLIOGRAPHY"))
    )


for name, path in [
    ("template", Path("D:/E-Cycle/E-Cycle/docx_work/template.docx")),
    ("thesis", Path("D:/E-Cycle/E-Cycle/docx_work/harish_thesis_original.docx")),
]:
    doc = Document(path)
    print(f"\n{name.upper()}")
    for i, p in enumerate(doc.paragraphs):
        text = re.sub(r"\s+", " ", p.text.strip())
        if text and interesting(text, i):
            print(f"{i:03d}: {text[:130]}")

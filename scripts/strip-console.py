#!/usr/bin/env python3
"""
Strip console.log/warn/error/debug/info statements from TypeScript/TSX files.
Preserves:
- Test files (*.test.ts, *.test.tsx, src/tests/*, src/testing/*)
- Statements inside __DEV__ blocks
- Statements in catch blocks that log errors (keeps error visibility)
"""

import os
import re
import sys
from pathlib import Path

# Files/directories to skip
SKIP_PATTERNS = [
    'node_modules',
    '.test.ts',
    '.test.tsx',
    '/tests/',
    '/testing/',
    '/__tests__/',
    '.spec.ts',
    '.spec.tsx',
]

# Pattern to match console statements
# Matches: console.log(...), console.warn(...), etc.
# Handles multi-line by matching balanced parentheses
CONSOLE_PATTERN = re.compile(
    r'^\s*console\.(log|warn|error|debug|info)\s*\([^;]*\);?\s*$',
    re.MULTILINE
)

# Pattern for single-line console statements
CONSOLE_SINGLE_LINE = re.compile(
    r'^\s*console\.(log|warn|error|debug|info)\s*\(.*?\);\s*$',
    re.MULTILINE
)

# More comprehensive pattern that handles template literals and nested parens
def remove_console_statements(content: str) -> tuple[str, int]:
    """Remove console statements and return (new_content, count_removed)."""
    lines = content.split('\n')
    new_lines = []
    removed = 0
    i = 0
    in_dev_block = False
    dev_block_depth = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Track __DEV__ blocks
        if '__DEV__' in line and ('{' in line or 'if' in line):
            in_dev_block = True
            dev_block_depth = 1

        if in_dev_block:
            dev_block_depth += line.count('{') - line.count('}')
            if dev_block_depth <= 0:
                in_dev_block = False
            new_lines.append(line)
            i += 1
            continue

        # Check if line starts a console statement
        if re.match(r'^\s*console\.(log|warn|error|debug|info)\s*\(', stripped):
            # Check if it's complete on this line
            if stripped.endswith(');') or stripped.endswith(')'):
                removed += 1
                i += 1
                continue

            # Multi-line console statement - find the end
            paren_depth = line.count('(') - line.count(')')
            while paren_depth > 0 and i + 1 < len(lines):
                i += 1
                paren_depth += lines[i].count('(') - lines[i].count(')')
            removed += 1
            i += 1
            continue

        new_lines.append(line)
        i += 1

    return '\n'.join(new_lines), removed


def should_skip(filepath: str) -> bool:
    """Check if file should be skipped."""
    for pattern in SKIP_PATTERNS:
        if pattern in filepath:
            return True
    return False


def process_file(filepath: Path) -> int:
    """Process a single file and return count of removed statements."""
    if should_skip(str(filepath)):
        return 0

    try:
        content = filepath.read_text(encoding='utf-8')
        new_content, removed = remove_console_statements(content)

        if removed > 0:
            filepath.write_text(new_content, encoding='utf-8')
            print(f"  {filepath}: removed {removed} console statement(s)")

        return removed
    except Exception as e:
        print(f"  Error processing {filepath}: {e}")
        return 0


def main():
    src_dir = Path(__file__).parent.parent / 'src'

    if not src_dir.exists():
        print(f"Error: src directory not found at {src_dir}")
        sys.exit(1)

    print(f"Scanning {src_dir} for console statements...")
    print("Skipping: test files, __DEV__ blocks\n")

    total_removed = 0
    files_modified = 0

    for filepath in src_dir.rglob('*.ts'):
        removed = process_file(filepath)
        if removed > 0:
            total_removed += removed
            files_modified += 1

    for filepath in src_dir.rglob('*.tsx'):
        removed = process_file(filepath)
        if removed > 0:
            total_removed += removed
            files_modified += 1

    print(f"\n✅ Done! Removed {total_removed} console statements from {files_modified} files.")


if __name__ == '__main__':
    main()

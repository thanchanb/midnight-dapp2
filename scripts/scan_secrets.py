#!/usr/bin/env python3
import os
import re
import sys
import subprocess

# Directory to scan
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Excluded paths
EXCLUDED_DIRS = {
    ".git",
    "node_modules",
    "dist",
    "managed",
    "public/managed",
    "assets",
    "scratch",
}

EXCLUDED_FILES = {
    "package-lock.json",
    "scan_secrets.py",
}

# Regex patterns for insecure secret handling and fallbacks in working files
PATTERNS = [
    # Fallback env patterns: process.env.X || '...'
    (r"process\.env\.[A-Za-z0-9_]+\s*\|\|\s*['\"][^'\"]+['\"]", "Insecure fallback default for environment variable"),
    # Hardcoded private keys / mnemonics
    (r"(?i)(private_key|privateKey|mnemonic|secret_seed)\s*[:=]\s*['\"][0-9a-zA-Z\s]{20,}['\"]", "Potential hardcoded private key or seed phrase"),
    # Insecure storage of encryption keys in browser storage
    (r"(sessionStorage|localStorage)\.setItem\(\s*['\"][^'\"]*key['\"]\s*,", "Plaintext storage of key in browser storage"),
    # Hardcoded test passphrase
    (r"midnight_secret_e2e_verification_2026", "Compromised historical test passphrase found"),
    (r"Mdn!Priv8Vault2026#SecStorageState\$", "Compromised historical fallback password found"),
]

# Patterns specifically checked across full git commit history (git log -p)
GIT_HISTORY_PATTERNS = [
    (r"(?i)(private_key|privateKey|mnemonic|secret_seed)\s*[:=]\s*['\"][0-9a-zA-Z\s]{20,}['\"]", "Potential hardcoded private key or seed phrase in git commit history"),
    (r"(?i)midnight_wallet_seed\s*[:=]\s*['\"][0-9a-zA-Z\s]{20,}['\"]", "Hardcoded MIDNIGHT_WALLET_SEED in git commit history"),
    (r"(?i)-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----", "Raw private key block in git commit history"),
]

def scan_files():
    print("=" * 60)
    print("  Midnight ShadowVault Automated Secret & Security Scanner   ")
    print("  [Filesystem & Git History: README, REPORT, SECURITY, .env]  ")
    print("=" * 60)

    violations = []
    scanned_count = 0

    # 1. Scan filesystem (including README, REPORT, SECURITY, .env.example)
    for root, dirs, files in os.walk(ROOT_DIR):
        rel_root = os.path.relpath(root, ROOT_DIR)
        
        # Skip excluded dirs
        if any(rel_root == ex or rel_root.startswith(ex + os.sep) for ex in EXCLUDED_DIRS):
            continue

        for file in files:
            if file in EXCLUDED_FILES:
                continue

            # Explicitly include README, REPORT, SECURITY, .env.example, and standard source extensions
            ext = os.path.splitext(file)[1]
            base = os.path.basename(file)
            is_target_doc = base in {"README.md", "REPORT.md", "SECURITY.md", "AUDIT.md", ".env.example", ".env"}
            is_target_code = ext in {".ts", ".js", ".compact", ".json", ".html", ".sh", ".yml", ".yaml", ".md", ".example"}

            if not (is_target_doc or is_target_code):
                continue

            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, ROOT_DIR)
            scanned_count += 1

            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_no, line in enumerate(f, start=1):
                        for pattern, desc in PATTERNS:
                            if re.search(pattern, line):
                                violations.append((rel_path, line_no, desc, line.strip()))
            except Exception as e:
                print(f"Error reading {rel_path}: {e}")

    print(f"\n[1/2] Scanned {scanned_count} files across repository (including README, REPORT, SECURITY, .env.example).")

    # 2. Scan full git history (git log -p)
    print("[2/2] Scanning full git commit history (git log -p)...")
    git_violations = 0
    try:
        proc = subprocess.run(["git", "log", "-p"], cwd=ROOT_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        git_diff = proc.stdout
        commit_hash = "unknown"
        for line in git_diff.splitlines():
            if line.startswith("commit "):
                commit_hash = line.split()[1][:10]
            if line.startswith("+") and not line.startswith("+++"):
                for pattern, desc in GIT_HISTORY_PATTERNS:
                    if re.search(pattern, line):
                        violations.append((f"git commit {commit_hash}", 0, desc, line.strip()))
                        git_violations += 1
        print(f"      ✓ Git history scanned: {len(git_diff.splitlines())} lines parsed.")
    except Exception as e:
        print(f"\n❌ FATAL: Could not inspect git history: {e}")
        sys.exit(1)

    if violations:
        print(f"\n❌ FOUND {len(violations)} SECURITY VIOLATION(S):")
        for file, line, desc, content in violations:
            loc = f"{file}:{line}" if line > 0 else file
            print(f"  • {loc} - {desc}")
            print(f"    Code: {content}")
        print("\nPlease remediate the violations above by removing hardcoded fallbacks/secrets.\n")
        sys.exit(1)
    else:
        print("\n✓ Zero hardcoded credentials, secret leaks, or insecure fallbacks detected in workspace or git history!")
        print("=" * 60 + "\n")
        sys.exit(0)

if __name__ == "__main__":
    scan_files()

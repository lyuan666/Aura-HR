#!/usr/bin/env python3
"""
End-to-end test for ODL PDF Extraction Service.

Prerequisites:
  - ODL service running on localhost:8900
  - Test PDF at the expected path
  - Python `requests` library installed

Usage:
  python3 scripts/odl-service/test_e2e.py
"""

import os
import sys
import time

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL = os.environ.get("ODL_TEST_URL", "http://localhost:8900")
PDF_PATH = "/Users/lee/Downloads/【私域渠道女装运营经理_杭州 25-50K】郭煌辉 8年.pdf"
EXTRACT_ENDPOINT = f"{BASE_URL}/extract"
HEALTH_ENDPOINT = f"{BASE_URL}/health"
SPEED_ROUNDS = 3
SPEED_THRESHOLD = 3.0  # seconds


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
class TestResult:
    """Accumulates pass/fail counts for a single test function."""

    def __init__(self, name: str):
        self.name = name
        self.passed = 0
        self.failed = 0

    def check(self, label: str, condition: bool, detail: str = ""):
        status = "PASS" if condition else "MISSING"
        msg = f"  [{status}] {label}"
        if detail:
            msg += f"  -- {detail}"
        print(msg)
        if condition:
            self.passed += 1
        else:
            self.failed += 1

    def summary(self) -> bool:
        total = self.passed + self.failed
        ok = self.failed == 0
        icon = "OK" if ok else "FAIL"
        print(f"\n  => {self.name}: {self.passed}/{total} passed [{icon}]")
        return ok


# ---------------------------------------------------------------------------
# Test 1: Health check
# ---------------------------------------------------------------------------
def test_health() -> bool:
    print("\n" + "=" * 60)
    print("Test 1: Health Check")
    print("=" * 60)

    r = TestResult("test_health")

    try:
        resp = requests.get(HEALTH_ENDPOINT, timeout=5)
    except requests.ConnectionError:
        print("  [FAIL] Cannot connect to ODL service at", BASE_URL)
        print("         Is the service running?  python3 scripts/odl-service/app.py")
        r.failed += 1
        return r.summary()

    r.check("HTTP status 200", resp.status_code == 200, f"got {resp.status_code}")

    body = resp.json()
    r.check("status == 'ok'", body.get("status") == "ok", f"got '{body.get('status')}'")
    r.check("engine field present", "engine" in body, f"engine='{body.get('engine')}'")

    return r.summary()


# ---------------------------------------------------------------------------
# Test 2: PDF extraction
# ---------------------------------------------------------------------------
def test_extract() -> bool:
    print("\n" + "=" * 60)
    print("Test 2: PDF Extraction")
    print("=" * 60)

    r = TestResult("test_extract")

    # Verify PDF exists
    if not os.path.isfile(PDF_PATH):
        print(f"  [FAIL] Test PDF not found: {PDF_PATH}")
        r.failed += 1
        return r.summary()

    with open(PDF_PATH, "rb") as f:
        files = {"file": (os.path.basename(PDF_PATH), f, "application/pdf")}
        try:
            resp = requests.post(EXTRACT_ENDPOINT, files=files, timeout=60)
        except requests.ConnectionError:
            print("  [FAIL] Cannot connect to ODL service at", BASE_URL)
            r.failed += 1
            return r.summary()

    r.check("HTTP status 200", resp.status_code == 200, f"got {resp.status_code}")

    if resp.status_code != 200:
        print("  Skipping remaining checks due to non-200 response.")
        print(f"  Response body: {resp.text[:500]}")
        return r.summary()

    body = resp.json()
    md = body.get("markdown", "")
    char_count = body.get("char_count", 0)

    # Basic content checks
    r.check("char_count > 100", char_count > 100, f"char_count={char_count}")

    r.check("contains '郭煌辉' (name)", "郭煌辉" in md)
    r.check("contains '1307188' (phone)", "1307188" in md)
    r.check("contains '运营' (job keyword)", "运营" in md)

    # Key field verification
    print("\n  --- Key Field Verification ---")

    r.check("姓名: 郭煌辉", "郭煌辉" in md)

    phone_found = "1307188" in md
    r.check("手机: 1307188*", phone_found)

    age_found = "32" in md
    r.check("年龄: 32", age_found)

    work_found = "杭州盟鸽" in md or "盟鸽" in md
    r.check("工作经历: 杭州盟鸽", work_found,
            "'盟鸽' found" if "盟鸽" in md else "'盟鸽' not found in markdown")

    edu_found = "山西财经大学" in md
    r.check("教育: 山西财经大学", edu_found)

    # Print a short preview
    preview = md[:200].replace("\n", " ") if md else "(empty)"
    print(f"\n  Markdown preview: {preview}...")

    return r.summary()


# ---------------------------------------------------------------------------
# Test 3: Speed benchmark
# ---------------------------------------------------------------------------
def test_speed() -> bool:
    print("\n" + "=" * 60)
    print(f"Test 3: Speed Benchmark ({SPEED_ROUNDS} rounds)")
    print("=" * 60)

    r = TestResult("test_speed")

    if not os.path.isfile(PDF_PATH):
        print(f"  [FAIL] Test PDF not found: {PDF_PATH}")
        r.failed += 1
        return r.summary()

    elapsed_list = []
    for i in range(SPEED_ROUNDS):
        with open(PDF_PATH, "rb") as f:
            files = {"file": (os.path.basename(PDF_PATH), f, "application/pdf")}
            try:
                resp = requests.post(EXTRACT_ENDPOINT, files=files, timeout=60)
            except requests.ConnectionError:
                print("  [FAIL] Cannot connect to ODL service at", BASE_URL)
                r.failed += 1
                return r.summary()

        if resp.status_code != 200:
            print(f"  [FAIL] Round {i+1}: HTTP {resp.status_code}")
            r.failed += 1
            return r.summary()

        body = resp.json()
        elapsed = body.get("elapsed_seconds", 0)
        elapsed_list.append(elapsed)
        print(f"  Round {i+1}: {elapsed:.2f}s")

    avg = sum(elapsed_list) / len(elapsed_list)
    print(f"\n  Average: {avg:.2f}s  (threshold: {SPEED_THRESHOLD}s)")

    r.check(f"average < {SPEED_THRESHOLD}s", avg < SPEED_THRESHOLD, f"avg={avg:.2f}s")

    return r.summary()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("ODL Service End-to-End Test")
    print(f"Target: {BASE_URL}")
    print(f"PDF:    {PDF_PATH}")

    results = []
    results.append(test_health())
    results.append(test_extract())
    results.append(test_speed())

    total_pass = sum(results)
    total_tests = len(results)

    print("\n" + "=" * 60)
    print(f"OVERALL: {total_pass}/{total_tests} test groups passed")
    print("=" * 60)

    if total_pass == total_tests:
        print("All tests passed.")
        sys.exit(0)
    else:
        print("Some tests FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()

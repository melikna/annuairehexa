"""Small bounded HTTP smoke load; run against staging before production."""
import argparse
import collections
import concurrent.futures
import json
import time
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('base_url')
args = parser.parse_args()
paths = ['/', '/regions', '/sources', '/robots.txt'] * 25

def request(path):
    start = time.monotonic()
    try:
        with urllib.request.urlopen(args.base_url.rstrip('/') + path, timeout=20) as response:
            response.read(2 * 1024 * 1024)
            status = str(response.status)
    except Exception as error:
        status = type(error).__name__
    return status, time.monotonic() - start

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(request, paths))
print(json.dumps({
    'requests': len(results),
    'concurrency': 4,
    'statuses': dict(collections.Counter(status for status, _ in results)),
    'max_seconds': round(max(duration for _, duration in results), 3),
}, indent=2))
raise SystemExit(0 if all(status == '200' for status, _ in results) else 1)

#!/usr/bin/env python3
"""Publish reviewed media through scoped, expiring release capabilities.

1. --prepare creates private token and assessment/release SQL files.
2. Apply the SQL through the owner's connected database tool (not this script).
3. --upload sends the fixed bytes. No service key or account password is used.
Never commit or print the private job file. It is not a learner upload endpoint.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--prepare', action='store_true')
parser.add_argument('--upload', action='store_true')
parser.add_argument('--media', type=Path, required=True)
parser.add_argument('--jobs', type=Path, required=True)
parser.add_argument('--assessment-keys', type=Path)
args = parser.parse_args()
repo_root = Path(__file__).resolve().parent.parent
if args.jobs.resolve().is_relative_to(repo_root) or (args.assessment_keys and args.assessment_keys.resolve().is_relative_to(repo_root)):
    parser.error('Private job and assessment files must stay outside the repository')
if args.prepare == args.upload:
    parser.error('Choose exactly one of --prepare or --upload')

if args.prepare:
    if not args.assessment_keys:
        parser.error('--assessment-keys must point to the private trainer package; never a repository file')
    assessments = {(p['key'],p['version']):p['answers'] for p in json.loads(args.assessment_keys.read_text())}
    jobs, sql = [], ['-- PRIVATE assessment keys and fixed releases; never commit. No raw release token in this SQL.']
    for source in sorted(args.media.glob('*/manifest.json')):
        m = json.loads(source.read_text())
        key, version, digest = m['key'], m['version'], m['sha256']
        assert re.fullmatch(r'[a-z0-9-]{1,64}', key)
        assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', version)
        assert re.fullmatch(r'[a-f0-9]{64}', digest)
        video = source.parent / (key + '.mp4')
        assert video.stat().st_size == m['size_bytes']
        assert hashlib.sha256(video.read_bytes()).hexdigest() == digest
        token = secrets.token_hex(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        answers=assessments[(key,version)]
        assert isinstance(answers,list) and len(answers)==6 and all(type(x) is int and 0<=x<3 for x in answers)
        sql.append(f"update opspilot_private.training_programs set assessment_key='{json.dumps(answers)}'::jsonb where program_key='{key}' and version='{version}' and assessment_key is null;")
        jobs.append({'key': key, 'video': str(video.resolve()), 'token': token})
        sql.append("insert into opspilot_private.training_media_releases(token_hash,program_key,version,expires_at) "
                   f"values('{token_hash}','{key}','{version}',now()+interval '15 minutes');")
    assert len(jobs) > 0
    # O_EXCL prevents overwriting an unknown or pending release capability.
    with os.fdopen(os.open(args.jobs, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as f:
        json.dump(jobs, f)
    with os.fdopen(os.open(args.jobs.with_suffix('.sql'),os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w') as f:
        f.write('\n'.join(sql) + '\n')
    print(f'{len(jobs)} fixed releases prepared. Apply the private assessment/release SQL through the owner connection before uploading; never commit it.')
else:
    jobs = json.loads(args.jobs.read_text())
    endpoint = 'https://hpqfmuzkkxrqoqoabjmb.supabase.co/functions/v1/training-content-release'
    for job in jobs:
        assert re.fullmatch(r'[a-f0-9]{64}', job['token'])
        data = Path(job['video']).read_bytes()
        req = urllib.request.Request(endpoint, data=data, method='POST', headers={
            'Content-Type': 'video/mp4', 'x-opspilot-release-token': job['token'],
        })
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                result = json.loads(response.read())
            assert result.get('result') in ['imported', 'already_imported']
            print(f'{job["key"]}: {result["result"]}', flush=True)
        except urllib.error.HTTPError as e:
            # No request headers, token, URL query, or provider secret is logged.
            raise SystemExit(f'{job["key"]}: upload stopped (HTTP {e.code}); inspect release state before retrying.') from None

"""Offline build preflight; never change workstation processes or application settings."""
import ctypes
import json
import os
from pathlib import Path
import subprocess
import sys

class MemoryStatus(ctypes.Structure):
    _fields_ = [('length', ctypes.c_ulong), ('load', ctypes.c_ulong)] + [(name, ctypes.c_ulonglong) for name in ('totalPhysical', 'availablePhysical', 'totalPageFile', 'availablePageFile', 'totalVirtual', 'availableVirtual', 'availableExtended')]

root = Path(__file__).resolve().parents[1]
mem = MemoryStatus()
mem.length = ctypes.sizeof(mem)
ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(mem))
free_mib = mem.availablePhysical // 1048576
status = {'availablePhysicalMiB': free_mib, 'requiredStartMiB': 3072, 'authority': 'local build verification only; no deployment'}
if free_mib < 3072:
    status.update(result='BLOCKED', reason='Insufficient free RAM; build was not started.')
    (root / 'qa-resume/build-preflight.json').write_text(json.dumps(status, indent=2))
    print(json.dumps(status))
    sys.exit(3)
if len(sys.argv) < 2:
    sys.exit('Pass an existing Node 20 or 22 executable as the only argument.')
node = str(Path(sys.argv[1]).resolve(strict=True))
version = subprocess.check_output([node, '--version'], text=True).strip()
if int(version.lstrip('v').split('.')[0]) not in (20, 22):
    sys.exit('Node 20 or 22 is required.')
status.update(result='READY', node=version)
(root / 'qa-resume/build-preflight.json').write_text(json.dumps(status, indent=2))
env = os.environ.copy()
env['PROFILE_MAX_SECONDS'] = '240'
# Existing wrapper samples every 2s, stops below 384 MiB, and retains logs.
command = [sys.executable, str(root / 'qa-stabilization/profile-command.py'), 'resume-production-build', node, '--max-old-space-size=1536', str(root / 'node_modules/vite/bin/vite.js'), 'build', '--config', str(root / 'vite.stabilization-build.config.ts')]
sys.exit(subprocess.call(command, cwd=root / 'qa-stabilization/empty-env', env=env))

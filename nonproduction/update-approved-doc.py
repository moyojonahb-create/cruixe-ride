from pathlib import Path
p=Path('nonproduction/approved-ride-ui/IMPLEMENTATION.md')
s=p.read_text(encoding='utf-8-sig').replace('powershell -File nonproduction/approved-ride-ui/integrate-ui.ps1','python nonproduction/approved-ride-ui/integrate-ui.py').replace('with `-Apply`','with `--apply`')
s+='\nThe PowerShell helper is also included, but local execution policy blocks it. Use the Python helper above; no execution-policy change is needed. The check-only Python run passed for all seven paths.\n'
p.write_text(s,encoding='utf-8')

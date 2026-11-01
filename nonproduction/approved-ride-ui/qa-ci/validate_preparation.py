import ast,hashlib,json,re,tarfile
from pathlib import Path
root=Path.cwd();ci=root/'qa-ci';checks={}
workflow=json.loads((ci/'workflow-parsed.json').read_text());manifest=json.loads((ci/'review/review-manifest.json').read_text());text=(root/'../../.github/workflows/cruixe-approved-frontend-verify.yml').read_text('utf-8-sig')
def check(name,value):
 checks[name]='PASS' if value else 'FAIL'
 if not value:raise AssertionError(name)
try:
 check('read_only_token',workflow['permissions']=={'contents':'read'})
 check('branch_limited_push',workflow['on']['push']['branches']==['verify/cruixe-approved-ui-*'])
 check('no_pr_or_deployment_trigger',set(workflow['on'])=={'push','workflow_dispatch'} and workflow['name']!='CI')
 check('manual_ref_guard',workflow['jobs']['verify']['if']=="startsWith(github.ref, 'refs/heads/verify/cruixe-approved-ui-')")
 check('no_secrets_or_deployment_environment','secrets.' not in text and 'environment' not in workflow['jobs']['verify'])
 check('immutable_action_pins',all(re.search(r'@[a-f0-9]{40}$',step['uses']) for step in workflow['jobs']['verify']['steps'] if 'uses' in step))
 check('immutable_node_image',workflow['jobs']['verify']['env']['NODE_IMAGE']==manifest['nodeImage'] and '@sha256:' in manifest['nodeImage'])
 scripts=[step['run'] for step in workflow['jobs']['verify']['steps'] if 'run' in step]
 check('network_none_and_no_docker_socket',any('docker run' in s and '--network none' in s and '--read-only' in s and '--cap-drop ALL' in s for s in scripts) and 'docker.sock' not in text)
 check('locked_install_scripts_disabled',any('npm ci --ignore-scripts --no-audit --no-fund' in s for s in scripts))
 check('always_retains_artifacts',any(step.get('if')=='always()' and step.get('uses','').startswith('actions/upload-artifact@') for step in workflow['jobs']['verify']['steps']))
 for script in scripts:
  for match in re.finditer(r"python3 - <<'PY'\n(.*?)\nPY",script,re.S):ast.parse(match.group(1))
 check('inline_python_syntax',True)
 archive=ci/'review/approved-frontend-ci.tgz';check('archive_sha',hashlib.sha256(archive.read_bytes()).hexdigest()==manifest['archiveSHA256'])
 expected={f['path']:f for f in manifest['files']};seen=set()
 with tarfile.open(archive,'r:gz') as tar:
  for member in tar:
   check('archive_paths_are_safe',member.isfile() and member.name in expected and not Path(member.name).is_absolute() and '..' not in Path(member.name).parts and not any(p.startswith('.env') or p in ['node_modules','.git','.npmrc'] for p in Path(member.name).parts))
   data=tar.extractfile(member).read();check('snapshot_file_hashes',hashlib.sha256(data).hexdigest()==expected[member.name]['sha256']);seen.add(member.name)
 check('all_snapshot_files_present',seen==set(expected))
 approved=json.loads((root/'qa-resume/source-manifest.json').read_text())
 check('all_eight_approved_app_hashes_preserved',len(approved['changes'])==8 and all(hashlib.sha256((root/f['path']).read_bytes()).hexdigest()==f['afterSHA256'] for f in approved['changes']))
 check('focused_nine_suites_exist',all((root/'src/test'/name).is_file() for name in ['BookingConfiguration.isolated.test.tsx','DestinationSearchScreen.test.tsx','PaymentMethodSelector.test.tsx','RiderNavigation.test.tsx','RideSelectionCards.test.tsx','RideSelectionDraft.test.tsx','DestinationSearchPipeline.test.tsx','requestRide.test.ts','NoteToDriverSheet.test.tsx']))
 result={'status':'PASS','scope':'Static preparation validation only; no application compiler, Vitest, build, Docker or GitHub run executed','checks':checks,'snapshotFiles':len(seen)}
except Exception as error:result={'status':'FAIL','checks':checks,'failure':str(error)}
(ci/'preparation-validation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));raise SystemExit(0 if result['status']=='PASS' else 1)

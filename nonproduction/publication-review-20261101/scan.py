from pathlib import Path,PurePosixPath
import json,re,hashlib,tarfile,zipfile,base64,math,collections
from urllib.parse import urlsplit
root=Path.cwd();out=root/'nonproduction/publication-review-20261101';inv=json.loads((out/'inventory.json').read_text());files=[];excluded=list(inv['excluded']);findings=[];archives=[]
placeholder=re.compile(r'(?:your[_ -]|example|placeholder|redacted|changeme|dummy|fake|replace[_ -]|x{6}|0{8}|test[_-](?:key|token|secret))',re.I)
patterns=[('private key',rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----[\sA-Za-z0-9+/=]{100,}-----END (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),('GitHub token',rb'(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{40,})'),('AWS access key',rb'(?:AKIA|ASIA)[A-Z0-9]{16}'),('Stripe secret',rb'(?:sk|rk)_live_[A-Za-z0-9]{16,}')]
def record(path,kind,data,m):findings.append({'path':path,'kind':kind,'line':data[:m.start()].count(b'\n')+1,'fingerprint':hashlib.sha256(m.group()).hexdigest()[:12]})
def scan(path,data):
 if b'\0' in data[:8192]:return
 for kind,pattern in patterns:
  for m in re.finditer(pattern,data):
   if not placeholder.search(m.group().decode('ascii','ignore')):record(path,kind,data,m)
 for m in re.finditer(rb'eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{16,}',data):
  try:payload=json.loads(base64.urlsafe_b64decode(m.group().split(b'.')[1]+b'==='))
  except Exception:continue
  if payload.get('role')!='anon':record(path,'non-public JWT',data,m)
 for m in re.finditer(rb'(?:postgres(?:ql)?|mysql|redis(?:s)?)://[^\s\"\x27<>]+',data,re.I):
  value=m.group().decode('utf-8','ignore');uri=urlsplit(value);host=uri.hostname
  if uri.password is not None and host not in ['localhost','127.0.0.1','::1','postgres','db','redis','test'] and not placeholder.search(value):record(path,'nonlocal credential-bearing database URI',data,m)
 for m in re.finditer(rb'(?i)(?:\b[a-z0-9_]{0,60}(?:secret|password|access_token|api_key|auth_token)[a-z0-9_]{0,40}\b)\s*[=:]\s*[\"\x27]([^\"\x27\r\n]{24,})[\"\x27]',data):
  v=m.group(1).decode('utf-8','ignore')
  if placeholder.search(v) or v.startswith(('http','${','process.','import.','env.')) or re.fullmatch(r'[A-Z_]+',v):continue
  counts=collections.Counter(v);entropy=-sum(n/len(v)*math.log2(n/len(v)) for n in counts.values())
  if entropy>4.0 and ' ' not in v and len(v)<200:record(path,'high-entropy credential assignment for review',data,m)
def forbidden_name(path):
 name=PurePosixPath(path).name.lower();return (name.startswith('.env') and not any(s in name for s in ['example','sample','template'])) or name in ['id_rsa','id_ed25519','credentials.json','service-account.json','settings.local.json'] or name.endswith(('.pfx','.p12','.key','.pem'))
for f in inv['files']:
 p=f['path']
 if any(part in ['.vite-cache','npm-cache','vitest-cache','typecheck-shared-trace','dependency-repair'] for part in PurePosixPath(p).parts) or p.endswith('/jsdom-20.0.3.tgz'):
  excluded.append({'path':p,'reason':'generated dependency cache, downloaded package or compiler profile'});continue
 if p=='nonproduction/publication-inventory.py':excluded.append({'path':p,'reason':'this publication inventory helper'});continue
 if f['status']=='DELETED':files.append(f);continue
 if forbidden_name(p):excluded.append({'path':p,'reason':'local environment, credential or private configuration file; not read/published'});continue
 data=(root/p).read_bytes();f['sha256']=hashlib.sha256(data).hexdigest()
 if len(data)>=100*1048576:findings.append({'path':p,'kind':'GitHub file-size limit'});continue
 scan(p,data)
 if p.endswith(('.tgz','.tar.gz','.zip')):
  total=0;count=0
  if p.endswith('.zip'):
   with zipfile.ZipFile(root/p) as z:
    for member in z.infolist():
     if member.is_dir():continue
     total+=member.file_size;count+=1
     if total>256*1048576:raise RuntimeError('Archive size limit: '+p)
     if forbidden_name(member.filename):findings.append({'path':p+'!'+member.filename,'kind':'sensitive archive filename'})
     scan(p+'!'+member.filename,z.read(member))
  else:
   with tarfile.open(root/p,'r:gz') as z:
    for member in z:
     if not member.isfile():continue
     total+=member.size;count+=1
     if total>256*1048576:raise RuntimeError('Archive size limit: '+p)
     if forbidden_name(member.name):findings.append({'path':p+'!'+member.name,'kind':'sensitive archive filename'})
     scan(p+'!'+member.name,z.extractfile(member).read())
  archives.append({'path':p,'files':count,'uncompressedBytes':total})
 files.append(f)
report={'status':'PASS' if not findings else 'BLOCKED','files':len(files),'bytes':sum(f['bytes'] for f in files),'findings':findings,'archives':archives,'excludedCount':len(excluded),'reviewedFalsePositives':'TestDestinationGuard lines 177/178 use username-only URI fixtures, including loopback IPv6 and TEST-NET-1; no password or service credential. URL parsing corrected to distinguish usernames from passwords.', 'note':'Values never printed. Public anon JWT/client URLs are distinguished from private/session credentials. Local database fixture URIs are not production credentials.'}
(out/'secret-scan.json').write_text(json.dumps(report,indent=2));(out/'reviewed-inventory.json').write_text(json.dumps({'files':files,'excluded':excluded},indent=2));print(json.dumps(report,indent=2))

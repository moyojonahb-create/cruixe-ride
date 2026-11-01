
import subprocess,os,sys,json,time,ctypes
from pathlib import Path
from ctypes import wintypes
class MemoryStatus(ctypes.Structure):
 _fields_=[('length',wintypes.DWORD),('load',wintypes.DWORD),('totalPhysical',ctypes.c_ulonglong),('availablePhysical',ctypes.c_ulonglong),('totalPageFile',ctypes.c_ulonglong),('availablePageFile',ctypes.c_ulonglong),('totalVirtual',ctypes.c_ulonglong),('availableVirtual',ctypes.c_ulonglong),('availableExtended',ctypes.c_ulonglong)]
class ProcessMemory(ctypes.Structure):
 _fields_=[('cb',wintypes.DWORD),('PageFaultCount',wintypes.DWORD)]+[(n,ctypes.c_size_t) for n in ['PeakWorkingSetSize','WorkingSetSize','QuotaPeakPagedPoolUsage','QuotaPagedPoolUsage','QuotaPeakNonPagedPoolUsage','QuotaNonPagedPoolUsage','PagefileUsage','PeakPagefileUsage','PrivateUsage']]
class IoCounters(ctypes.Structure):
 _fields_=[(n,ctypes.c_ulonglong) for n in ['ReadOperationCount','WriteOperationCount','OtherOperationCount','ReadTransferCount','WriteTransferCount','OtherTransferCount']]
k=ctypes.windll.kernel32;ps=ctypes.windll.psapi
k.GetProcessTimes.argtypes=[wintypes.HANDLE]+[ctypes.POINTER(wintypes.FILETIME)]*4
ps.GetProcessMemoryInfo.argtypes=[wintypes.HANDLE,ctypes.POINTER(ProcessMemory),wintypes.DWORD]
k.GetProcessIoCounters.argtypes=[wintypes.HANDLE,ctypes.POINTER(IoCounters)]
name=sys.argv[1];command=sys.argv[2:];root=Path(__file__).resolve().parent;logpath=root/(name+'.log');resourcepath=root/(name+'-resources.jsonl')
env=os.environ.copy();env['PATH']=str(Path(command[0]).parent)+os.pathsep+env['PATH']
start=time.monotonic();samples=[];reason=None;last_progress=start;last_signature=None
with logpath.open('w',encoding='utf-8') as log,resourcepath.open('w',encoding='utf-8') as resources:
 p=subprocess.Popen(command,stdout=log,stderr=subprocess.STDOUT,env=env)
 print(json.dumps({'started':name,'pid':p.pid,'command':command}),flush=True)
 while p.poll() is None:
  m=MemoryStatus();m.length=ctypes.sizeof(m);k.GlobalMemoryStatusEx(ctypes.byref(m))
  pm=ProcessMemory();pm.cb=ctypes.sizeof(pm);ps.GetProcessMemoryInfo(p._handle,ctypes.byref(pm),pm.cb)
  times=[wintypes.FILETIME() for _ in range(4)];k.GetProcessTimes(p._handle,*[ctypes.byref(t) for t in times])
  cpu=sum((t.dwHighDateTime<<32)+t.dwLowDateTime for t in times[2:])/10000000
  io=IoCounters();k.GetProcessIoCounters(p._handle,ctypes.byref(io))
  sample={'elapsedSeconds':round(time.monotonic()-start,2),'cpuSeconds':round(cpu,3),'workingSetMB':round(pm.WorkingSetSize/1048576,1),'privateMB':round(pm.PrivateUsage/1048576,1),'availablePhysicalMB':m.availablePhysical//1048576,'memoryLoadPercent':m.load,'readBytes':io.ReadTransferCount,'readOperations':io.ReadOperationCount,'outputBytes':logpath.stat().st_size}
  samples.append(sample);resources.write(json.dumps(sample)+'\n');resources.flush()
  signature=(round(cpu,1),io.ReadTransferCount,io.ReadOperationCount,sample['outputBytes'])
  if signature!=last_signature:last_progress=time.monotonic();last_signature=signature
  if sample['availablePhysicalMB']<384:reason='resource guard: available physical memory below 384 MiB'
  elif time.monotonic()-last_progress>40:reason='stalled: no CPU, read I/O or output progress for 40 seconds'
  elif sample['elapsedSeconds']>int(os.environ.get('PROFILE_MAX_SECONDS','180')):reason='diagnostic budget reached; inspect sampled CPU/I/O and compiler trace'
  if reason:p.kill();break
  time.sleep(2)
 code=p.wait()
status={'name':name,'command':command,'exitCode':code,'terminationReason':reason,'elapsedSeconds':round(time.monotonic()-start,2),'peakWorkingSetMB':max((s['workingSetMB'] for s in samples),default=0),'peakPrivateMB':max((s['privateMB'] for s in samples),default=0),'minAvailablePhysicalMB':min((s['availablePhysicalMB'] for s in samples),default=None),'cpuSeconds':samples[-1]['cpuSeconds'] if samples else 0}
(root/(name+'-status.json')).write_text(json.dumps(status,indent=2));print(json.dumps(status),flush=True)

sys.exit(code if reason is None else 3)

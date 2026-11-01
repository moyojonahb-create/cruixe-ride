import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const root='/work',out='/evidence',require=createRequire('/work/package.json');
await fs.mkdir(out,{recursive:true});
const report={authority:'ISOLATED frontend verification; no authenticated integration or deployment',commit:process.env.CRUIXE_COMMIT,gates:Object.fromEntries(['network','source','typescript','vitest','eslint','productionBuild','screenshots'].map(name=>[name,{status:'NOT RUN'}])),frontendIntegration:'NO-GO',productionRelease:'NO-GO'};
const save=()=>fs.writeFile(path.join(out,'readiness.json'),JSON.stringify(report,null,2));
await save();
try {
 if(process.version!=='v22.23.4')throw Error('Unexpected Node version');
 const interfaces=await fs.readdir('/sys/class/net');
 if(interfaces.some(name=>name!=='lo'))throw Error('Refusing checks: network is not loopback-only');
 const outbound=await new Promise(resolve=>{const s=net.connect({host:'192.0.2.1',port:443});s.setTimeout(1000);s.once('connect',()=>{s.destroy();resolve('CONNECTED');});s.once('error',e=>resolve(e.code));s.once('timeout',()=>{s.destroy();resolve('TIMEOUT');});});
 if(!['ENETUNREACH','EHOSTUNREACH'].includes(outbound))throw Error('Outbound isolation canary did not fail closed');
 report.gates.network={status:'PASS',interfaces,outbound,target:'RFC5737 documentation address; no production host probed'};
 const manifest=JSON.parse(await fs.readFile('/review-manifest.json','utf8'));
 for(const file of manifest.files){const data=await fs.readFile(path.join(root,file.path));if(crypto.createHash('sha256').update(data).digest('hex')!==file.sha256)throw Error('Snapshot mismatch: '+file.path);}
 report.gates.source={status:'PASS',files:manifest.files.length,archiveSHA256:manifest.archiveSHA256,packageLockSHA256:manifest.packageLockSHA256};
 report.tools=Object.fromEntries(['typescript','vitest','vite','eslint'].map(name=>[name,require(name+'/package.json').version]));report.tools.node=process.version;
 await fs.mkdir('/work/qa-ci/empty-env',{recursive:true});
 const env={PATH:process.env.PATH,HOME:'/tmp',CI:'true',TZ:'Africa/Johannesburg',NO_COLOR:'1',VITE_SUPABASE_URL:'http://127.0.0.1:9',VITE_SUPABASE_PUBLISHABLE_KEY:'isolated-ci-unusable-key',VITE_GO_BACKEND_URL:'http://127.0.0.1:9',VITE_WS_URL:'ws://127.0.0.1:9'};
 const suites=['BookingConfiguration.isolated','DestinationSearchScreen','PaymentMethodSelector','RiderNavigation','RideSelectionCards','RideSelectionDraft','DestinationSearchPipeline','requestRide','NoteToDriverSheet'].map(name=>'src/test/'+name+(name==='requestRide'?'.test.ts':'.test.tsx'));
 const scoped=['src/components/ride/RideTierSelector.tsx','src/components/ride/NoteToDriverSheet.tsx','src/components/ride/ScheduleRide.tsx','src/components/ride/BookingForSomeoneElse.tsx','src/components/ride/ParcelBookingSheet.tsx','src/components/ride/ShareRideSheet.tsx','src/pages/RideMatching.tsx','src/test/NoteToDriverSheet.test.tsx'];
 const gates=[
 ['typescript',1536,['node_modules/typescript/bin/tsc','--noEmit','-p','tsconfig.app.json','--extendedDiagnostics','--pretty','false'],300,root],
 ['vitest',1024,['node_modules/vitest/vitest.mjs','run','--config','vitest.stabilization.config.ts',...suites,'--reporter=default','--reporter=json','--outputFile=/evidence/vitest-results.json'],360,root],
 ['eslint',512,['node_modules/eslint/bin/eslint.js',...scoped,'-f','json','-o','/evidence/eslint.json'],120,root],
 ['productionBuild',3072,['/work/node_modules/vite/bin/vite.js','build','--config','/work/qa-ci/vite.ci-build.config.ts'],480,'/work/qa-ci/empty-env']];
 for(const [name,heap,args,seconds,cwd] of gates){
  const started=Date.now(),log=await fs.open(path.join(out,name+'.log'),'w');let timedOut=false;
  const child=spawn(process.execPath,['--max-old-space-size='+heap,...args],{cwd,env:{...env,NODE_OPTIONS:'--max-old-space-size='+heap},detached:true,stdio:['ignore',log.fd,log.fd]});
  const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGKILL');}catch{}},seconds*1000);
  const exitCode=await new Promise(resolve=>{child.once('error',()=>resolve(-1));child.once('exit',code=>resolve(code));});clearTimeout(timer);await log.close();
  report.gates[name]={status:exitCode===0&&!timedOut?'PASS':'FAIL',exitCode,timedOut,seconds:(Date.now()-started)/1000,heapMiB:heap,args};
  if(name==='vitest'&&exitCode===0){const tests=JSON.parse(await fs.readFile(path.join(out,'vitest-results.json'),'utf8'));report.gates[name].tests=tests.numTotalTests;if(tests.numTotalTests!==61||tests.numFailedTests!==0)report.gates[name].status='FAIL';}
  if(name==='productionBuild'&&exitCode===0){if(!(await fs.stat(path.join(out,'build-verification-only/index.html'))).size)report.gates[name].status='FAIL';await fs.writeFile(path.join(out,'build-verification-only/DO-NOT-DEPLOY.txt'),'Verification build only. Unusable loopback services. No release or authenticated certification.\n');}
  await save();
 }
 await fs.mkdir(path.join(out,'historical-edge-baseline'),{recursive:true});
 const baseline=manifest.files.filter(f=>f.path.startsWith('qa-ci/historical-edge-baseline/'));
 for(const file of baseline)await fs.copyFile(path.join(root,file.path),path.join(out,'historical-edge-baseline',path.basename(file.path)));
 report.gates.screenshots={status:'PASS',scope:'Retained local Edge baseline only; no fresh remote browser run',files:baseline.filter(f=>f.path.endsWith('.png')).length};
 report.gates.authenticatedE2E={status:'BLOCKED',reason:'No approved staging environment or identities; never attempted'};
 report.gates.remoteBrowser={status:'NOT RUN',reason:'Approved Edge evidence reused; no browser redesign/retest in this workflow'};
 if(['network','source','typescript','vitest','eslint','productionBuild'].every(n=>report.gates[n]?.status==='PASS'))report.frontendIntegration='GO for separately approved frontend-only integration; no automatic merge';
}catch(error){report.failure=String(error);if(report.gates.network.status!=='PASS')report.gates.network={status:'FAIL',reason:String(error)};else if(report.gates.source.status!=='PASS')report.gates.source={status:'FAIL',reason:String(error)};}finally{
 for(const name of ['typescript','vitest','eslint','productionBuild'])report.gates[name]??={status:'NOT RUN'};
 report.gates.authenticatedE2E??={status:'BLOCKED',reason:'Staging approval required'};report.gates.remoteBrowser??={status:'NOT RUN',reason:'Historical Edge screenshots only'};
 await save();console.log(JSON.stringify(report,null,2));if(!report.frontendIntegration.startsWith('GO '))process.exitCode=1;
}

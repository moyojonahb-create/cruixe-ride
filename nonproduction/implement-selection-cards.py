from pathlib import Path
p=Path('nonproduction/approved-ride-ui/src/components/ride/RideTierSelector.tsx')
s=p.read_text(encoding='utf-8-sig').replace('\r\n','\n')
s=s.replace("import { cn } from '@/lib/utils';","import { cn } from '@/lib/utils';\nimport RideSelectionCards from './RideSelectionCards';",1)
s=s.replace('  options: RideTierOption[];','  presentation?: \'booking\' | \'selection\';\n  options: RideTierOption[];',1)
s=s.replace('  options,\n  selected,','  options,\n  presentation = \'booking\',\n  selected,',1)
s=s.replace('  const hero = options.find',"  if (presentation === 'selection') return <RideSelectionCards options={options} selected={selected} onSelect={onSelect} />;\n  const hero = options.find",1)
p.write_bytes(s.encode())
print('Added opt-in selection presentation; later booking presentation unchanged')

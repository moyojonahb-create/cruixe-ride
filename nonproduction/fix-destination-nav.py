from pathlib import Path
u=Path('nonproduction/approved-ride-ui')
p=u/'src/components/BottomNavBar.tsx';s=p.read_text(encoding='utf-8').replace('    const observer = new ResizeObserver(measure);','    if (typeof ResizeObserver === \'undefined\') return;\n    const observer = new ResizeObserver(measure);').replace('data-active-tab={active ?? undefined}', 'data-location-stage={new URLSearchParams(location.search).get(\'view\') === \'locations\' ? \'true\' : undefined}\n      data-active-tab={active ?? undefined}');p.write_text(s,encoding='utf-8')
p=u/'src/components/riderNavigation.css';s=p.read_text();s+='\nbody:not(:has(.destination-screen)) .rider-navigation[data-location-stage="true"] { display: none; }\n';p.write_text(s)

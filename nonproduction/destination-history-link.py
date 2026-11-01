from pathlib import Path
u=Path('nonproduction/approved-ride-ui')
p=u/'src/components/ride/DestinationSearchScreen.tsx';s=p.read_text(encoding='utf-8').replace('  gpsError?: string | null;', '  gpsError?: string | null;\n  onSeeAll?: () => void;').replace('  gpsError,','  gpsError,\n  onSeeAll,').replace('{recents.length > 0 && <a href="/history">See all</a>}','{recents.length > 0 && onSeeAll && <button type="button" onClick={onSeeAll}>See all</button>}');p.write_text(s,encoding='utf-8')
p=u/'src/components/ride/destinationScreen.css';s=p.read_text().replace('.destination-recents-heading a {','.destination-recents-heading button {');p.write_text(s)
p=u/'src/components/ride/RideView.tsx';s=p.read_text(encoding='utf-8').replace('          searchError={searchError}','          onSeeAll={() => navigate(\'/history\')}\n          searchError={searchError}');p.write_text(s,encoding='utf-8')

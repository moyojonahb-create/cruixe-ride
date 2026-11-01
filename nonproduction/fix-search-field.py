from pathlib import Path
import shutil
u=Path('nonproduction/approved-ride-ui')
for name in ['src/components/ride/DestinationSearchScreen.tsx','src/components/ride/destinationScreen.css']:
 p=u/'search-fix-baseline'/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(u/name,p)
p=u/'src/components/ride/DestinationSearchScreen.tsx';s=p.read_text(encoding='utf-8');s=s.replace('/* eslint-disable react-hooks/exhaustive-deps */\n','').replace('  searchError?: string | null;','  searchError?: string | null;\n  onRetrySearch?: () => void;\n  resolving?: boolean;').replace('  searchError,','  searchError,\n  onRetrySearch,\n  resolving,');s=s.replace('  const searching = query.trim().length >= 3;','  const queryLength = query.trim().length;\n  const searching = queryLength >= 3;\n  const instruction = queryLength === 0 ? \'Type at least 3 characters to search.\' : `Type ${3 - queryLength} more ${queryLength === 2 ? \'character\' : \'characters\'} to search.`;\n  const resultsId = useId();')
a=s.index('            <Search className="destination-search-icon"');b=s.index('\n          </div>',a)
s=s[:a]+'''            <div className="destination-search-control">
              <Search className="destination-search-icon" aria-hidden="true" />
              <input
                id={inputId}
                ref={activeInputRef}
                autoFocus
                autoComplete="off"
                enterKeyHint="search"
                aria-describedby={`${fieldId}-feedback`}
                aria-controls={searching ? resultsId : undefined}
                value={query}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') e.currentTarget.blur();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const first = document.getElementById(resultsId)?.querySelector<HTMLButtonElement>('button');
                    if (first) first.focus(); else e.currentTarget.blur();
                  }
                }}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={value || placeholder}
                className="destination-search-text"
              />
              {query.length > 0 && <button type="button" className="destination-search-clear"
                aria-label={`Clear ${label.toLowerCase()}`}
                onClick={() => { onQueryChange(''); activeInputRef.current?.focus(); }}>
                <X aria-hidden="true" />
              </button>}
            </div>'''+s[b:]
a=s.index('        {isActive && query.length > 0 && (');b=s.index('\n      </div>',a);s=s[:a]+s[b:]
s=s.replace("field === 'pickup' && 'border-b border-border/60'", "field === 'pickup' && 'border-b border-border/60',\n          field === 'pickup' && isActive && 'destination-field--editing-pickup'")
s=s.replace("      {/* Blue header */}","      {/* Destination header */}")
s=s.replace('        {!searching && (', '''        <p id={`${fieldId}-feedback`} role="status" aria-live="polite" className="destination-search-feedback">
          {!searching ? instruction : resolving ? 'Resolving location…' : loading ? 'Searching places…' : searchError ? 'Some search services are unavailable.' : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
        </p>
        {queryLength === 0 && (''')
a=s.index('        <p role="status" aria-live="polite" className="sr-only">');b=s.index('            {results.map((row)',a)
s=s[:a]+'''        {searching && (
          <section id={resultsId} aria-label="Search results" aria-busy={Boolean(loading || resolving)} className="destination-results">
'''+s[b:]
s=s.replace('            {searchError && <p role="alert" className="destination-status">{searchError}</p>}', '''            {searchError && <div className="destination-search-error" role="alert">
              <p>{searchError}</p>
              {onRetrySearch && <button type="button" disabled={Boolean(loading || resolving)} onClick={onRetrySearch}>Retry search</button>}
              <button type="button" onClick={onChooseOnMap}>Choose on map</button>
            </div>}''')
s=s.replace('!loading && !searchError && results.length === 0','!loading && !resolving && !searchError && results.length === 0')
# Last results wrapper only.
a=s.index('          <section id={resultsId}');s=s[:a]+s[a:].replace('          </div>\n        )}', '          </section>\n        )}',1)
s=s.replace(' Home, Loader2, Map as MapIcon',' Home, Map as MapIcon');p.write_text(s,encoding='utf-8')
p=u/'src/components/ride/destinationScreen.css';s=p.read_text(encoding='utf-8');s=s.replace('.destination-input input { min-height: 44px; border: 1px solid #f50916; border-radius: 13px; padding: 8px 8px 8px 32px; font-size: 16px; }','.destination-search-control { display: flex; align-items: center; gap: 8px; min-width: 0; border: 1px solid #bbc1cb; border-radius: 13px; padding-left: 10px; background: #fff; }\n.destination-search-control:focus-within { border-color: #e0000c; }\n.destination-search-text { flex: 1; width: 0; min-width: 0; min-height: 46px; padding: 8px 4px; font-size: 16px; color: #111520; background: transparent; border: 0; border-radius: 12px; }\n.destination-search-text:focus, .destination-search-text:focus-visible { border: 0; outline: none; box-shadow: none; }\n.destination-search-clear { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 11px; color: #667080; }\n.destination-search-clear svg { width: 20px; height: 20px; }\n.destination-search-clear:focus-visible { outline-offset: -4px !important; }')
s=s.replace('.destination-search-icon { position: absolute; left: 9px; bottom: 13px; width: 18px; height: 18px; color: #697382; pointer-events: none; }','.destination-search-icon { width: 18px; height: 18px; flex-shrink: 0; color: #697382; pointer-events: none; }')
s+='''
.destination-search-feedback { font-size: 14px; color: #586372; margin: 0 2px 12px; }
.destination-results { padding-top: 0; }
.destination-search-error { padding: 12px; border-radius: 14px; background: #fff0f2; color: #871523; font-size: 14px; }
.destination-search-error button { min-height: 44px; padding: 8px 12px; margin: 4px 6px 0 0; border: 1px solid #b6000b; border-radius: 10px; font-weight: 600; }
.destination-search-error button:disabled { opacity: .55; }
.destination-field--editing-pickup { flex-wrap: wrap; }
.destination-field--editing-pickup .destination-input { flex-basis: calc(100% - 36px); }
.destination-field--editing-pickup .destination-gps { margin-left: 29px; width: auto; }
''';p.write_text(s,encoding='utf-8')

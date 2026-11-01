from pathlib import Path
p=Path('nonproduction/approved-ride-ui/src/components/RiderNavigationProvider.tsx')
s=p.read_text(encoding='utf-8-sig').replace('useMemo, useState','useMemo, useRef, useState')
s=s.replace('  useEffect(() => { saveDraft(null); }, [user?.id]);', '''  const identity = useRef(user?.id);
  useEffect(() => {
    if (identity.current !== user?.id) saveDraft(null);
    identity.current = user?.id;
  }, [user?.id]);''')
p.write_text(s,encoding='utf-8')

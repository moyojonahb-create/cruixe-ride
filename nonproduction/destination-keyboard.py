from pathlib import Path
p=Path('nonproduction/approved-ride-ui/src/components/ride/DestinationSearchScreen.tsx');s=p.read_text(encoding='utf-8').replace("import { useId, useMemo, useRef }", "import { useEffect, useId, useMemo, useRef }")
s=s.replace('  const reduceMotion = useReducedMotion();','''  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const resize = () => {
      if (!screenRef.current) return;
      screenRef.current.style.height = `${viewport.height}px`;
      screenRef.current.style.top = `${viewport.offsetTop}px`;
    };
    resize(); viewport.addEventListener('resize', resize); viewport.addEventListener('scroll', resize);
    return () => { viewport.removeEventListener('resize', resize); viewport.removeEventListener('scroll', resize); };
  }, []);
  const reduceMotion = useReducedMotion();''').replace('    <motion.div\n', '    <motion.div\n      ref={screenRef}\n',1)
p.write_text(s,encoding='utf-8')
p=Path('nonproduction/approved-ride-ui/src/components/ride/destinationScreen.css');s=p.read_text();s+='\n.destination-screen { bottom: auto; height: 100dvh; }\n.destination-header { flex-shrink: 0; }\n';p.write_text(s)

# Driver authentication assets

Exported read-only through the authenticated Figma Plugin API from file
YLDdDmUNi4qbEb3mFfwpkB. No design nodes were changed.

- hero.png: photo layer 1097:107, PNG export, 400 × 246 (248850 bytes).
- red-wave.svg: 1097:109, 400 × 65.
- paper.svg: 1097:111, 400 × 608.
- shield.svg: 1097:129, 20 × 20.
- back.svg: 1478:59, 26 × 26.

These are individual artwork layers, not screen screenshots. The photo layer
preserves Figma's crop. SVGs retain their original export dimensions.

The ordinary temporary asset URLs returned HTTP 403 at the execution proxy.
Authenticated node.exportAsync works. SVG_STRING can be returned directly;
PNG bytes must be returned in bounded pieces because use_figma limits results
to 48000 bytes. For this photo, 25 pieces of at most 10000 bytes were assembled
in order, then decoded and verified as a valid PNG and visually inspected.
All pieces reported the same total size. No temporary asset URLs are used by
these local files. Future frames still require their own export validation.

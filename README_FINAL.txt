THE CHALLENGER — FINAL REBUILT LIVESTREAM PACKAGE

Contents:
- CHALLENGER_FINAL_LIVESTREAM_SCRIPT.txt — finalized script. The spoken narration is exactly 6,500 words when bracketed production notes, links, title, and section headings are excluded.
- index.html — run-of-show source console. Resources appear in the same order as the finalized script.
- gallery.html — separate bundled picture gallery with all 20 uploaded originals.
- assets/images/originals/ — byte-preserved website copies of the 20 uploaded images.
- assets/images/thumbs/ — optimized gallery thumbnails.
- assets/js/gallery.js — OpenSeadragon integration plus a local fallback viewer.
- docs/ — highlighted warrant excerpt PDFs carried forward from the prior build.

Gallery viewer:
OpenSeadragon 6.1.1 is loaded from jsDelivr and provides deep zoom/pan in simple-image mode. If the CDN does not load, gallery.js falls back to a local CSS/JavaScript pan/zoom viewer. Image files themselves are bundled in the website and do not depend on local computer paths.

Deployment:
Upload the entire extracted folder without changing its internal directory structure. Open index.html as the entry point.

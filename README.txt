THE CHALLENGER — LIVESTREAM WEBSITE

index.html
Production source console arranged in the exact section flow of the finalized livestream. Repeated sources are intentionally repeated wherever the script returns to them. YouTube links include the requested start times and embedded players begin at the same timestamps.

gallery.html
Separate zoomable picture gallery containing all 20 supplied images. OpenSeadragon provides deep zoom/pan with a local JavaScript fallback. A Tint / Glass quick set reuses relevant original files for fast access during that section.

assets/
Local thumbnails, original images, CSS and gallery JavaScript.

docs/
Local highlighted warrant excerpt PDFs inherited from the prior build. The run-of-show also links directly to the public redacted source PDFs.

DEPLOYMENT
Upload the entire folder without changing its internal structure. index.html links to gallery.html using relative paths.


BUNDLED IMAGE NOTE
------------------
All 20 user-uploaded evidence/reference images are physically included in assets/images/originals/. They are byte-for-byte matches of the uploaded files; gallery.html never references /mnt/data, file://, or any path on the creator's computer. assets/images/thumbs/ contains separate small previews only. UPLOADED_IMAGE_MAP.tsv records the SHA-256 verification mapping.

ZOOM VIEWER
-----------
The preferred viewer is OpenSeadragon 6.1.1, an open-source JavaScript image viewer under the BSD-3-Clause license. The page loads it from jsDelivr and includes a local JavaScript pan/zoom fallback so image inspection still works if the library CDN is unavailable.

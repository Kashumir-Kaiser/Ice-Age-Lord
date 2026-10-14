"""Restore hash-verified artwork transferred through the GitHub integration."""
import base64
import hashlib
import json
import pathlib
import shutil

root = pathlib.Path(__file__).resolve().parent.parent
upload = root / 'assets/source/uploads'
manifest = upload / 'manifest.json'
if manifest.exists():
    for entry in json.loads(manifest.read_text()):
        target = (root / entry['path']).resolve()
        if target.parent not in [root / 'assets/source/terrain',root / 'assets/source/map-buildings',root / 'assets/source/map-effects'] or target.suffix != '.png':
            raise ValueError('Artwork target outside terrain source directory')
        encoded = []
        for part in entry['parts']:
            source = (root / part).resolve()
            if source.parent != upload or source.suffix != '.b64':
                raise ValueError('Invalid artwork transfer part')
            encoded.append(source.read_text())
        data = base64.b64decode(''.join(encoded), validate=True)
        digest = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
        if digest != entry['gitBlobSha']:
            raise ValueError('Original artwork hash mismatch: ' + entry['path'])
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Refusing to replace different artwork: ' + entry['path'])
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
        print('Verified original:', entry['path'], digest)
    shutil.rmtree(upload)

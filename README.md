# IntegrityGuard

IntegrityGuard is a browser-based cybersecurity tool that detects file tampering using cryptographic hashing.

The application performs chunk-based hashing and identifies exactly which chunk of a file has been modified.

The system runs completely in the browser and can be deployed using GitHub Pages.

## Features

* SHA-256 file hashing
* Chunk hashing for large files
* Modified chunk detection
* Chunk integrity visualization
* IndexedDB fingerprint storage
* Encrypted database export
* Database import
* PDF verification report
* Works offline

## How It Works

1. Upload a file.
2. The file is split into 2MB chunks.
3. Each chunk is hashed using SHA-256.
4. The fingerprint is stored in the browser database.
5. When verifying, the file is hashed again.
6. Hashes are compared with stored hashes.

If a chunk hash differs, the system identifies the exact chunk that changed.

## Running the Project

Open index.html in a browser.

## Technologies

HTML
CSS
JavaScript
Web Crypto API
IndexedDB
jsPDF

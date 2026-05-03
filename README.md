# IntegrityGuard

Cryptographic File Integrity Checker

## Features

- SHA256 file hashing
- Chunk hashing for large files
- Detects exactly which chunk was modified
- AES-256 encrypted fingerprint database
- IndexedDB secure browser storage
- Import / Export encrypted database
- PDF integrity reports
- Works fully offline
- GitHub Pages compatible

## How it Works

1 Upload a file
2 Generate fingerprint
3 The system stores chunk hashes in IndexedDB
4 Later upload the file again
5 Verification compares chunk hashes

If hashes differ the tool shows which chunks changed.

## Security

Hashing: SHA-256  
Encryption: AES-256-GCM  
Key Derivation: PBKDF2

## Run Locally

Just open:

index.html

The app runs entirely in the browser.

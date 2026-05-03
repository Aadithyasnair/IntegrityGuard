# File Integrity Checker

A browser-based cybersecurity tool that verifies whether a file has been modified using cryptographic hashing.

The application runs entirely in the browser and can be deployed on GitHub Pages.

## Features

* SHA-256 cryptographic hashing
* Chunk hashing for large files
* File metadata inspection
* Integrity verification
* PDF integrity report export
* Local fingerprint database using localStorage
* Works fully offline

## How It Works

1. Upload a file.
2. The system divides the file into chunks (2MB each).
3. Each chunk is hashed using SHA-256.
4. The hashes are stored as the file fingerprint.
5. When verifying, the file is chunk-hashed again.
6. If any chunk hash changes, the file integrity fails.

## Example

Original File

file.txt
Chunks: 3
Hashes stored.

Modified File

file.txt edited.

Verification result:

Integrity Status: MODIFIED

## Running Locally

Simply open `index.html` in a browser.

## Deploying to GitHub Pages

1. Create a new GitHub repository.
2. Upload these files:

   * index.html
   * style.css
   * script.js
   * README.md
3. Go to repository **Settings → Pages**.
4. Under "Source", select:

main branch
/ (root)

5. Save.

Your app will be available at:

https://yourusername.github.io/repository-name/

## Technologies Used

* HTML
* CSS
* JavaScript
* Web Crypto API
* jsPDF

## Security Concept

File integrity is verified using cryptographic hashes.
If even a single byte changes, the SHA-256 hash changes, indicating tampering.

Chunk hashing improves efficiency when working with very large files.

## License

MIT

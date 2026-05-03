let reportData = {}

const CHUNK_SIZE = 1024 * 1024 * 2 // 2MB chunks

async function hashChunk(chunk){

const buffer = await chunk.arrayBuffer()

const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)

const hashArray = Array.from(new Uint8Array(hashBuffer))

return hashArray.map(b => b.toString(16).padStart(2,"0")).join("")
}

async function chunkHashFile(file){

let chunks = []
let offset = 0

while(offset < file.size){

const chunk = file.slice(offset, offset + CHUNK_SIZE)

const hash = await hashChunk(chunk)

chunks.push(hash)

offset += CHUNK_SIZE
}

return chunks
}

async function generateFingerprint(){

const file = document.getElementById("fileInput").files[0]

if(!file){
alert("Upload a file")
return
}

const chunkHashes = await chunkHashFile(file)

const fingerprint = {
fileName: file.name,
size: file.size,
type: file.type,
lastModified: file.lastModified,
chunks: chunkHashes
}

localStorage.setItem(file.name, JSON.stringify(fingerprint))

document.getElementById("output").innerText =
"Fingerprint stored\n\nChunks hashed: " + chunkHashes.length
}

async function verifyFile(){

const file = document.getElementById("fileInput").files[0]

if(!file){
alert("Upload file first")
return
}

const stored = JSON.parse(localStorage.getItem(file.name))

if(!stored){
alert("No fingerprint found")
return
}

const newChunks = await chunkHashFile(file)

let status = "SAFE"

if(newChunks.length !== stored.chunks.length){
status = "MODIFIED"
}else{
for(let i=0;i<newChunks.length;i++){

if(newChunks[i] !== stored.chunks[i]){
status = "MODIFIED"
break
}
}
}

reportData = {
fileName: file.name,
fileSize: file.size,
fileType: file.type,
originalChunks: stored.chunks.length,
scannedChunks: newChunks.length,
status: status,
scanTime: new Date().toLocaleString()
}

let message =
"File: "+file.name+"\n\n"+
"Size: "+file.size+" bytes\n"+
"Chunks: "+newChunks.length+"\n\n"+
"Status: "+status

document.getElementById("output").innerText = message
}

function downloadReport(){

if(!reportData.fileName){
alert("Run verification first")
return
}

const { jsPDF } = window.jspdf
const doc = new jsPDF()

doc.setFontSize(18)
doc.text("File Integrity Verification Report",20,20)

doc.setFontSize(12)

doc.text("File Name: "+reportData.fileName,20,40)
doc.text("File Size: "+reportData.fileSize+" bytes",20,50)
doc.text("File Type: "+reportData.fileType,20,60)

doc.text("Chunks Checked: "+reportData.scannedChunks,20,80)

doc.text("Status: "+reportData.status,20,100)

doc.text("Scan Time: "+reportData.scanTime,20,120)

doc.save("integrity_report.pdf")
}

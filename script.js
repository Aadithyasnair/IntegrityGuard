const CHUNK_SIZE = 1024 * 1024 * 2

let db
let reportData = {}

const request = indexedDB.open("IntegrityGuardDB",1)

request.onupgradeneeded = e =>{

db = e.target.result
db.createObjectStore("fingerprints",{keyPath:"name"})

}

request.onsuccess = e =>{

db = e.target.result

}

async function sha256(buffer){

const hash = await crypto.subtle.digest("SHA-256",buffer)
return Array.from(new Uint8Array(hash))
.map(b=>b.toString(16).padStart(2,"0"))
.join("")

}

async function chunkHashFile(file){

let chunks=[]

let offset=0

while(offset<file.size){

const chunk=file.slice(offset,offset+CHUNK_SIZE)
const buffer=await chunk.arrayBuffer()

const hash=await sha256(buffer)

chunks.push(hash)

offset+=CHUNK_SIZE

}

return chunks

}

async function generateFingerprint(){

const file=document.getElementById("fileInput").files[0]

if(!file) return alert("Upload file")

const chunks=await chunkHashFile(file)

const tx=db.transaction(["fingerprints"],"readwrite")
const store=tx.objectStore("fingerprints")

store.put({

name:file.name,
size:file.size,
chunks

})

document.getElementById("output").textContent=
"Fingerprint created\nChunks: "+chunks.length

}

function getFingerprint(name){

return new Promise(resolve=>{

const tx=db.transaction(["fingerprints"],"readonly")
const store=tx.objectStore("fingerprints")

const req=store.get(name)

req.onsuccess=()=>resolve(req.result)

})

}

async function verifyFile(){

const file=document.getElementById("fileInput").files[0]

if(!file) return alert("Upload file")

const stored=await getFingerprint(file.name)

if(!stored) return alert("Fingerprint not found")

const newChunks=await chunkHashFile(file)

let changed=[]

for(let i=0;i<newChunks.length;i++){

if(newChunks[i]!==stored.chunks[i]){

changed.push(i+1)

}

}

let status="SAFE"

if(changed.length>0) status="MODIFIED"

reportData={

file:file.name,
size:file.size,
chunks:newChunks.length,
status,
changed,
time:new Date().toLocaleString()

}

let output=

`File: ${file.name}

Chunks: ${newChunks.length}

Status: ${status}`

if(changed.length>0){

output+=`

Modified chunks: ${changed.join(", ")}`

}

document.getElementById("output").textContent=output

}

async function downloadReport(){

const {jsPDF}=window.jspdf

const pdf=new jsPDF()

pdf.text("IntegrityGuard Report",20,20)

pdf.text("File: "+reportData.file,20,40)

pdf.text("Size: "+reportData.size+" bytes",20,50)

pdf.text("Chunks: "+reportData.chunks,20,60)

pdf.text("Status: "+reportData.status,20,70)

pdf.text("Time: "+reportData.time,20,80)

if(reportData.changed && reportData.changed.length){

pdf.text("Modified Chunks: "+reportData.changed.join(","),20,90)

}

pdf.save("integrity_report.pdf")

}

async function getKey(password){

const enc=new TextEncoder()

const keyMaterial=await crypto.subtle.importKey(
"raw",
enc.encode(password),
"PBKDF2",
false,
["deriveKey"]
)

return crypto.subtle.deriveKey(

{
name:"PBKDF2",
salt:enc.encode("integrityguard"),
iterations:100000,
hash:"SHA-256"
},

keyMaterial,
{name:"AES-GCM",length:256},
false,
["encrypt","decrypt"]

)

}

async function encryptData(data,password){

const key=await getKey(password)

const iv=crypto.getRandomValues(new Uint8Array(12))

const enc=new TextEncoder()

const encrypted=await crypto.subtle.encrypt(
{name:"AES-GCM",iv},
key,
enc.encode(data)
)

return JSON.stringify({

iv:Array.from(iv),
data:Array.from(new Uint8Array(encrypted))

})

}

async function decryptData(payload,password){

const parsed=JSON.parse(payload)

const key=await getKey(password)

const iv=new Uint8Array(parsed.iv)
const data=new Uint8Array(parsed.data)

const decrypted=await crypto.subtle.decrypt(
{name:"AES-GCM",iv},
key,
data
)

return new TextDecoder().decode(decrypted)

}

async function exportDatabase(){

const password=prompt("Create password for DB export")

if(!password) return

const tx=db.transaction(["fingerprints"],"readonly")
const store=tx.objectStore("fingerprints")

const req=store.getAll()

req.onsuccess=async()=>{

const json=JSON.stringify(req.result)

const encrypted=await encryptData(json,password)

const blob=new Blob([encrypted],{type:"application/json"})

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)

a.download="fingerprints.igdb"

a.click()

}

}

async function importDatabase(event){

const file=event.target.files[0]

if(!file) return

const password=prompt("Enter database password")

const text=await file.text()

try{

const decrypted=await decryptData(text,password)

const data=JSON.parse(decrypted)

const tx=db.transaction(["fingerprints"],"readwrite")
const store=tx.objectStore("fingerprints")

for(const item of data){

store.put(item)

}

document.getElementById("output").textContent=
"Database imported\nRecords: "+data.length

}catch{

alert("Invalid password or corrupted DB")

}

}

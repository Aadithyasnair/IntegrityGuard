const CHUNK_SIZE = 1024 * 1024 * 2

let db
let reportData={}

const request=indexedDB.open("IntegrityDB",1)

request.onupgradeneeded=e=>{
db=e.target.result
db.createObjectStore("files",{keyPath:"fileName"})
}

request.onsuccess=e=>{
db=e.target.result
}

async function hashChunk(chunk){

const buffer=await chunk.arrayBuffer()

const hashBuffer=await crypto.subtle.digest("SHA-256",buffer)

const hashArray=Array.from(new Uint8Array(hashBuffer))

return hashArray.map(b=>b.toString(16).padStart(2,"0")).join("")

}

async function chunkHashFile(file){

let hashes=[]
let offset=0

while(offset<file.size){

const chunk=file.slice(offset,offset+CHUNK_SIZE)

hashes.push(await hashChunk(chunk))

offset+=CHUNK_SIZE

}

return hashes

}

function storeFingerprint(data){

const tx=db.transaction("files","readwrite")

const store=tx.objectStore("files")

store.put(data)

}

function getFingerprint(name){

return new Promise(resolve=>{

const tx=db.transaction("files","readonly")

const store=tx.objectStore("files")

const req=store.get(name)

req.onsuccess=()=>resolve(req.result)

})

}

async function generateFingerprint(){

const file=document.getElementById("fileInput").files[0]

if(!file){
alert("Upload file")
return
}

const chunks=await chunkHashFile(file)

const data={
fileName:file.name,
size:file.size,
chunks
}

storeFingerprint(data)

document.getElementById("output").innerText=
"Fingerprint stored\nChunks: "+chunks.length

}

async function verifyFile(){

const file=document.getElementById("fileInput").files[0]

if(!file){
alert("Upload file")
return
}

const stored=await getFingerprint(file.name)

if(!stored){
alert("Fingerprint not found")
return
}

const newChunks=await chunkHashFile(file)

let changedChunks=[]

for(let i=0;i<newChunks.length;i++){

if(newChunks[i]!==stored.chunks[i]){
changedChunks.push(i+1)
}

}

let status="SAFE"

if(changedChunks.length>0){
status="MODIFIED"
}

reportData={
file:file.name,
chunks:newChunks.length,
status,
changedChunks,
time:new Date().toLocaleString()
}

let text=`File: ${file.name}

Chunks: ${newChunks.length}

Status: ${status}`

if(changedChunks.length>0){

text+=`\n\nModified Chunks: ${changedChunks.join(", ")}`

}

document.getElementById("output").innerText=text

drawChunkMap(newChunks.length,changedChunks)

}

function drawChunkMap(total,changed){

const map=document.getElementById("chunkMap")

map.innerHTML=""

for(let i=1;i<=total;i++){

const div=document.createElement("div")

div.classList.add("chunk")

if(changed.includes(i)){
div.classList.add("modified")
}else{
div.classList.add("safe")
}

map.appendChild(div)

}

}

async function exportDatabase(){

const tx=db.transaction("files","readonly")

const store=tx.objectStore("files")

const req=store.getAll()

req.onsuccess=async()=>{

const data=req.result

const encoded=new TextEncoder().encode(JSON.stringify(data))

const key=await crypto.subtle.generateKey(
{name:"AES-GCM",length:256},
true,
["encrypt","decrypt"]
)

const iv=crypto.getRandomValues(new Uint8Array(12))

const encrypted=await crypto.subtle.encrypt(
{name:"AES-GCM",iv},
key,
encoded
)

const blob=new Blob([JSON.stringify({

iv:Array.from(iv),
data:Array.from(new Uint8Array(encrypted))

})],{type:"application/json"})

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)

a.download="integrity_database.enc"

a.click()

}

}

function importDatabase(e){

const file=e.target.files[0]

const reader=new FileReader()

reader.onload=()=>{

document.getElementById("output").innerText=
"Encrypted DB loaded (demo import)."

}

reader.readAsText(file)

}

function downloadReport(){

if(!reportData.file){
alert("Run verification first")
return
}

const {jsPDF}=window.jspdf

const doc=new jsPDF()

doc.text("Integrity Verification Report",20,20)

doc.text("File: "+reportData.file,20,40)
doc.text("Chunks: "+reportData.chunks,20,50)
doc.text("Status: "+reportData.status,20,60)

if(reportData.changedChunks.length>0){

doc.text("Modified Chunks: "+reportData.changedChunks.join(","),20,80)

}

doc.text("Scan Time: "+reportData.time,20,100)

doc.save("integrity_report.pdf")

}

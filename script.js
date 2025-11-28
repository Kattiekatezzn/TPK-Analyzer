// Minimal, robust TPK Analyzer (Style B)
const RANKS = ["A","2","3","4","5","6","7","8","9","T","J","Q","K"];
const SUITS = ["C","D","H","S"]; // C Clover, D Diamond, H Heart, S Spade
const SHORT_TO_FULL = { HC: "High Card", "2P": "Two Pair", "3K": "Trips/Straight/Flush", FH: "Full House" };
const DB_KEY = "tpk_db_v1";

function loadDB(){ try { return JSON.parse(localStorage.getItem(DB_KEY) || "{}"); } catch(e){ return {}; } }
function saveDB(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function normCard(code){
  if(!code) return null;
  code = String(code).trim().toUpperCase();
  code = code.replace("10","T").replace("♣","C").replace("♠","S").replace("♥","H").replace("♦","D");
  code = code.replace(/[^A-Z0-9]/g,'');
  return code;
}

function buildCards(){
  const wrap = document.getElementById("cardButtons");
  let html = "";
  SUITS.forEach(s=>{
    RANKS.forEach(r=>{
      html += `<button class="card-btn" data-card="${r+s}">${r}${s}</button>`;
    });
    html += "<div style='width:100%;height:8px;'></div>";
  });
  wrap.innerHTML = html;
  attachCardEvents();
}

function attachCardEvents(){
  document.querySelectorAll(".card-btn").forEach(b=>{
    b.addEventListener("click", ()=>{
      document.querySelectorAll(".card-btn").forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
      window.selectedCard = b.dataset.card;
      showStatus(`Selected: ${window.selectedCard}`);
    });
  });
}

function addRecord(cardCode, short){
  const code = normCard(cardCode);
  if(!code) { alert("Invalid card"); return; }
  const key = (short||"").toUpperCase();
  const full = SHORT_TO_FULL[key] || SHORT_TO_FULL[key.replace(/[^A-Z]/g,'')];
  if(!full){ alert("Invalid outcome. Use HC, 2P, 3K, FH"); return; }
  const db = loadDB();
  if(!db[code]) db[code] = {"High Card":0,"Two Pair":0,"Trips/Straight/Flush":0,"Full House":0};
  db[code][full] = (db[code][full]||0) + 1;
  saveDB(db);
  renderData();
  flashConfirm(`${code} → ${full}`);
}

function predictCard(cardCode){
  const code = normCard(cardCode);
  if(!code){ alert("Invalid card"); return; }
  const db = loadDB();
  const out = document.getElementById("predictResult");
  if(!db[code]){ out.textContent = `No data for ${code}`; return; }
  const counts = db[code];
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  let text = `Prediction for ${code}\nTotal: ${total}\n\n`;
  Object.keys(counts).forEach(k=>{
    text += `${k.padEnd(28)} : ${((counts[k]/total)*100).toFixed(2)}%\n`;
  });
  out.textContent = text;
}

function renderData(){
  const wrap = document.getElementById("dataList");
  const db = loadDB();
  const keys = Object.keys(db).sort();
  if(!keys.length){ wrap.innerHTML = "<div style='color:#9fb9a7'>No stored data yet.</div>"; return; }
  wrap.innerHTML = keys.map(k=>{
    const c = db[k]; const total = Object.values(c).reduce((a,b)=>a+b,0);
    const summary = Object.entries(c).map(([name,v])=>`${name.split(' ')[0]}:${v}`).join("<br/>");
    return `<div class="data-item"><div><strong>${k}</strong><div style="font-size:12px;color:#9fb9a7">${total} obs</div></div><div style="text-align:right">${summary}</div></div>`;
  }).join("");
}

function flashConfirm(msg){
  const out = document.getElementById("predictResult");
  out.textContent = msg;
  out.style.backgroundColor = "#163f2e";
  setTimeout(()=>{ if(window.selectedCard) out.textContent = `Selected: ${window.selectedCard}`; renderData(); out.style.backgroundColor = ""; }, 900);
}

function showStatus(txt){
  const out = document.getElementById("predictResult");
  out.textContent = txt;
}

function setupControls(){
  document.getElementById("quickAdd").addEventListener("click", ()=>{
    const c = document.getElementById("quickCard").value;
    const o = document.getElementById("quickOutcome").value;
    addRecord(c,o);
    document.getElementById("quickCard").value="";
    document.getElementById("quickOutcome").value="";
  });
  document.getElementById("doPredict").addEventListener("click", ()=>{ predictCard(document.getElementById("predictCard").value); });
  document.getElementById("predictCard").addEventListener("keydown", e=>{ if(e.key==="Enter") document.getElementById("doPredict").click(); });
  document.getElementById("quickOutcome").addEventListener("keydown", e=>{ if(e.key==="Enter") document.getElementById("quickAdd").click(); });
  document.getElementById("clearBtn").addEventListener("click", ()=>{ if(confirm("Clear all stored data?")){ localStorage.removeItem(DB_KEY); renderData(); showStatus("Storage cleared"); }});
  document.querySelectorAll(".outcome-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ if(!window.selectedCard){ alert("Select a card first"); return; } addRecord(window.selectedCard, b.dataset.code); });
  });
}

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('service-worker.js').catch(()=>console.warn("SW failed")); });
}

// init
buildCards();
setupControls();
renderData();
showStatus("Ready. Select a card.");

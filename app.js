const keyPart1 = "AIzaSyC2GwbLnmI9tO0J";
const keyPart2 = "ZNrsr6GVhc8D2ElQzMY";

const firebaseConfig = {
  apiKey: keyPart1 + keyPart2,
  authDomain: "suivi-charly-ab0a1.firebaseapp.com",
  databaseURL: "https://suivi-charly-ab0a1-default-rtdb.firebaseio.com",
  projectId: "suivi-charly-ab0a1",
  storageBucket: "suivi-charly-ab0a1.firebasestorage.app",
  messagingSenderId: "73800798044",
  appId: "1:73800798044:web:11330074701f9e4ff83b99"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let timerInterval = null;
let targetTime = null;

function setHeureActuelle() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('heureInput').value = `${hh}:${mm}`;
}
setHeureActuelle();

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

const laitSelect = document.getElementById('laitInput');
const delaiSelect = document.getElementById('delaiInput');

laitSelect.addEventListener('change', () => {
  if (laitSelect.value === 'maternel') {
    delaiSelect.value = "2";
    delaiSelect.disabled = true;
  } else {
    delaiSelect.disabled = false;
    delaiSelect.value = "3";
  }
});

db.ref('prochainRappel').on('value', (snapshot) => {
  const data = snapshot.val();
  if (data && data.timestamp) {
    targetTime = data.timestamp;
    lancerTimerVisuel();
  }
});

function lancerTimerVisuel() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const maintenant = Date.now();
    const tempsRestant = targetTime - maintenant;

    if (tempsRestant <= 0) {
      clearInterval(timerInterval);
      document.getElementById('timerDisplay').textContent = "00:00:00";
      document.getElementById('heureRappelInfo').textContent = "C'est l'heure du biberon !";
      declencherAlerteRappel();
    } else {
      const heures = Math.floor(tempsRestant / (1000 * 60 * 60));
      const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));
      const secondes = Math.floor((tempsRestant % (1000 * 60)) / 1000);

      document.getElementById('timerDisplay').textContent = 
        `${String(heures).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secondes).padStart(2, '0')}`;
      
      const dateProchain = new Date(targetTime);
      document.getElementById('heureRappelInfo').textContent = 
        `Rappel prévu à ${dateProchain.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }, 1000);
}

function declencherAlerteRappel() {
  if ("vibrate" in navigator) {
    navigator.vibrate([1000, 500, 1000, 500, 1000]);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("🍼 C'est l'heure du biberon !", {
      body: "Le délai choisi est écoulé. Charly a sûrement faim !"
    });
  }
}

document.getElementById('addBtn').addEventListener('click', () => {
  const ml = document.getElementById('mlInput').value;
  const delaiHeures = parseFloat(delaiSelect.value);
  const heureSaisie = document.getElementById('heureInput').value;
  const typeLait = laitSelect.value;
  const pipi = document.getElementById('pipiInput').checked;
  const caca = document.getElementById('cacaInput').checked;
  const note = document.getElementById('noteInput').value.trim();

  if (!ml || !heureSaisie) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

  const [h, m] = heureSaisie.split(':');
  const heurePriseDate = new Date();
  heurePriseDate.setHours(parseInt(h), parseInt(m), 0, 0);

  const timestampProchainBib = heurePriseDate.getTime() + (delaiHeures * 60 * 60 * 1000);

  db.ref('biberons').push({
    quantite: ml,
    heure: heureSaisie,
    date: dateStr,
    typeLait: typeLait,
    pipi: pipi,
    caca: caca,
    note: note,
    timestamp: Date.now()
  });

  db.ref('prochainRappel').set({
    timestamp: timestampProchainBib,
    delai: delaiHeures
  });

  document.getElementById('noteInput').value = '';
  document.getElementById('pipiInput').checked = false;
  document.getElementById('cacaInput').checked = false;
  setHeureActuelle();
});

function supprimerLigne(key) {
  if (confirm("Supprimer cette ligne ?")) {
    db.ref('biberons').child(key).remove();
  }
}

db.ref('biberons').limitToLast(15).on('value', (snapshot) => {
  const list = document.getElementById('bibList');
  list.innerHTML = '';
  const data = snapshot.val();

  if (data) {
    Object.keys(data).reverse().forEach(key => {
      const item = data[key];
      const li = document.createElement('li');

      const transitText = [
        item.pipi ? '💧 Pipi' : '',
        item.caca ? '💩 Caca' : ''
      ].filter(Boolean).join(' • ');

      const typeLaitTexte = item.typeLait === 'maternel' ? '🤱 Maternel' : '🍼 Infantile';

      li.innerHTML = `
        <div class="li-header">
          <span><b>${item.heure}</b> (${item.date}) — <b>${item.quantite} ml</b></span>
          <button class="delete-btn" onclick="supprimerLigne('${key}')">🗑️</button>
        </div>
        <div class="li-details">
          <span>${typeLaitTexte}</span>
          ${transitText ? `<span>| ${transitText}</span>` : ''}
        </div>
        ${item.note ? `<div class="li-note">« ${item.note} »</div>` : ''}
      `;
      list.appendChild(li);
    });
  }
});

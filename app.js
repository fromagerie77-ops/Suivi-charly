const firebaseConfig = {
  apiKey: "AIzaSyC2GwbLnmI9tO0JZNrsr6GVhc8D2ElQzMY",
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

if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

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
  const delaiHeures = parseFloat(document.getElementById('delaiInput').value);
  if (!ml) return;

  const now = new Date();
  const heure = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

  const timestampProchainBib = Date.now() + (delaiHeures * 60 * 60 * 1000);

  db.ref('biberons').push({
    quantite: ml,
    heure: heure,
    date: date,
    timestamp: Date.now()
  });

  db.ref('prochainRappel').set({
    timestamp: timestampProchainBib,
    delai: delaiHeures
  });
});

db.ref('biberons').limitToLast(10).on('value', (snapshot) => {
  const list = document.getElementById('bibList');
  list.innerHTML = '';
  const data = snapshot.val();

  if (data) {
    Object.keys(data).reverse().forEach(key => {
      const item = data[key];
      const li = document.createElement('li');
      li.innerHTML = `<span><b>${item.heure}</b> (${item.date})</span> <span><b>${item.quantite} ml</b></span>`;
      list.appendChild(li);
    });
  }
});

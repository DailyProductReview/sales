// sw.js – läuft DAUERHAFT IM HINTERGRUND (auch wenn Seite geschlossen)

let timerInterval = null;
let isRegistered = false;
let popupList = [];
let popupIndex = 0;
let minutes = 7;
let seconds = 0;

// Popup im aktiven Tab anzeigen
function showPopupInClient() {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if(clients.length > 0) {
            clients.forEach(client => {
                client.postMessage({ action: 'showPopup' });
            });
            // Index für Rotation weiterzählen (wird in der Hauptseite gemacht)
        } else {
            console.log("Kein Fenster offen – Timer läuft weiter");
        }
    });
}

// Timer starten
function startTimer() {
    if(timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if(isRegistered) {
            if(timerInterval) clearInterval(timerInterval);
            timerInterval = null;
            return;
        }
        
        if(minutes === 0 && seconds === 0) {
            console.log("7 Minuten abgelaufen – zeige Popup");
            showPopupInClient();
            minutes = 7;
            seconds = 0;
        } else {
            if(seconds === 0) {
                minutes--;
                seconds = 59;
            } else {
                seconds--;
            }
        }
    }, 1000);
}

// Nachrichten vom Hauptfenster empfangen
self.addEventListener('message', (event) => {
    if(event.data.action === 'start') {
        popupList = event.data.popups;
        popupIndex = event.data.currentIndex || 0;
        console.log("Service Worker gestartet – Timer läuft");
        startTimer();
    } else if(event.data.action === 'stop') {
        isRegistered = true;
        if(timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        console.log("Service Worker gestoppt");
    }
});

// Service Worker installieren und aktivieren
self.addEventListener('install', (event) => {
    console.log("Service Worker installiert");
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log("Service Worker aktiviert");
    event.waitUntil(self.clients.claim());
});

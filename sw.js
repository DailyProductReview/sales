// sw.js – läuft DAUERHAFT im Hintergrund (auch wenn Seite geschlossen)
let timerInterval = null;
let registered = false; 
let popupList = [];
let popupIndex = 0;
let minutes = 7;
let seconds = 0;

// Cookie auslesen im Service Worker
function getCookie(name) {
    return new Promise((resolve) => {
        chrome.cookies ? chrome.cookies.get({url: self.location.origin, name: name}, (c) => resolve(c ? c.value : null))
            : resolve(null);
    });
}

// Vereinfachte Cookie-Funktion für Service Worker (eigene Implementierung)
function getCookieSimple(name) {
    return new Promise((resolve) => {
        self.clients.matchAll().then(clients => {
            if(clients.length > 0) {
                clients[0].postMessage({ action: 'getCookie', name: name });
            }
            resolve(null);
        });
    });
}

// Popup im aktiven Tab anzeigen
function showPopup() {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if(clients.length > 0) {
            clients[0].postMessage({ action: 'showPopup', popupIndex: popupIndex });
            popupIndex = (popupIndex + 1) % popupList.length;
        }
    });
}

// Timer starten
function startTimer() {
    if(timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        if(registered) {
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        }
        
        if(minutes === 0 && seconds === 0) {
            showPopup();
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
    if(event.data.action === 'startTimer') {
        popupList = event.data.popups;
        popupIndex = event.data.currentIndex || 0;
        startTimer();
    } else if(event.data.action === 'stopTimer') {
        registered = true;
        if(timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    } else if(event.data.action === 'getCookieResponse') {
        if(event.data.name === 'registered_popup' && event.data.value === 'true') {
            registered = true;
            if(timerInterval) clearInterval(timerInterval);
        }
    }
});

// Beim Start prüfen, ob schon registriert (über Hauptfenster)
self.clients.matchAll().then(clients => {
    if(clients.length > 0) {
        clients[0].postMessage({ action: 'checkRegistered' });
    }
});

// Service Worker installieren und aktivieren
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

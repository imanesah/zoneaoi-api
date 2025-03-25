const express = require('express');
const fs = require('fs');
const path = require('path'); // Pour gérer les chemins correctement
const app = express();

app.use(express.json());

// Liste des niveaux de risque
const riskLevels = ['élevé', 'faible', 'moyen'];

// Fonction pour générer un risque aléatoire
function getRandomRisk() {
  return riskLevels[Math.floor(Math.random() * riskLevels.length)];
}

// Charger les zones depuis le fichier JSON
let zones;
try {
  const filePath = path.join(__dirname, 'geofencingDB.zones1.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  zones = JSON.parse(rawData).map(zone => ({
    ...zone,
    risk: getRandomRisk() // Ajouter l'attribut risk à chaque zone
  }));
  console.log('Zones chargées avec succès:', zones.length);
} catch (error) {
  console.error('Erreur de chargement de geofencingDB.zones1.json:', error.message, error.stack);
  zones = [];
}

// Route principale
app.get('/', (req, res) => {
  res.send('Serveur fonctionne ! Essaye /zones pour voir toutes les zones.');
});

// Route pour obtenir toutes les zones
app.get('/zones', (req, res) => {
  console.log('GET /zones appelé');
  res.json(zones);
});

// Route pour obtenir une zone par ID
app.get('/zones/:id', (req, res) => {
  const zone = zones.find(z => z._id.$oid === req.params.id);
  if (zone) {
    res.json(zone);
  } else {
    res.status(404).send('Zone non trouvée');
  }
});

// Exporter pour Vercel
module.exports = app;
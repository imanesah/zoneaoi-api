const express = require('express');
const fs = require('fs');
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Tableaux de risques possibles
const riskLevels = ['low', 'medium', 'high'];

// Fonction pour générer un risque aléatoire
function getRandomRisk() {
  const randomIndex = Math.floor(Math.random() * riskLevels.length);
  return riskLevels[randomIndex];
}

// Charger les zones depuis le fichier JSON
let zones;
try {
  const rawData = fs.readFileSync('geofencingDB.zones1.json', 'utf8');
  zones = JSON.parse(rawData).map(zone => ({
    ...zone,
    risk: getRandomRisk()
  }));
  console.log('Zones chargées avec succès:', zones.length);
} catch (error) {
  console.error('Erreur de chargement de geofencingDB.zones1.json:', error.message, error.stack);
  zones = [];
}

// Route par défaut pour tester le serveur
app.get('/', (req, res) => {
  res.send('Serveur fonctionne ! Essaye /zones pour voir toutes les zones.');
});

// Endpoint GET pour récupérer toutes les zones
app.get('/zones', (req, res) => {
  console.log('GET /zones appelé');
  res.json(zones);
});

// Endpoint GET pour récupérer une zone par ID
app.get('/zones/:id', (req, res) => {
  console.log(`GET /zones/${req.params.id} appelé`);
  const zone = zones.find(z => 
    (z._id && z._id.$oid === req.params.id) || z.zoneId === req.params.id
  );
  if (!zone) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }
  res.json(zone);
});

// Endpoint POST pour ajouter une nouvelle zone (temporaire, non persistant)
app.post('/zones', (req, res) => {
  const { geometry } = req.body;

  if (!geometry || !Array.isArray(geometry) || geometry.length < 3) {
    return res.status(400).json({ error: 'Geometry doit être un tableau de coordonnées avec au moins 3 points' });
  }

  const newZone = {
    _id: { $oid: `zoneId_${Date.now()}` },
    geometry,
    risk: getRandomRisk(),
    zoneId: `ZONE${zones.length + 1}`,
    tags: { landuse: req.body.tags?.landuse || 'unknown' },
    bounding_box: req.body.bounding_box || [],
    buildings: req.body.buildings || [],
    cross_walks: req.body.cross_walks || 0,
    routes: req.body.routes || []
  };

  zones.push(newZone);
  console.log('Nouvelle zone ajoutée (temporaire):', newZone);
  res.status(201).json({ message: 'Zone ajoutée (temporaire, non sauvegardée)', zone: newZone });
});

// Endpoint PUT pour mettre à jour une zone (temporaire, non persistant)
app.put('/zones/:id', (req, res) => {
  const zoneIndex = zones.findIndex(z => 
    (z._id && z._id.$oid === req.params.id) || z.zoneId === req.params.id
  );
  if (zoneIndex === -1) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }

  const { geometry, tags, bounding_box, buildings, cross_walks, routes } = req.body;
  zones[zoneIndex] = { 
    ...zones[zoneIndex], 
    geometry: geometry || zones[zoneIndex].geometry,
    tags: tags || zones[zoneIndex].tags,
    bounding_box: bounding_box || zones[zoneIndex].bounding_box,
    buildings: buildings || zones[zoneIndex].buildings,
    cross_walks: cross_walks !== undefined ? cross_walks : zones[zoneIndex].cross_walks,
    routes: routes || zones[zoneIndex].routes,
    risk: getRandomRisk()
  };
  console.log('Zone mise à jour (temporaire):', zones[zoneIndex]);
  res.json({ message: 'Zone mise à jour (temporaire, non sauvegardée)', zone: zones[zoneIndex] });
});

// Endpoint DELETE pour supprimer une zone (temporaire, non persistant)
app.delete('/zones/:id', (req, res) => {
  const zoneIndex = zones.findIndex(z => 
    (z._id && z._id.$oid === req.params.id) || z.zoneId === req.params.id
  );
  if (zoneIndex === -1) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }

  const deletedZone = zones.splice(zoneIndex, 1)[0];
  console.log('Zone supprimée (temporaire):', deletedZone);
  res.json({ message: 'Zone supprimée (temporaire, non sauvegardée)', zone: deletedZone });
});

// Export pour Vercel (pas de app.listen)
module.exports = app;
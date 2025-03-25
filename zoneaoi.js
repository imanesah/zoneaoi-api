const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3003;

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
    risk: getRandomRisk() // Ajouter un risque aléatoire à chaque zone
  }));
  console.log('Zones chargées avec succès depuis geofencingDB.zones1.json:', zones.length, 'zones');
} catch (error) {
  console.error('Erreur lors du chargement de geofencingDB.zones1.json:', error);
  zones = []; // Initialiser avec un tableau vide en cas d'erreur
  console.warn('Initialisation avec un tableau vide en raison de l\'erreur.');
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

// Endpoint POST pour ajouter une nouvelle zone
app.post('/zones', (req, res) => {
  const { geometry } = req.body;

  if (!geometry || !Array.isArray(geometry) || geometry.length < 3) {
    return res.status(400).json({ error: 'Geometry doit être un tableau de coordonnées avec au moins 3 points' });
  }

  const newZone = {
    _id: { $oid: `zoneId_${Date.now()}` }, // Générer un _id au format MongoDB
    geometry,
    risk: getRandomRisk(),
    zoneId: `ZONE${zones.length + 1}`,
    tags: { landuse: req.body.tags?.landuse || 'unknown' },
    bounding_box: req.body.bounding_box || [], // Optionnel, vide par défaut
    buildings: req.body.buildings || [],
    cross_walks: req.body.cross_walks || 0,
    routes: req.body.routes || []
  };

  zones.push(newZone);
  console.log('Nouvelle zone ajoutée:', newZone);
  res.status(201).json({ message: 'Zone ajoutée', zone: newZone });
});

// Endpoint PUT pour mettre à jour une zone
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
    risk: getRandomRisk() // Mise à jour du risque à chaque modification
  };
  console.log('Zone mise à jour:', zones[zoneIndex]);
  res.json({ message: 'Zone mise à jour', zone: zones[zoneIndex] });
});

// Endpoint DELETE pour supprimer une zone
app.delete('/zones/:id', (req, res) => {
  const zoneIndex = zones.findIndex(z => 
    (z._id && z._id.$oid === req.params.id) || z.zoneId === req.params.id
  );
  if (zoneIndex === -1) {
    return res.status(404).json({ error: 'Zone non trouvée' });
  }

  const deletedZone = zones.splice(zoneIndex, 1)[0];
  console.log('Zone supprimée:', deletedZone);
  res.json({ message: 'Zone supprimée', zone: deletedZone });
});

// Middleware pour sauvegarder les modifications dans le fichier JSON
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    try {
      fs.writeFileSync('geofencingDB.zones1.json', JSON.stringify(zones, null, 2));
      console.log('Zones sauvegardées dans geofencingDB.zones1.json');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde dans geofencingDB.zones1.json:', error);
    }
  }
  next();
});

// Démarrer le serveur
app.listen(process.env.PORT || 3003, () => {
  console.log(`API démarrée sur http://localhost:${process.env.PORT || 3003}`);
});
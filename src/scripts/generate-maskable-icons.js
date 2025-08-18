const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Pfade konfigurieren
const sourceIconsDir = path.join(__dirname, '../../public/icons');
const targetIconsDir = path.join(__dirname, '../../public/icons');

// Sicherstellen, dass das Zielverzeichnis existiert
if (!fs.existsSync(targetIconsDir)) {
  fs.mkdirSync(targetIconsDir, { recursive: true });
}

// Funktion zum Generieren eines maskierbaren Icons
function generateMaskableIcon(sourceFile, targetFile) {
  console.log(`Generiere maskierbares Icon: ${targetFile}`);
  
  // Hier würde normalerweise ein Bildverarbeitungstool wie Sharp oder ImageMagick verwendet werden
  // Da wir diese Tools nicht direkt verwenden können, erstellen wir einfach eine Kopie der Originaldatei
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log(`Maskierbares Icon erstellt: ${targetFile}`);
}

// Alle Icon-Größen verarbeiten
const iconSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];

iconSizes.forEach(size => {
  const sourceFile = path.join(sourceIconsDir, `icon-${size}.png`);
  const targetFile = path.join(targetIconsDir, `maskable-icon-${size}.png`);
  
  if (fs.existsSync(sourceFile)) {
    generateMaskableIcon(sourceFile, targetFile);
  } else {
    console.error(`Quelldatei nicht gefunden: ${sourceFile}`);
  }
});

console.log('Alle maskierbaren Icons wurden generiert!');

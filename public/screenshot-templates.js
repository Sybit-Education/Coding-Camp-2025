const fs = require('fs');

// Ensure directory exists
const templatesDir = './public/screenshot-templates';
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Function to create HTML template
function createScreenshotTemplate(filename, width, height, title) {
  console.log(`Creating template: ${filename} (${width}x${height})`);
  
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screenshot Template - ${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      overflow: hidden;
    }
    .container {
      width: ${width}px;
      height: ${height}px;
      position: relative;
      overflow: hidden;
      border: 1px solid #ccc;
    }
    header {
      background-color: #3b4ea3;
      color: white;
      padding: 15px;
      text-align: center;
      font-weight: bold;
      font-size: 24px;
    }
    .content {
      padding: 20px;
    }
    h1 {
      color: #333;
      font-size: 22px;
    }
    .placeholder-item {
      background-color: #ddd;
      height: 40px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    footer {
      position: absolute;
      bottom: 0;
      width: 100%;
      background-color: #f0f0f0;
      padding: 15px 0;
      text-align: center;
    }
    .instructions {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(255,255,255,0.9);
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="instructions">
    <p>Take a screenshot of the container below and save it as:<br>
    <strong>public/screenshots/${filename}</strong></p>
  </div>
  
  <div class="container">
    <header>1200 Jahre Radolfzell</header>
    <div class="content">
      <h1>${title}</h1>
      <div class="placeholder-item"></div>
      <div class="placeholder-item"></div>
      <div class="placeholder-item"></div>
      <div class="placeholder-item"></div>
      <div class="placeholder-item"></div>
    </div>
    ${width < 500 ? '<footer>Navigation</footer>' : ''}
  </div>
</body>
</html>`;

  fs.writeFileSync(`${templatesDir}/${filename.replace('.png', '.html')}`, html);
}

// Create templates
createScreenshotTemplate('mobile-home.png', 390, 844, 'Startseite');
createScreenshotTemplate('mobile-events.png', 390, 844, 'Veranstaltungen');
createScreenshotTemplate('desktop-home.png', 1280, 800, 'Startseite');
createScreenshotTemplate('desktop-events.png', 1280, 800, 'Veranstaltungen');

console.log('All templates created successfully!');
console.log('Open the HTML files in your browser and take screenshots of each template.');

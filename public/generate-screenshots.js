const fs = require('fs');
const { createCanvas } = require('canvas');

// Ensure screenshots directory exists
const screenshotsDir = './public/screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Function to create a placeholder screenshot
function createPlaceholderScreenshot(filename, width, height, title, color) {
  console.log(`Creating placeholder screenshot: ${filename} (${width}x${height})`);
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, width, height);
  
  // Draw header
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, 60);
  
  // Draw content area with slight border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 70, width - 20, height - 140);
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 70, width - 20, height - 140);
  
  // Add title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('1200 Jahre Radolfzell', width / 2, 40);
  
  // Add page title
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 100);
  
  // Add placeholder content
  ctx.fillStyle = '#666666';
  for (let i = 0; i < 5; i++) {
    const y = 150 + i * 60;
    if (y < height - 80) {
      ctx.fillRect(30, y, width - 60, 40);
    }
  }
  
  // Add footer for mobile
  if (width < 500) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, height - 60, width, 60);
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${screenshotsDir}/${filename}`, buffer);
}

// Create mobile screenshots
createPlaceholderScreenshot('mobile-home.png', 390, 844, 'Startseite', '#3b4ea3');
createPlaceholderScreenshot('mobile-events.png', 390, 844, 'Veranstaltungen', '#3b4ea3');

// Create desktop screenshots
createPlaceholderScreenshot('desktop-home.png', 1280, 800, 'Startseite', '#3b4ea3');
createPlaceholderScreenshot('desktop-events.png', 1280, 800, 'Veranstaltungen', '#3b4ea3');

console.log('All placeholder screenshots created successfully!');

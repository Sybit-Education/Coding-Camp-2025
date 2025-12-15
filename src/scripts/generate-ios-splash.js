#!/usr/bin/env node
/**
 * Auto‑Generate Apple Splash Screens
 * ----------------------------------
 * This script generates all required iOS splash screens
 * from a single square source image.
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const OUT_DIR = path.join(__dirname, '../../public/apple-splash')
const SRC = path.join(__dirname, '../../public/Logo_Radolfzell1200_Geschtern.Heit.Morge_square.jpg')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
if (!fs.existsSync(SRC)) {
  console.error('❌ Source image not found:', SRC)
  process.exit(1)
}

const sizes = [
  { w: 1170, h: 2532 },
  { w: 1284, h: 2778 },
  { w: 828, h: 1792 },
  { w: 1125, h: 2436 },
  { w: 1242, h: 2688 },
  { w: 1536, h: 2048 },
  { w: 1668, h: 2224 },
  { w: 1668, h: 2388 },
  { w: 2048, h: 2732 },
]

const landscapeSizes = sizes.map((s) => ({ w: s.h, h: s.w }))

;(async () => {
  const indexPath = path.join(__dirname, '../../src/index.html')
  let indexHtml = fs.readFileSync(indexPath, 'utf8')

  const startMarker = '<!-- iOS Splash Screens -->'
  const endMarker = '</head>'

  const splashLinks = sizes
    .map((s) => {
      return `    <link rel="apple-touch-startup-image" href="/apple-splash/apple-splash-${s.w}x${s.h}.png" media="(device-width: ${s.w / 3}px) and (device-height: ${s.h / 3}px) and (-webkit-device-pixel-ratio: 3)" />`
    })
    .join('\n')

  const darkLinks = sizes
    .map((s) => {
      return `    <link rel=\"apple-touch-startup-image\" href=\"/apple-splash/apple-splash-dark-${s.w}x${s.h}.png\" media=\"(prefers-color-scheme: dark) and (device-width: ${s.w / 3}px) and (device-height: ${s.h / 3}px) and (-webkit-device-pixel-ratio: 3)\" />`
    })
    .join('\n')

  const landscapeLinks = landscapeSizes
    .map((s) => {
      return `    <link rel="apple-touch-startup-image" href="/apple-splash/apple-splash-landscape-${s.w}x${s.h}.png" media="(orientation: landscape) and (device-width: ${s.w / 3}px) and (device-height: ${s.h / 3}px) and (-webkit-device-pixel-ratio: 3)" />`
    })
    .join('\n')

  const darkLandscapeLinks = landscapeSizes
    .map((s) => {
      return `    <link rel="apple-touch-startup-image" href="/apple-splash/apple-splash-dark-landscape-${s.w}x${s.h}.png" media="(prefers-color-scheme: dark) and (orientation: landscape) and (device-width: ${s.w / 3}px) and (device-height: ${s.h / 3}px) and (-webkit-device-pixel-ratio: 3)" />`
    })
    .join('\n')

  const newBlock = `${startMarker}
${splashLinks}

  <!-- Dark Mode Splash Screens -->
${darkLinks}

  <!-- Landscape Splash Screens -->
${landscapeLinks}

  <!-- Dark Mode Landscape Splash Screens -->
${darkLandscapeLinks}`

  indexHtml = indexHtml.replace(
    /<!-- iOS Splash Screens -->[\s\S]*?<\/head>/,
    `${newBlock}
  ${endMarker}`,
  )

  fs.writeFileSync(indexPath, indexHtml)
  console.log('📄 Updated index.html with splash screen links')
  console.log('🔧 Generating iOS splash screens...')

  for (const s of sizes) {
    const file = path.join(OUT_DIR, `apple-splash-${s.w}x${s.h}.png`)
    await sharp(SRC)
      .resize(s.w, s.h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(file)

    console.log('✓', file)
  }

  console.log('\n✨ All splash screens created in public/apple-splash')

  // Generate dark-mode variants
  for (const s of sizes) {
    const darkFile = path.join(OUT_DIR, `apple-splash-dark-${s.w}x${s.h}.png`)
    await sharp(SRC)
      .resize(s.w, s.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(darkFile)
    console.log('✓ Dark', darkFile)
  }
  console.log('✨ Dark-mode splash screens created')

  // Generate landscape variants (light)
  for (const s of landscapeSizes) {
    const file = path.join(OUT_DIR, `apple-splash-landscape-${s.w}x${s.h}.png`)
    await sharp(SRC)
      .resize(s.w, s.h, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(file)
    console.log('✓ Landscape', file)
  }

  // Generate landscape variants (dark)
  for (const s of landscapeSizes) {
    const file = path.join(OUT_DIR, `apple-splash-dark-landscape-${s.w}x${s.h}.png`)
    await sharp(SRC)
      .resize(s.w, s.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .toFile(file)
    console.log('✓ Dark Landscape', file)
  }
})()

// Replaces the black background of every .jpg in public/images with
// NEW_BG_COLOR, and sets THUMBNAIL_BG_COLOR in ProjectCard (thumbnail
// background and card border) to match. Change the color and re-run:
//   node scripts/recolor-images.mjs
//
// The first run saves each untouched image as <name>.original.jpg, and every
// run reads from those copies, so the script can be re-run any number of
// times with different colors. The copies are git-ignored and only exist on
// the machine that first ran the script.

import { copyFile, access, rm, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const NEW_BG_COLOR = '#566b8a'

// A pixel counts as background black when every channel is at or below this.
// JPEG compression leaves the "black" slightly noisy, so 0 would miss some.
const BLACK_THRESHOLD = 40

// How far (in pixels) from the background to look for anti-aliased edge
// pixels that should be blended toward the new color.
const EDGE_RING_RADIUS = 2

// By default every near-black pixel is recolored. Images listed here only
// recolor black that's connected to the image border, so enclosed black
// details stay black (the fish's eye).
const KEEP_ENCLOSED_BLACK_FILES = new Set(['fly-fishing.jpg'])

const ORIGINAL_SUFFIX = '.original.jpg'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(scriptDir, '..')
const imagesDir = path.join(projectRoot, 'public', 'images')
const projectCardPath = path.join(projectRoot, 'app', '_components', 'ProjectCard.tsx')
const nextImageCacheDir = path.join(projectRoot, '.next', 'dev', 'cache', 'images')

const thumbnailBgColorPattern = /const THUMBNAIL_BG_COLOR = '[^']*'/

function parseHexColor(hex) {
  const digits = hex.replace('#', '')
  return {
    red: parseInt(digits.slice(0, 2), 16),
    green: parseInt(digits.slice(2, 4), 16),
    blue: parseInt(digits.slice(4, 6), 16),
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function isRecolorTarget(fileName) {
  return fileName.endsWith('.jpg') && !fileName.endsWith(ORIGINAL_SUFFIX)
}

async function findTargetImages() {
  const fileNames = await readdir(imagesDir)
  return fileNames.filter(isRecolorTarget)
}

function getOriginalPath(targetPath) {
  return targetPath.replace(/\.jpg$/, ORIGINAL_SUFFIX)
}

async function ensureOriginalSaved(targetPath, originalPath) {
  if (await fileExists(originalPath)) return
  await copyFile(targetPath, originalPath)
  console.log(`Saved untouched image to ${originalPath}`)
}

function getMaxChannel(pixels, pixelIndex) {
  const offset = pixelIndex * 3
  return Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2])
}

// Paint-bucket fill starting from every near-black pixel on the image border.
// Black areas not connected to the border (the fish's eye) are left alone
// unless seedFromEveryPixel is set, which makes every near-black pixel count.
function findBackgroundPixels(pixels, width, height, seedFromEveryPixel) {
  const isBackground = new Uint8Array(width * height)
  const queue = new Int32Array(width * height)
  let queueHead = 0
  let queueTail = 0

  function enqueueIfBlack(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const pixelIndex = y * width + x
    if (isBackground[pixelIndex]) return
    if (getMaxChannel(pixels, pixelIndex) > BLACK_THRESHOLD) return
    isBackground[pixelIndex] = 1
    queue[queueTail] = pixelIndex
    queueTail++
  }

  for (let x = 0; x < width; x++) {
    enqueueIfBlack(x, 0)
    enqueueIfBlack(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    enqueueIfBlack(0, y)
    enqueueIfBlack(width - 1, y)
  }

  if (seedFromEveryPixel) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        enqueueIfBlack(x, y)
      }
    }
  }

  while (queueHead < queueTail) {
    const pixelIndex = queue[queueHead]
    queueHead++
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    enqueueIfBlack(x + 1, y)
    enqueueIfBlack(x - 1, y)
    enqueueIfBlack(x, y + 1)
    enqueueIfBlack(x, y - 1)
  }

  return isBackground
}

function isNearBackground(isBackground, width, height, x, y) {
  for (let dy = -EDGE_RING_RADIUS; dy <= EDGE_RING_RADIUS; dy++) {
    for (let dx = -EDGE_RING_RADIUS; dx <= EDGE_RING_RADIUS; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      if (isBackground[ny * width + nx]) return true
    }
  }
  return false
}

// Brightest non-background pixel nearby, used as the solid foreground color
// that an edge pixel is a partial blend of.
function getLocalForegroundMax(pixels, isBackground, width, height, x, y) {
  const searchRadius = EDGE_RING_RADIUS + 2
  let localMax = 0
  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const neighborIndex = ny * width + nx
      if (isBackground[neighborIndex]) continue
      localMax = Math.max(localMax, getMaxChannel(pixels, neighborIndex))
    }
  }
  return localMax
}

// An anti-aliased edge pixel is roughly foreground * coverage + black, so
// adding newColor * (1 - coverage) swaps the black share for the new color.
function blendEdgePixel(pixels, offset, coverage, newColor) {
  const backgroundShare = 1 - coverage
  pixels[offset] = Math.min(255, pixels[offset] + newColor.red * backgroundShare)
  pixels[offset + 1] = Math.min(255, pixels[offset + 1] + newColor.green * backgroundShare)
  pixels[offset + 2] = Math.min(255, pixels[offset + 2] + newColor.blue * backgroundShare)
}

function recolorPixels(pixels, width, height, newColor, keepEnclosedBlack) {
  const isBackground = findBackgroundPixels(pixels, width, height, !keepEnclosedBlack)
  const output = Buffer.from(pixels)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x
      const offset = pixelIndex * 3

      if (isBackground[pixelIndex]) {
        output[offset] = newColor.red
        output[offset + 1] = newColor.green
        output[offset + 2] = newColor.blue
        continue
      }

      if (!isNearBackground(isBackground, width, height, x, y)) continue

      const foregroundMax = getLocalForegroundMax(pixels, isBackground, width, height, x, y)
      if (foregroundMax === 0) continue
      const coverage = Math.min(1, getMaxChannel(pixels, pixelIndex) / foregroundMax)
      blendEdgePixel(output, offset, coverage, newColor)
    }
  }

  return output
}

async function recolorImage(fileName, newColor) {
  const targetPath = path.join(imagesDir, fileName)
  const originalPath = getOriginalPath(targetPath)
  await ensureOriginalSaved(targetPath, originalPath)

  const { data, info } = await sharp(originalPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const keepEnclosedBlack = KEEP_ENCLOSED_BLACK_FILES.has(fileName)
  const recolored = recolorPixels(
    data,
    info.width,
    info.height,
    newColor,
    keepEnclosedBlack,
  )

  await sharp(recolored, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 3,
    },
  })
    .jpeg({ quality: 90 })
    .toFile(targetPath)

  console.log(`Wrote ${targetPath}`)
}

async function updateProjectCardColor() {
  const source = await readFile(projectCardPath, 'utf8')
  if (!thumbnailBgColorPattern.test(source)) {
    throw new Error(`Could not find THUMBNAIL_BG_COLOR in ${projectCardPath}`)
  }
  const updated = source.replace(
    thumbnailBgColorPattern,
    `const THUMBNAIL_BG_COLOR = '${NEW_BG_COLOR}'`,
  )
  await writeFile(projectCardPath, updated)
  console.log(`Set THUMBNAIL_BG_COLOR in ${projectCardPath}`)
}

// next/image serves optimized copies from this cache for up to 4 hours
// (the Next 16 minimumCacheTTL default), so the dev server would keep
// showing the old image without this. The cache rebuilds on demand.
async function clearNextImageCache() {
  await rm(nextImageCacheDir, { recursive: true, force: true })
  console.log(`Cleared ${nextImageCacheDir} - hard-refresh the browser (Ctrl+Shift+R)`)
}

async function main() {
  const newColor = parseHexColor(NEW_BG_COLOR)
  const imageFileNames = await findTargetImages()

  for (const fileName of imageFileNames) {
    await recolorImage(fileName, newColor)
  }

  await updateProjectCardColor()
  await clearNextImageCache()
  console.log(`Background is now ${NEW_BG_COLOR}`)
}

await main()

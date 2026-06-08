import { readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const SIZES = [
  { src: "manifest-icon-192.maskable.png", size: 192 },
  { src: "manifest-icon-512.maskable.png", size: 512 },
]

const PADDING_RATIO = 0.2

async function generateMaskableIcon(srcPath, dstPath, size) {
  const { Jimp } = await import("jimp")

  const image = await Jimp.read(srcPath)
  image.resize({ w: size, h: size })

  const scaleTo = Math.round(size * (1 - PADDING_RATIO * 2))
  const offset = Math.round((size - scaleTo) / 2)

  image.resize({ w: scaleTo, h: scaleTo })

  const white = 0xffffffff
  const canvas = new Jimp({
    width: size,
    height: size,
    color: white,
  })

  canvas.composite(image, offset, offset)
  await canvas.write(dstPath)
  console.log(`  -> ${dstPath}`)
}

const iconsDir = join(root, "public", "icons")

for (const { src, size } of SIZES) {
  const srcPath = join(iconsDir, src)
  const dstPath = join(iconsDir, `maskable-${size}.png`)
  console.log(`Generating maskable icon ${size}x${size}...`)
  await generateMaskableIcon(srcPath, dstPath, size)
}

console.log("Done!")

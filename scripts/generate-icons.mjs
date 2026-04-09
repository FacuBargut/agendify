import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512"
  xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0D6E6E"/>
  <text
    x="256"
    y="340"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="280"
    font-weight="700"
    fill="white"
    text-anchor="middle"
    dominant-baseline="auto"
  >A</text>
</svg>
`

for (const size of sizes) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
  console.log(`Generado: icon-${size}x${size}.png`)
}

console.log('Iconos generados exitosamente')

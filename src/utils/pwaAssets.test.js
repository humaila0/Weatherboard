import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const publicFile = (name) => resolve(root, 'public', name)

function pngSize(path) {
  const buffer = readFileSync(path)
  const signature = buffer.subarray(0, 8).toString('hex')
  expect(signature).toBe('89504e470d0a1a0a')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

describe('PWA assets', () => {
  const manifest = JSON.parse(readFileSync(publicFile('manifest.webmanifest'), 'utf8'))

  it('declares an installable standalone manifest', () => {
    expect(manifest.name).toBe('WeatherBoard')
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('ships icons that match their declared dimensions', () => {
    const required = new Map([
      [192, 'any'],
      [512, 'any'],
      [512, 'maskable'],
    ])

    for (const [size, purpose] of required) {
      const icon = manifest.icons.find(
        (entry) => entry.sizes === `${size}x${size}` && entry.purpose === purpose,
      )
      expect(icon, `missing ${size}px ${purpose} icon`).toBeTruthy()
      const path = publicFile(icon.src.replace(/^\//, ''))
      expect(existsSync(path)).toBe(true)
      expect(pngSize(path)).toEqual({ width: size, height: size })
    }
  })

  it('links the manifest, theme colour, and Apple touch icon from index.html', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('name="theme-color"')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('viewport-fit=cover')
  })

  it('registers the expected service worker behaviours', () => {
    const worker = readFileSync(publicFile('service-worker.js'), 'utf8')
    expect(worker).toContain("addEventListener('install'")
    expect(worker).toContain("addEventListener('activate'")
    expect(worker).toContain("addEventListener('fetch'")
    expect(worker).toContain("addEventListener('periodicsync'")
    expect(worker).toContain("addEventListener('notificationclick'")
    expect(worker).toContain('weatherboard-shell-')
    expect(worker).toContain("'/index.html'")
    expect(worker).toContain("request.mode === 'navigate'")
  })
})

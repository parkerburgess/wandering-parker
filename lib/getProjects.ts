import fs from 'fs'
import path from 'path'

export interface ProjectMeta {
  slug: string
  name: string
  description: string
  order: number
  thumbnailExt: string | null
}

const THUMBNAIL_EXTS = ['png', 'jpg', 'jpeg', 'webp']

export function getProjects(): ProjectMeta[] {
  const projectsDir = path.join(process.cwd(), 'projects')

  if (!fs.existsSync(projectsDir)) {
    return []
  }

  const entries = fs.readdirSync(projectsDir, { withFileTypes: true })
  const projects: ProjectMeta[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const slug = entry.name
    const projectDir = path.join(projectsDir, slug)
    const metaPath = path.join(projectDir, 'project.json')

    if (!fs.existsSync(metaPath)) {
      console.warn(`[getProjects] Skipping "${slug}": missing project.json`)
      continue
    }

    let meta: { name?: string; description?: string; order?: number }
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    } catch (err) {
      console.warn(`[getProjects] Skipping "${slug}": could not parse project.json`, err)
      continue
    }

    const thumbnailExt =
      THUMBNAIL_EXTS.find((ext) =>
        fs.existsSync(path.join(projectDir, `thumbnail.${ext}`))
      ) ?? null

    projects.push({
      slug,
      name: meta.name ?? slug,
      description: meta.description ?? '',
      order: meta.order ?? 999,
      thumbnailExt,
    })
  }

  return projects.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.slug.localeCompare(b.slug)
  })
}

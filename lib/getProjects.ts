import projectsData from '../data/projects.json'

interface ProjectData {
  name: string
  description: string
  category: string
  image: string
  subdomain: string
  devPort?: number
}

export interface Project {
  name: string
  description: string
  category: string
  image: string
  subdomain: string
  url: string
}

export function getProjects(): Project[] {
  const isDev = process.env.NODE_ENV === 'development'
  return (projectsData as ProjectData[]).map((p) => ({
    name: p.name,
    description: p.description,
    category: p.category,
    image: p.image,
    subdomain: p.subdomain,
    url: isDev && p.devPort
      ? `http://localhost:${p.devPort}`
      : `https://${p.subdomain}.wanderingparker.com`,
  }))
}

export function getProjectsByCategory(): Record<string, Project[]> {
  const groups: Record<string, Project[]> = {}
  for (const project of getProjects()) {
    if (!groups[project.category]) groups[project.category] = []
    groups[project.category].push(project)
  }
  return groups
}

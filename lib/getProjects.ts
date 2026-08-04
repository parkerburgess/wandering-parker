import projectsData from '../data/projects.json'

interface ProjectData {
  name: string
  description: string
  learnings: string
  image: string
  subdomain: string
}

export interface Project {
  name: string
  description: string
  learnings: string
  image: string
  subdomain: string
  url: string
}

export function getProjects(): Project[] {
  return (projectsData as ProjectData[]).map((p) => ({
    name: p.name,
    description: p.description,
    learnings: p.learnings,
    image: p.image,
    subdomain: p.subdomain,
    url: `https://${p.subdomain}.wanderingparker.com`,
  }))
}

import projectsData from '../data/projects.json'
import { isProjectArtKey, ProjectArtKey } from './projectArt'

interface ProjectData {
  name: string
  description: string
  skills: string
  art: string
  subdomain: string
}

export interface Project {
  name: string
  description: string
  skills: string[]
  // null when projects.json names art that doesn't exist; the card shows a fallback.
  art: ProjectArtKey | null
  subdomain: string
  url: string
}

// projects.json stores skills as a comma-separated string, e.g. "NextJS, Agent-AI".
function parseSkills(skills: string): string[] {
  return skills
    .split(',')
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
}

export function getProjects(): Project[] {
  return (projectsData as ProjectData[]).map((p) => ({
    name: p.name,
    description: p.description,
    skills: parseSkills(p.skills),
    art: isProjectArtKey(p.art) ? p.art : null,
    subdomain: p.subdomain,
    url: `https://${p.subdomain}.wanderingparker.com`,
  }))
}

import projectsData from '../data/projects.json'

interface ProjectData {
  name: string
  description: string
  skills: string
  image: string
  subdomain: string
}

export interface Project {
  name: string
  description: string
  skills: string[]
  image: string
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
    image: p.image,
    subdomain: p.subdomain,
    url: `https://${p.subdomain}.wanderingparker.com`,
  }))
}

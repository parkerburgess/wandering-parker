import resumeData from '../data/resume.json'

// Hand-transcribed from public/Resume/Parker_Burgess_Resume.docx; update
// resume.json whenever the docx changes.

export interface SkillGroup {
  category: string
  items: string
}

export interface Role {
  // Omitted for entries with no job title, e.g. the travel sabbatical.
  title?: string
  // Omitted when the company's dates already cover the single role.
  dates?: string
  bullets: string[]
}

export interface ExperienceEntry {
  company: string
  dates: string
  description?: string
  roles: Role[]
}

export interface EducationEntry {
  degree: string
  school: string
  date: string
}

export interface Resume {
  name: string
  email: string
  location: string
  summary: string[]
  skills: SkillGroup[]
  experience: ExperienceEntry[]
  education: EducationEntry[]
}

export function getResume(): Resume {
  return resumeData
}

import { Project } from '@/lib/getProjects'
import ProjectArt from './ProjectArt'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // #region Tailwind utility consts
  const projectCardCls =
    'group grid grid-cols-[2fr_3fr] h-64 rounded-xl overflow-hidden ' +
    'border border-neutral-400 bg-card ' +
    'transition-all duration-200 hover:shadow-lg ' +
    'hover:shadow-primary-600/5 hover:-translate-y-0.5'
  // The art is transparent, so this tint is what shows behind it.
  const thumbnailWrapCls = 'overflow-hidden bg-neutral-50'
  const cardBodyCls = 'grid grid-rows-[auto_auto_1fr] gap-3 min-h-0 p-5'
  const projectNameCls = 'text-lg font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors'
  const skillListCls = 'flex flex-wrap gap-2'
  const skillChipCls = 'rounded-full bg-neutral-400 px-2 py-1 text-sm text-neutral-800'
  const projectDescCls = 'text-sm text-neutral-500 overflow-hidden line-clamp-4'
  // #endregion

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={projectCardCls}
    >
      <div className={thumbnailWrapCls}>
        <ProjectArt art={project.art} />
      </div>
      <div className={cardBodyCls}>
        <h3 className={projectNameCls}>
          {project.name}
        </h3>
        {project.skills.length > 0 && (
          <ul className={skillListCls}>
            {project.skills.map((skill) => (
              <li key={skill} className={skillChipCls}>
                {skill}
              </li>
            ))}
          </ul>
        )}
        {project.description && (
          <p className={projectDescCls}>
            {project.description}
          </p>
        )}
      </div>
    </a>
  )
}

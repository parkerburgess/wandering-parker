import { Project } from '@/lib/getProjects'
import ProjectArt from './ProjectArt'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // #region Tailwind utility consts
  // Name, art and description stack vertically; the 1fr row lets the
  // description take whatever height the grid row gives the card.
  const projectCardCls =
    'group grid grid-rows-[auto_auto_1fr] gap-4 p-5 rounded-xl ' +
    'border border-neutral-400 bg-card ' +
    'transition-all duration-200 hover:shadow-lg ' +
    'hover:shadow-primary-600/5 hover:-translate-y-0.5'
  const projectNameCls = 'text-lg font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors'
  // The art is transparent, so this tint is what shows behind it.
  const thumbnailWrapCls = 'h-40 rounded-lg overflow-hidden bg-neutral-50'
  const projectDescCls = 'text-sm text-neutral-500 overflow-hidden line-clamp-4'
  // #endregion

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={projectCardCls}
    >
      <h3 className={projectNameCls}>
        {project.name}
      </h3>
      <div className={thumbnailWrapCls}>
        <ProjectArt art={project.art} />
      </div>
      {project.description && (
        <p className={projectDescCls}>
          {project.description}
        </p>
      )}
    </a>
  )
}

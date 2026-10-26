import { Project } from '@/lib/getProjects'
import ProjectImage from './ProjectImage'

interface ProjectCardProps {
  project: Project
}

// Matches the background baked into the thumbnails, so the letterboxing
// from object-contain doesn't show as bars. Also used for the card border.
// Set by scripts/recolor-images.mjs - change it there, not here.
const THUMBNAIL_BG_COLOR = '#566b8a'

export default function ProjectCard({ project }: ProjectCardProps) {
  // #region Tailwind utility consts
  const projectCardCls =
    'group block rounded-xl overflow-hidden border bg-card ' +
    'transition-all duration-200 hover:shadow-lg ' +
    'hover:shadow-primary-600/5 hover:-translate-y-0.5'
  const thumbnailWrapCls = 'aspect-video overflow-hidden'
  const cardBodyCls = 'p-5'
  const projectNameCls = 'text-lg font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors'
  const projectDescCls = 'mt-1 text-sm text-neutral-500 line-clamp-2'
  // #endregion

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={projectCardCls}
      style={{ borderColor: THUMBNAIL_BG_COLOR }}
    >
      <div
        className={thumbnailWrapCls}
        style={{ backgroundColor: THUMBNAIL_BG_COLOR }}
      >
        <ProjectImage
          src={project.image}
          alt={`${project.name} thumbnail`}
        />
      </div>
      <div className={cardBodyCls}>
        <h3 className={projectNameCls}>
          {project.name}
        </h3>
        {project.description && (
          <p className={projectDescCls}>
            {project.description}
          </p>
        )}
      </div>
    </a>
  )
}

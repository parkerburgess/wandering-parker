import { projectArtComponents, ProjectArtKey } from '@/lib/projectArt'

interface ProjectArtProps {
  art: ProjectArtKey | null
}

export default function ProjectArt({ art }: ProjectArtProps) {
  // #region Tailwind utility consts
  // SVG's default preserveAspectRatio letterboxes like object-contain.
  const artCls = 'w-full h-full group-hover:scale-105 transition-transform duration-300'
  const fallbackCls = 'w-full h-full grid place-items-center'
  const fallbackTextCls = 'text-neutral-500 text-sm'
  // #endregion

  if (art === null) {
    return (
      <div className={fallbackCls}>
        <span className={fallbackTextCls}>No image</span>
      </div>
    )
  }

  const ArtComponent = projectArtComponents[art]
  return <ArtComponent className={artCls} />
}

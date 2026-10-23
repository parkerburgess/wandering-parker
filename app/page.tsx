import { cookies } from 'next/headers'
import { getProjects, Project } from '@/lib/getProjects'
import { isAuthDisabled } from '@/lib/auth'
import ProjectImage from './_components/ProjectImage'

async function getAccessibleApps(token: string): Promise<string[]> {
  const res = await fetch(`${process.env.AUTH_SERVICE_URL}/api/user/apps`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.apps as string[]
}

// With the dev auth bypass on there is no token to ask the auth service
// with, so every project is shown.
async function getVisibleProjects(): Promise<Project[]> {
  const allProjects = getProjects()
  if (isAuthDisabled()) return allProjects

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value ?? ''
  const accessibleApps = await getAccessibleApps(token)
  return allProjects.filter((p) => accessibleApps.includes(p.subdomain))
}

export default async function HomePage() {
  const visible = await getVisibleProjects()

  // #region Tailwind utility consts
  const headingWrapCls = 'mb-10'
  const headingCls = 'text-3xl font-bold text-neutral-800 mb-2'
  const subheadingCls = 'text-neutral-500'
  const emptyStateCls = 'text-center py-24 text-neutral-500'
  const emptyStateTitleCls = 'text-lg'
  const emptyStateSubtitleCls = 'text-sm mt-1'
  const gridCls = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
  const projectCardCls =
    'group block rounded-xl overflow-hidden border border-neutral-200 bg-card ' +
    'hover:border-primary-400/50 transition-all duration-200 hover:shadow-lg ' +
    'hover:shadow-primary-600/5 hover:-translate-y-0.5'
  // Black to blend with the thumbnails' own black backgrounds, so the
  // letterboxing from object-contain doesn't show as bars.
  const thumbnailWrapCls = 'aspect-video bg-black overflow-hidden'
  const cardBodyCls = 'p-5'
  const projectNameCls = 'text-lg font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors'
  const projectDescCls = 'mt-1 text-sm text-neutral-500 line-clamp-2'
  const projectUrlCls = 'mt-3 text-xs text-primary-600/70 font-medium'
  // #endregion

  return (
    <div>
      <div className={headingWrapCls}>
        <h1 className={headingCls}>Projects</h1>
        <p className={subheadingCls}>
          A collection of interactive experiments and tools.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={emptyStateCls}>
          <p className={emptyStateTitleCls}>No projects available.</p>
          <p className={emptyStateSubtitleCls}>No apps have been granted to your account yet.</p>
        </div>
      ) : (
        <div className={gridCls}>
          {visible.map((project) => (
            <a
              key={project.subdomain}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className={projectCardCls}
            >
              <div className={thumbnailWrapCls}>
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
                <p className={projectUrlCls}>
                  {project.subdomain}.wanderingparker.com ↗
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

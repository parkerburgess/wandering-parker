import { cookies } from 'next/headers'
import { getProjects, Project } from '@/lib/getProjects'
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

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value ?? ''
  const accessibleApps = await getAccessibleApps(token)
  
  const visible = getProjects().filter((p) => accessibleApps.includes(p.subdomain))
  
  const grouped: Record<string, Project[]> = {}
  for (const project of visible) {
    if (!grouped[project.learnings]) grouped[project.learnings] = []
    grouped[project.learnings].push(project)
  }
  const categories = Object.keys(grouped)

  // #region Tailwind utility consts
  const headingWrapCls = 'mb-10'
  const headingCls = 'text-3xl font-bold text-neutral-800 mb-2'
  const subheadingCls = 'text-neutral-500'
  const emptyStateCls = 'text-center py-24 text-neutral-500'
  const emptyStateTitleCls = 'text-lg'
  const emptyStateSubtitleCls = 'text-sm mt-1'
  const categoryListCls = 'space-y-12'
  const categoryHeadingCls = 'text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4'
  const gridCls = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
  const projectCardCls =
    'group block rounded-xl overflow-hidden border border-neutral-200 bg-card ' +
    'hover:border-brand-400/50 transition-all duration-200 hover:shadow-lg ' +
    'hover:shadow-brand-600/5 hover:-translate-y-0.5'
  const thumbnailWrapCls = 'aspect-video bg-subtle overflow-hidden'
  const cardBodyCls = 'p-5'
  const projectNameCls = 'text-lg font-semibold text-neutral-800 group-hover:text-brand-600 transition-colors'
  const projectDescCls = 'mt-1 text-sm text-neutral-500 line-clamp-2'
  const projectUrlCls = 'mt-3 text-xs text-brand-600/70 font-medium'
  // #endregion

  return (
    <div>
      <div className={headingWrapCls}>
        <h1 className={headingCls}>Projects</h1>
        <p className={subheadingCls}>
          A collection of interactive experiments and tools.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className={emptyStateCls}>
          <p className={emptyStateTitleCls}>No projects available.</p>
          <p className={emptyStateSubtitleCls}>No apps have been granted to your account yet.</p>
        </div>
      ) : (
        <div className={categoryListCls}>
          {categories.map((learnings) => (
            <section key={learnings}>
              <h2 className={categoryHeadingCls}>
                {learnings}
              </h2>
              <div className={gridCls}>
                {grouped[learnings].map((project) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

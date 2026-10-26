import { cookies } from 'next/headers'
import { getProjects, Project } from '@/lib/getProjects'
import { isAuthDisabled } from '@/lib/auth'
import ProjectCard from './_components/ProjectCard'

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
  const visibleProjects = await getVisibleProjects()

  // #region Tailwind utility consts
  const headingWrapCls = 'mb-10'
  const headingCls = 'text-3xl font-bold text-neutral-800 mb-2'
  const subheadingCls = 'text-neutral-500'
  const emptyStateCls = 'text-center py-24 text-neutral-500'
  const emptyStateTitleCls = 'text-lg'
  const emptyStateSubtitleCls = 'text-sm mt-1'
  const gridCls = 'grid grid-cols-1 lg:grid-cols-2 gap-6'
  // #endregion

  return (
    <div>
      <div className={headingWrapCls}>
        <h1 className={headingCls}>Projects</h1>
        <p className={subheadingCls}>
          A collection of interactive experiments and tools.
        </p>
      </div>

      {visibleProjects.length === 0 ? (
        <div className={emptyStateCls}>
          <p className={emptyStateTitleCls}>No projects available.</p>
          <p className={emptyStateSubtitleCls}>No apps have been granted to your account yet.</p>
        </div>
      ) : (
        <div className={gridCls}>
          {visibleProjects.map((project) => (
            <ProjectCard key={project.subdomain} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

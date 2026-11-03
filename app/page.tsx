import { cookies } from 'next/headers'
import { getProjects, Project } from '@/lib/getProjects'
import { isAuthDisabled } from '@/lib/auth'
import ProjectCard from './_components/ProjectCard'
import ProfilePanel from './_components/ProfilePanel'

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
  // Below lg the profile drops under the projects at full width.
  const pageCls = 'grid grid-cols-1 lg:grid-cols-[1fr_18rem] items-start gap-8'
  // Matches ProjectCard's frame at half its h-64 height; no hover lift,
  // since the heading isn't a link.
  const headingWrapCls =
    'grid content-center h-32 mb-10 p-5 rounded-xl ' +
    'border border-neutral-400 bg-card'
  const headingCls = 'text-3xl font-bold text-neutral-800 mb-2'
  const subheadingCls = 'text-neutral-500'
  const emptyStateCls = 'text-center py-24 text-neutral-500'
  const emptyStateTitleCls = 'text-lg'
  const emptyStateSubtitleCls = 'text-sm mt-1'
  const gridCls = 'grid grid-cols-1 gap-6'
  // #endregion

  return (
    <div className={pageCls}>
      <div>
        <div className={headingWrapCls}>
          <h1 className={headingCls}>Projects and Purpose</h1>
          <p className={subheadingCls}>
            This is a set of projects that I'm using to explore concepts and tools (Claude) as well as to keep my skills sharp.  
            These are close to production ready projects.  The code is available on my GitHub (link in my resume) and there 
            are, or will be soon, detail pages that include diagrams and architectual details.
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
      <ProfilePanel />
    </div>
  )
}

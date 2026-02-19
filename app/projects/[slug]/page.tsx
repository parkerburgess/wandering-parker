import { notFound } from 'next/navigation'
import { getProjects } from '@/lib/getProjects'
import ProjectLoader from './ProjectLoader'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props) {
  const project = getProjects().find((p) => p.slug === params.slug)
  if (!project) return {}
  return { title: `${project.name} | WanderingParker` }
}

export default function ProjectPage({ params }: Props) {
  const project = getProjects().find((p) => p.slug === params.slug)

  if (!project) {
    notFound()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-text-muted">{project.description}</p>
        )}
      </div>
      <ProjectLoader slug={params.slug} />
    </div>
  )
}

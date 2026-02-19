import Link from 'next/link'
import { getProjects } from '@/lib/getProjects'

export default function HomePage() {
  const projects = getProjects()

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Projects</h1>
        <p className="text-text-muted">
          A collection of interactive experiments and tools.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <p className="text-lg">No projects found.</p>
          <p className="text-sm mt-1">
            Add a folder with a <code className="text-accent">project.json</code> to{' '}
            <code className="text-accent">projects/</code> to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group block rounded-xl overflow-hidden border border-border bg-surface hover:border-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-background overflow-hidden">
                {project.thumbnailExt ? (
                  <img
                    src={`/api/thumbnail/${project.slug}`}
                    alt={`${project.name} thumbnail`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-text-muted text-sm">No thumbnail</span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <h2 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {project.name}
                </h2>
                {project.description && (
                  <p className="mt-1 text-sm text-text-muted line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { getProjectsByCategory } from '@/lib/getProjects'
import ProjectImage from './_components/ProjectImage'

export default function HomePage() {
  const grouped = getProjectsByCategory()
  const categories = Object.keys(grouped)

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Parker TEst</h1>
        <p className="text-text-muted">
          A collection of interactive experiments and tools.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <p className="text-lg">No projects found.</p>
          <p className="text-sm mt-1">
            Add an entry to{' '}
            <code className="text-accent">data/projects.json</code> to get
            started.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[category].map((project) => (
                  <a
                    key={project.subdomain}
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl overflow-hidden border border-border bg-surface hover:border-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5"
                  >
                    {/* Image */}
                    <div className="aspect-video bg-background overflow-hidden">
                      <ProjectImage
                        src={project.image}
                        alt={`${project.name} thumbnail`}
                      />
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-1 text-sm text-text-muted line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-accent/70 font-medium">
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

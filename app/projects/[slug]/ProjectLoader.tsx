'use client'

import { lazy, Suspense } from 'react'

interface Props {
  slug: string
}

export default function ProjectLoader({ slug }: Props) {
  const ProjectComponent = lazy(
    () => import(`../../../projects/${slug}/component`)
  )

  return (
    <Suspense
      fallback={
        <div className="text-text-muted py-12 text-center">Loading…</div>
      }
    >
      <ProjectComponent />
    </Suspense>
  )
}

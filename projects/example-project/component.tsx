'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  {
    number: 1,
    title: 'Copy this folder',
    detail: 'Duplicate projects/example-project/ and give the copy a new name (kebab-case, no spaces).',
  },
  {
    number: 2,
    title: 'Rename & edit project.json',
    detail: 'Set name, description, and order to your liking.',
  },
  {
    number: 3,
    title: 'Add thumbnail.png',
    detail: 'Drop any image named thumbnail.png (or .jpg / .webp) into the folder.',
  },
  {
    number: 4,
    title: 'Build your component',
    detail: 'Replace the contents of component.tsx with your own React component. It runs client-side only, so window and canvas are available.',
  },
]

const TECH_PILLS = ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS 3']

export default function ExampleProject() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation on mount
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
      className="max-w-2xl mx-auto"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        Template Component
      </div>

      {/* Heading */}
      <h2 className="text-5xl font-bold text-accent mb-4 tracking-tight">
        Hello, World.
      </h2>

      <p className="text-text-muted text-lg leading-relaxed mb-10">
        This is the WanderingParker starter template. Each project lives in its
        own folder under{' '}
        <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-sm">
          projects/
        </code>{' '}
        and is automatically discovered at build time — no config changes
        required.
      </p>

      {/* Getting started steps */}
      <div className="border border-border rounded-xl overflow-hidden mb-10">
        <div className="px-5 py-3 border-b border-border bg-surface/80">
          <span className="text-sm font-semibold text-text-primary">
            Getting Started
          </span>
        </div>
        <div className="divide-y divide-border">
          {STEPS.map((step) => (
            <div key={step.number} className="flex gap-4 px-5 py-4">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold">
                {step.number}
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {step.title}
                </p>
                <p className="text-sm text-text-muted mt-0.5">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack pills */}
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">
          Built with
        </p>
        <div className="flex flex-wrap gap-2">
          {TECH_PILLS.map((pill) => (
            <span
              key={pill}
              className="px-3 py-1 rounded-full border border-border bg-surface text-text-muted text-sm"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

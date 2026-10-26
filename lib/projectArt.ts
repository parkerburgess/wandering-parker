import { ComponentType } from 'react'
import SharpenerArt from '@/app/_components/project-art/SharpenerArt'
import NoFileNoMileArt from '@/app/_components/project-art/NoFileNoMileArt'
import FlyFishingArt from '@/app/_components/project-art/FlyFishingArt'
import GoodBadCalendarArt from '@/app/_components/project-art/GoodBadCalendarArt'

interface ProjectArtProps {
  className?: string
}

// The "art" value in projects.json picks one of these components.
export const projectArtComponents = {
  'sharpener': SharpenerArt,
  'no-file-no-mile': NoFileNoMileArt,
  'fly-fishing': FlyFishingArt,
  'good-bad-calendar': GoodBadCalendarArt,
} satisfies Record<string, ComponentType<ProjectArtProps>>

export type ProjectArtKey = keyof typeof projectArtComponents

// projects.json is typed as plain strings, so keys are checked at runtime.
export function isProjectArtKey(value: string): value is ProjectArtKey {
  return Object.hasOwn(projectArtComponents, value)
}

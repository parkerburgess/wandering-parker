import Link from 'next/link'
import { Badge } from '@parkerburgess/wandering-parker-ui'
import { getResume, Resume } from '@/lib/getResume'

// The Architecture and Leadership lists are long phrases that read poorly as
// chips in a skinny column; the full resume page still shows them.
const chipSkillCategories = [
  'Languages',
  'Frameworks & Platforms',
  'Databases',
  'Cloud & Tools',
]

interface WorkTitle {
  title: string
  company: string
  dates: string
}

// resume.json stores each category's skills as one comma-separated string.
function getChipSkills(resume: Resume): string[] {
  return resume.skills
    .filter((skillGroup) => chipSkillCategories.includes(skillGroup.category))
    .flatMap((skillGroup) => skillGroup.items.split(','))
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 0)
}

// Entries without a role title (the travel sabbatical) aren't work titles.
// A single-role company leaves the role's dates off, so fall back to the
// company's.
function getWorkTitles(resume: Resume): WorkTitle[] {
  return resume.experience.flatMap((entry) =>
    entry.roles
      .filter((role) => role.title !== undefined)
      .map((role) => ({
        title: role.title ?? '',
        company: entry.company,
        dates: role.dates ?? entry.dates,
      })),
  )
}

export default function ProfilePanel() {
  const resume = getResume()
  const chipSkills = getChipSkills(resume)
  const workTitles = getWorkTitles(resume)

  // #region Tailwind utility consts
  // Sticky only beside the projects; top clears the header and nav bar.
  const panelCls =
    'grid gap-6 rounded-xl border border-neutral-400 bg-card p-6 ' +
    'lg:sticky lg:top-36'
  const identityCls = 'grid gap-1'
  const nameCls = 'text-lg font-semibold text-neutral-800'
  const contactTextCls = 'text-sm text-neutral-500'
  const emailLinkCls =
    'text-sm text-primary-600 hover:underline cursor-pointer break-all'
  const sectionCls = 'grid gap-3'
  // -mx-6 cancels the panel's p-6 so the band runs edge to edge; px-6 puts
  // the text back in line with the rest of the panel.
  const sectionHeadingCls =
    '-mx-6 px-6 py-2 bg-neutral-100 ' +
    'text-xs font-semibold uppercase tracking-wider text-neutral-600'
  const chipListCls = 'flex flex-wrap gap-2'
  const workListCls = 'grid gap-3'
  const workItemCls = 'grid gap-0.5'
  const workTitleCls = 'text-sm font-medium text-neutral-800'
  const workMetaCls = 'text-xs text-neutral-500'
  const resumeLinkCls =
    'text-sm font-medium text-primary-600 hover:underline cursor-pointer'
  // #endregion

  return (
    <aside className={panelCls}>
      <div className={identityCls}>
        <h2 className={nameCls}>{resume.name}</h2>
        <a href={`mailto:${resume.email}`} className={emailLinkCls}>
          {resume.email}
        </a>
        <p className={contactTextCls}>{resume.location}</p>
      </div>

      <section className={sectionCls}>
        <h3 className={sectionHeadingCls}>Skills</h3>
        <ul className={chipListCls}>
          {chipSkills.map((skill) => (
            <li key={skill}>
              <Badge color="neutral">{skill}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionCls}>
        <h3 className={sectionHeadingCls}>Experience</h3>
        <ul className={workListCls}>
          {workTitles.map((workTitle) => (
            <li key={workTitle.title} className={workItemCls}>
              <span className={workTitleCls}>{workTitle.title}</span>
              <span className={workMetaCls}>
                {workTitle.company} · {workTitle.dates}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/resume" className={resumeLinkCls}>
        View full resume →
      </Link>
    </aside>
  )
}

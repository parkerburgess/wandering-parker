import type { Metadata } from 'next'
import { ExperienceEntry, getResume } from '@/lib/getResume'

export const metadata: Metadata = {
  title: 'Resume | WanderingParker',
}

// Folder is "Resume" (capital R) in git; production paths are case-sensitive.
const resumePdfPath = '/Resume/Parker_Burgess_Resume.pdf'

function ExperienceItem({ entry }: { entry: ExperienceEntry }) {
  // #region Tailwind utility consts
  const entryCls = 'grid gap-4'
  const titleRowCls = 'grid grid-cols-[1fr_auto] items-baseline gap-4'
  const companyCls = 'font-semibold text-neutral-800'
  const datesCls = 'text-sm text-neutral-500'
  const descriptionCls = 'text-neutral-600'
  const roleCls = 'grid gap-2'
  const roleTitleCls = 'font-medium text-neutral-700'
  const bulletListCls = 'list-disc pl-6 grid gap-1 text-neutral-600'
  // #endregion

  return (
    <div className={entryCls}>
      <div>
        <div className={titleRowCls}>
          <h3 className={companyCls}>{entry.company}</h3>
          <span className={datesCls}>{entry.dates}</span>
        </div>
        {entry.description && <p className={descriptionCls}>{entry.description}</p>}
      </div>
      {entry.roles.map((role, roleIndex) => (
        <div key={role.title ?? roleIndex} className={roleCls}>
          {role.title && (
            <div className={titleRowCls}>
              <h4 className={roleTitleCls}>{role.title}</h4>
              {role.dates && <span className={datesCls}>{role.dates}</span>}
            </div>
          )}
          <ul className={bulletListCls}>
            {role.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function ResumePage() {
  const resume = getResume()

  // #region Tailwind utility consts
  const pageCls = 'grid gap-12 max-w-3xl'
  const headerCls = 'grid grid-cols-[1fr_auto] items-start gap-4'
  const nameCls = 'text-3xl font-bold text-neutral-800 mb-2'
  const contactCls = 'text-neutral-500'
  const emailLinkCls = 'text-primary-600 hover:underline cursor-pointer'
  const profileLinkCls = 'text-primary-600 hover:underline cursor-pointer'
  const downloadLinkCls ='text-primary-600 hover:underline cursor-pointer'
  const sectionCls = 'grid gap-4'
  const sectionHeadingCls =
    'text-sm font-semibold uppercase tracking-wider text-neutral-500 ' +
    'pb-2 border-b border-neutral-400'
  const paragraphCls = 'text-neutral-600'
  const skillListCls = 'grid gap-2'
  const skillRowCls = 'grid grid-cols-1 sm:grid-cols-[14rem_1fr] gap-1 sm:gap-4'
  const skillCategoryCls = 'font-medium text-neutral-700'
  const skillItemsCls = 'text-neutral-600'
  const experienceListCls = 'grid gap-8'
  const educationRowCls = 'grid grid-cols-[1fr_auto] items-baseline gap-4'
  const degreeCls = 'font-semibold text-neutral-800'
  const schoolCls = 'text-neutral-600'
  const educationDateCls = 'text-sm text-neutral-500'
  // #endregion

  return (
    <div className={pageCls}>
      <header className={headerCls}>
        <div>
          <h1 className={nameCls}>{resume.name}</h1>
          <p className={contactCls}>
            <a href={`mailto:${resume.email}`} className={emailLinkCls}>
              {resume.email}
            </a>
            {'  |  '}
            {resume.location}
            {resume.links.map((profileLink) => (
              <span key={profileLink.url}>
                {'  |  '}
                <a
                  href={profileLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={profileLinkCls}
                >
                  {profileLink.label}
                </a>
              </span>
            ))}
          </p>
        </div>
        <a href={resumePdfPath} download className={downloadLinkCls}>
          Download PDF
        </a>
      </header>

      <section className={sectionCls}>
        <h2 className={sectionHeadingCls}>Professional Summary</h2>
        {resume.summary.map((paragraph) => (
          <p key={paragraph} className={paragraphCls}>{paragraph}</p>
        ))}
      </section>

      <section className={sectionCls}>
        <h2 className={sectionHeadingCls}>Skills</h2>
        <dl className={skillListCls}>
          {resume.skills.map((skillGroup) => (
            <div key={skillGroup.category} className={skillRowCls}>
              <dt className={skillCategoryCls}>{skillGroup.category}</dt>
              <dd className={skillItemsCls}>{skillGroup.items}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={sectionCls}>
        <h2 className={sectionHeadingCls}>Experience</h2>
        <div className={experienceListCls}>
          {resume.experience.map((entry) => (
            <ExperienceItem key={entry.company} entry={entry} />
          ))}
        </div>
      </section>

      <section className={sectionCls}>
        <h2 className={sectionHeadingCls}>Education</h2>
        {resume.education.map((educationEntry) => (
          <div key={educationEntry.degree}>
            <div className={educationRowCls}>
              <h3 className={degreeCls}>{educationEntry.degree}</h3>
              <span className={educationDateCls}>{educationEntry.date}</span>
            </div>
            <p className={schoolCls}>{educationEntry.school}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

interface TwoToneArtProps {
  title: string
  viewBox: string
  primaryPath: string
  neutralPath: string
  className?: string
}

// Shared frame for the traced project artwork. Shapes are filled with the raw
// --primary / --neutral base colors (not the numeric scale, whose -600/-700
// stops shift in dark mode), so retheming only needs those two variables.
// The background is transparent; the container behind it supplies the color.
export default function TwoToneArt({
  title,
  viewBox,
  primaryPath,
  neutralPath,
  className,
}: TwoToneArtProps) {
  // #region Tailwind utility consts
  const primaryShapeCls = 'fill-[var(--primary)]'
  const neutralShapeCls = 'fill-[var(--neutral)]'
  // #endregion

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      role="img"
      className={className}
    >
      <title>{title}</title>
      <path
        fillRule="evenodd"
        className={primaryShapeCls}
        d={primaryPath}
      />
      <path
        fillRule="evenodd"
        className={neutralShapeCls}
        d={neutralPath}
      />
    </svg>
  )
}

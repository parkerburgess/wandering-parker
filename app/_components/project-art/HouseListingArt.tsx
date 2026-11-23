interface HouseListingArtProps {
  className?: string
}

// Hand-drawn, unlike the traced art: one stroked path for the outline of a
// house (walls, then a peaked roof with short eaves). Like TwoToneArt it
// uses the raw --primary base color, so it follows the theme.
const VIEW_BOX = '0 0 200 200'

const HOUSE_OUTLINE_PATH = 'M 52 168 V 98 H 34 L 100 38 L 166 98 H 148 V 168 Z'

export default function HouseListingArt({ className }: HouseListingArtProps) {
  // #region Tailwind utility consts
  const outlineCls = 'fill-none stroke-[var(--primary)]'
  // #endregion

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={VIEW_BOX}
      role="img"
      className={className}
    >
      <title>House Listings</title>
      <path
        className={outlineCls}
        d={HOUSE_OUTLINE_PATH}
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

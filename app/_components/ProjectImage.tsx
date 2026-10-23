'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProjectImageProps {
  src: string
  alt: string
}

// Matches the home grid: 1 column, 2 from sm, 3 from lg inside max-w-6xl.
const GRID_IMAGE_SIZES = '(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw'

export default function ProjectImage({ src, alt }: ProjectImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false)

  // #region Tailwind utility consts
  const wrapperCls = 'relative w-full h-full'
  const imgCls = 'object-cover group-hover:scale-105 transition-transform duration-300'
  const fallbackCls = 'w-full h-full grid place-items-center'
  const fallbackTextCls = 'text-neutral-500 text-sm'
  // #endregion

  function handleImageError() {
    setHasLoadError(true)
  }

  if (hasLoadError) {
    return (
      <div className={fallbackCls}>
        <span className={fallbackTextCls}>No image</span>
      </div>
    )
  }

  return (
    <div className={wrapperCls}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={GRID_IMAGE_SIZES}
        className={imgCls}
        onError={handleImageError}
      />
    </div>
  )
}

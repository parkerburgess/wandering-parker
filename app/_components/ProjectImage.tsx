'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProjectImageProps {
  src: string
  alt: string
}

// Thumbnail is 2/5 of the card. Home grid: 1 column, 2 from lg inside max-w-6xl.
const GRID_IMAGE_SIZES = '(min-width: 1024px) 220px, 40vw'

export default function ProjectImage({ src, alt }: ProjectImageProps) {
  const [hasLoadError, setHasLoadError] = useState(false)

  // #region Tailwind utility consts
  const wrapperCls = 'relative w-full h-full'
  const imgCls = 'object-contain group-hover:scale-105 transition-transform duration-300'
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

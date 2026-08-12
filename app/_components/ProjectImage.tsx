'use client'

interface ProjectImageProps {
  src: string
  alt: string
}

export default function ProjectImage({ src, alt }: ProjectImageProps) {
  // #region Tailwind utility consts
  const wrapperCls = 'w-full h-full'
  const imgCls = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
  const fallbackCls = 'w-full h-full hidden items-center justify-center'
  const fallbackTextCls = 'text-neutral-500 text-sm'
  // #endregion

  return (
    <div className={wrapperCls}>
      <img
        src={src}
        alt={alt}
        className={imgCls}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement
          img.style.display = 'none'
          ;(img.nextElementSibling as HTMLElement).style.display = 'flex'
        }}
      />
      <div className={fallbackCls}>
        <span className={fallbackTextCls}>No image</span>
      </div>
    </div>
  )
}

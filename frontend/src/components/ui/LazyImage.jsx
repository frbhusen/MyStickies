import React, { useEffect, useRef, useState } from 'react'

export default function LazyImage({ src, alt = '', className = '', style = {}, placeholder = '', ...props }) {
  const imgRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState('')

  useEffect(() => {
    setLoaded(false)
    setCurrentSrc('')
    if (!src) return

    // If browser supports native lazy loading, use it by setting currentSrc immediately
    const supportsNative = typeof HTMLImageElement !== 'undefined' && 'loading' in HTMLImageElement.prototype
    if (supportsNative) {
      setCurrentSrc(src)
      setVisible(true)
      return
    }

    const el = imgRef.current
    if (!el) return

    let obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      })
    }, { rootMargin: '200px' })

    obs.observe(el)
    return () => obs.disconnect()
  }, [src])

  useEffect(() => {
    if (visible && src) {
      setCurrentSrc(src)
    }
  }, [visible, src])

  return (
    <div className={`lazy-image ${loaded ? 'is-loaded' : 'is-loading'} ${className || ''}`} style={{ ...style }} ref={imgRef}>
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          {...(HTMLImageElement && 'loading' in HTMLImageElement.prototype ? { loading: 'lazy' } : {})}
          {...props}
        />
      ) : (
        placeholder ? <div className="lazy-placeholder" style={{ width: '100%', height: '100%', background: placeholder }} /> : null
      )}
    </div>
  )
}

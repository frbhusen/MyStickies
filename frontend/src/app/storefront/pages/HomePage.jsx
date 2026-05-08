import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchProducts } from '../../../features/catalog/api'
import { t } from '../../../lib/i18n'
import Logo from '../../../assets/logo.png'

function Carousel({ items }) {
  if (!items || items.length === 0) return null
  return (
    <div className="carousel-track">
      {items.map(p => (
        <Link to={`/product/${p.slug}`} key={p.id} className="product-tile">
          <div className="product-tile__media">
            <img src={p.images?.[0]?.public_url || Logo} alt={p.name} />
          </div>
          <div className="product-tile__body">
            <div className="product-tile__title">{p.name}</div>
            <div className="product-tile__price">{p.effective_base_price} SYP</div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [mostSold, setMostSold] = useState([])
  const floatingEmojis = ['']

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({ most_sold: '1' })
        const { results } = await fetchProducts(params)
        setMostSold(results || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <section className="home-shell">
      <div className="home-floaters" aria-hidden>
        {floatingEmojis.map((emoji, index) => (
          <span key={emoji} className={`floating-emoji floating-emoji--${index + 1}`}>{emoji}</span>
        ))}
      </div>

      <div className="home-hero">
        <div className="hero-copy">
          <h1 className="title hero-title">{t('hero_title')}</h1>
          <p className="muted hero-subtitle">{t('hero_sub')}</p>
          <div className="hero-actions">
            <Link className="btn" to="/shop">{t('cta_shop')}</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-visual__frame">
            <img src={Logo} alt={t('brand')} />
          </div>
        </div>
      </div>

      <section className="section-block">
        <h2 className="section-heading">{t('why_us')}</h2>
        <div className="feature-grid">
          <article className="feature-card feature-card--1">
            <div className="feature-emoji">🚀</div>
            <h3>{t('feature_fast')}</h3>
            <p className="muted">توصيل سريع للملصقات والمنتجات</p>
          </article>
          <article className="feature-card feature-card--2">
            <div className="feature-emoji">🌟</div>
            <h3>{t('feature_quality')}</h3>
            <p className="muted">منتجات بجودة عالية وتصاميم أنيقة</p>
          </article>
          <article className="feature-card feature-card--3">
            <div className="feature-emoji">🎁</div>
            <h3>{t('feature_variety')}</h3>
            <p className="muted">تنوع واسع من الملصقات والتصاميم</p>
          </article>
          <article className="feature-card feature-card--4">
            <div className="feature-emoji">💬</div>
            <h3>{t('feature_support')}</h3>
            <p className="muted">دعم عملاء متجاوب للمساعدة</p>
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="promo-banner">
          <h3>💙 {t('cta_banner')}</h3>
          <Link className="btn" to="/shop">{t('browse_products')}</Link>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading-row">
          <h2 className="section-heading">✨ {t('most_sold')}</h2>
        </div>
        <Carousel items={mostSold} />
      </section>
    </section>
  )
}

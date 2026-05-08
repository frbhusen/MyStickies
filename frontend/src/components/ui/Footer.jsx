import { t } from '../../lib/i18n'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-inner">
        {/* <div className="muted">{t('footer_copyright')}</div> */}
        <div className="footer-links">
          {/* <a className="footer-pill" href="/privacy">{t('footer_privacy')}</a> */}
          {/* <a className="footer-pill" href="/terms">{t('footer_terms')}</a> */}
        </div>
      </div>
    </footer>
  )
}

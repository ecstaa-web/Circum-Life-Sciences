<?php if ( circum_show_bottom_sections() ) : ?>
<section class="newsletter-strip">
<div class="newsletter-strip-inner">
<div>
<h3 class="newsletter-strip-title" data-i18n-html="strip.title"><strong>Newsletter trimestrielle.</strong> Restez informé.</h3>
<p class="newsletter-strip-text" data-i18n="strip.text">Recevez chaque trimestre nos actualités, innovations et publications. Désinscription en un clic.</p>
</div>
<form class="newsletter-strip-form" data-form="newsletter" data-implicit-consent="true" novalidate="">
<input aria-label="Adresse email" data-i18n-placeholder="strip.placeholder" placeholder="votre@email.com" required="" type="email" name="email"/>
<button data-i18n="strip.submit" type="submit">S'inscrire →</button>
</form>
</div>
</section>
<section class="cta-final">
<div class="cta-final-inner">
<div>
<div class="cta-final-eyebrow" data-i18n="cta.eyebrow">Démarrer un projet</div>
<h2 class="cta-final-title" data-i18n-html="cta.title">Un dispositif. Une vision.<br/><em>Un partenaire.</em></h2>
<p class="cta-final-text" data-i18n="cta.text">Échangeons sur votre projet : conception, fabrication, conformité. Notre équipe vous répond sous 24 heures ouvrées.</p>
<div class="cta-final-actions">
<a class="btn btn-pink" href="<?php echo esc_url( circum_url('contact') ); ?>"><span data-i18n="cta.btn.contact">Contactez-nous</span><span class="btn-arrow">→</span></a>
<a class="btn btn-outline-white" href="<?php echo esc_url( circum_url('apropos') ); ?>"><span data-i18n="cta.btn.about">À propos de nous</span></a>
</div>
</div>
</div>
</section>
<?php endif; ?>
<footer class="footer">
<div class="footer-inner">
<div class="footer-grid">
<div class="footer-brand">
<div class="footer-logo">
<img alt="Circum Life Sciences Logo" class="footer-logo-img" data-i18n-alt="logo.alt" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/circum-logo.png') ); ?>"/>
</div>
<p class="footer-desc" data-i18n="footer.desc">Entreprise CDMO intégrée verticalement dans les domaines des dispositifs médicaux et des sciences de la vie. Implantation Suisse · France · Tunisie.</p>
</div>
<div>
<div class="footer-col-title" data-i18n="footer.col.company">Société</div>
<div class="footer-list">
<a data-i18n="footer.link.about" href="<?php echo esc_url( circum_url('apropos') ); ?>">À propos</a>
<a data-i18n="footer.link.founders" href="<?php echo esc_url( circum_url('apropos', '#founders') ); ?>">Fondateurs</a>
<a data-i18n="nav.sub.values" href="<?php echo esc_url( circum_url('apropos', '#valeurs') ); ?>">Nos valeurs</a>
<a data-i18n="footer.link.environment" href="<?php echo esc_url( circum_url('apropos', '#environnement') ); ?>">Environnement</a>
<a data-i18n="footer.link.careers" href="<?php echo esc_url( circum_url('carrieres') ); ?>">Carrières</a>
</div>
</div>
<div>
<div class="footer-col-title" data-i18n="footer.col.services">Services</div>
<div class="footer-list">
<a data-i18n="footer.link.design" href="<?php echo esc_url( circum_url('design') ); ?>">Design &amp; Développement</a>
<a data-i18n="footer.link.manufacturing" href="<?php echo esc_url( circum_url('fabrication') ); ?>">Fabrication</a>
<a data-i18n="nav.sub.forceone" href="<?php echo esc_url( circum_url('fabrication', '#force-one') ); ?>">Force One</a>
<a data-i18n="footer.link.clients" href="<?php echo esc_url( circum_url('clients') ); ?>">Nos clients</a>
<a data-i18n="footer.link.news" href="<?php echo esc_url( circum_url('news') ); ?>">News &amp; Media</a>
</div>
</div>
<div>
<div class="footer-col-title" data-i18n="footer.col.contact">Contact</div>
<div class="footer-contact-item"><strong data-i18n="footer.hq">Siège · Suisse</strong><span data-i18n="footer.zurich">Zug, Suisse</span></div>
<div class="footer-contact-item"><strong data-i18n="footer.email">Email</strong><a href="mailto:contact@circumlifesciences.com" style="color: rgba(255,255,255,0.85);">contact@circumlifesciences.com</a></div>
<div class="footer-contact-item"><strong data-i18n="footer.newsletter">Newsletter</strong><a data-i18n="footer.subscribe" href="<?php echo esc_url( circum_url('newsletter') ); ?>" style="color: var(--pink-light);">S'inscrire →</a></div>
</div>
</div>
<div class="footer-bottom">
<small data-i18n="footer.copy">© 2026 Circum Life Sciences. Tous droits réservés.</small>
<div class="footer-legal"><a href="<?php echo esc_url( circum_url('legal-notice') ); ?>">Mentions légales</a><a href="<?php echo esc_url( circum_url('privacy-policy') ); ?>">Confidentialité</a><a href="<?php echo esc_url( circum_url('cookies') ); ?>">Cookies</a></div>
</div>
</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>

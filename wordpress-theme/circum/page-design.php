<?php
/**
 * Template Name: Design & DÃ©veloppement
 * Page template: design
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/design-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="design.page_hero_eyebrow.1">Design &amp; Développement · Conception intégrée</div>
<h1 class="hero-title reveal" data-i18n-html="design.page_hero_title.2">Concevoir, développer<br/>et valider <em>les dispositifs médicaux</em><br/><strong>avec précision.</strong></h1>
<p class="hero-subtitle reveal" data-i18n="design.page_hero_subtitle.3">Conception, qualité, laboratoire et validation réunis dans un même parcours pour transformer une idée en dispositif médical maîtrisé, documenté et conforme.</p>
<div class="hero-actions reveal">
<a class="btn btn-pink" href="#conception"><span data-i18n="design.hero_btn.1">Explorer le parcours</span><span class="btn-arrow">→</span></a>
<a class="btn btn-outline-white" href="<?php echo esc_url( circum_url('contact') ); ?>"><span data-i18n="design.hero_btn.2">Nous contacter</span></a>
</div>
<div class="hero-meta reveal"><span data-i18n="design.hero_meta.4">Conception · QARA · Laboratoire</span><span data-i18n="design.hero_meta.5">Validation · conformité · transfert industriel</span></div>
</div>
</section>
<section class="section design-signature" id="conception">
<div class="container design-signature-grid">
<div class="design-signature-copy reveal">
<span class="section-label" data-i18n="design.signature_label.40">Un seul parcours coordonné</span>
<h2 class="section-title" data-i18n-html="design.signature_title.41">De l'idée au transfert industriel, <em>tout reste lisible.</em></h2>
<p class="design-signature-lead" data-i18n="design.signature_lead.42">Nous relions conception, qualité, laboratoire et validation dans une seule gouvernance. Moins de silos, moins de friction, plus de décisions utiles à chaque jalon.</p>
<div class="design-signal-row">
<span class="design-signal-pill" data-i18n="design.signal.43">Architecture produit</span>
<span class="design-signal-pill" data-i18n="design.signal.44">Conformité documentée</span>
<span class="design-signal-pill" data-i18n="design.signal.45">Préparation au transfert</span>
</div>
</div>
<aside class="design-signature-panel reveal" data-i18n-aria="design.panel_aria.46" aria-label="Points clés du programme design Circum">
<h3 data-i18n="design.panel_title.47">Ce que votre équipe gagne</h3>
<ul>
<li>
<strong data-i18n="design.panel_item_title.48">Un interlocuteur de programme</strong>
<span data-i18n="design.panel_item_text.49">Le cadrage technique, qualité et planning avance dans le même tempo.</span>
</li>
<li>
<strong data-i18n="design.panel_item_title.50">Des preuves exploitables</strong>
<span data-i18n="design.panel_item_text.51">Chaque essai, arbitrage et révision alimente un dossier directement réutilisable.</span>
</li>
<li>
<strong data-i18n="design.panel_item_title.52">Une lecture claire des risques</strong>
<span data-i18n="design.panel_item_text.53">Les points critiques sont visibles tôt, avant qu'ils ne coûtent du temps ou du budget.</span>
</li>
</ul>
</aside>
</div>
</section>
<section class="section design-stages">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="design.stage_label.54">Architecture programme</span>
<h2 class="section-title" data-i18n-html="design.stage_title.55">Quatre expertises, <em>une seule cadence.</em></h2>
</div>
<div class="design-stage-grid reveal">
<article class="design-stage-card vv-hover-card" tabindex="0">
<div class="design-stage-index">01</div>
<div class="design-stage-kicker" data-i18n="design.card_kicker.56">Conception</div>
<h3 data-i18n="design.card_title.57">Designer juste dès le premier cycle</h3>
<p data-i18n="design.card_text.58">Ergonomie, architecture produit et faisabilité clinique sont travaillées ensemble pour poser des bases robustes sans surcomplexifier le dispositif.</p>
<div class="vv-hover-panel" aria-live="polite" data-lenis-prevent>
<h4 class="vv-hover-title" data-i18n="design.conception_hover_title.72">Conception détaillée</h4>
<div class="vv-hover-body" data-i18n-html="design.conception_hover_content.73">
<p>Vision globale du parcours de conception.</p>
</div>
</div>
</article>
<article class="design-stage-card vv-hover-card" id="qara" tabindex="0">
<div class="design-stage-index">02</div>
<div class="design-stage-kicker" data-i18n="design.card_kicker.59">QARA</div>
<h3 data-i18n="design.card_title.60">Faire avancer le dossier en même temps que le produit</h3>
<p data-i18n="design.card_text.61">Le dossier technique, les exigences MDR/IVDR et la gestion des risques progressent sans attendre la fin du développement.</p>
<div class="vv-hover-panel" aria-live="polite" data-lenis-prevent>
<h4 class="vv-hover-title" data-i18n="design.qara_hover_title.74">QARA détaillé</h4>
<div class="vv-hover-body" data-i18n-html="design.qara_hover_content.75">
<p>Accompagnement qualité et affaires réglementaires.</p>
</div>
</div>
</article>
<article class="design-stage-card vv-hover-card" id="laboratoire" tabindex="0">
<div class="design-stage-index">03</div>
<div class="design-stage-kicker" data-i18n="design.card_kicker.62">Laboratoire</div>
<h3 data-i18n="design.card_title.63">Tester vite, comprendre vite</h3>
<p data-i18n="design.card_text.64">Biocompatibilité, vieillissement, essais mécaniques et stérilité viennent éclairer les choix au bon moment.</p>
<div class="vv-hover-panel" aria-live="polite" data-lenis-prevent>
<h4 class="vv-hover-title" data-i18n="design.lab_hover_title.76">Laboratoire détaillé</h4>
<div class="vv-hover-media">
<img src="<?php echo esc_url( circum_asset('assets/img/design-lab-hover.jpg') ); ?>" alt="Laboratoire Circum" data-i18n-alt="design.lab_hover_img_alt.78" width="644" height="240" loading="eager" decoding="async"/>
</div>
<div class="vv-hover-body" data-i18n-html="design.lab_hover_content.77">
<p>Services de laboratoire pour les dispositifs médicaux.</p>
</div>
</div>
</article>
<article class="design-stage-card vv-hover-card" id="vv" tabindex="0">
<div class="design-stage-index">04</div>
<div class="design-stage-kicker" data-i18n="design.card_kicker.65">V&amp;V</div>
<h3 data-i18n="design.card_title.66">Valider avant de transférer</h3>
<p data-i18n="design.card_text.67">La vérification, la validation d'usage et la qualification des process sécurisent le passage vers la fabrication série.</p>
<div class="vv-hover-panel" aria-live="polite" data-lenis-prevent>
<h4 class="vv-hover-title" data-i18n="design.vv_hover_title.70">Capacités V&amp;V détaillées</h4>
<div class="vv-hover-body" data-i18n-html="design.vv_hover_content.71">
<p>Nos activités V&amp;V couvrent vérification de conception, validation des procédés, validation de conception et support réglementaire pour les dispositifs médicaux à usage unique.</p>
</div>
</div>
</article>
</div>
<blockquote class="design-proof-banner reveal">
<p data-i18n="design.quote_text.68">Nous ne livrons pas seulement un concept prometteur. Nous livrons un dispositif documenté, défendable en audit et prêt à changer d'échelle.</p>
<cite data-i18n="design.quote_cite.69">Pôle QARA &amp; Laboratoire, Nice</cite>
</blockquote>
</div>
</section>
</main>
<?php get_footer();

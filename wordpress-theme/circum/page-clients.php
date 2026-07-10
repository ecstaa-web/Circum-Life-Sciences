<?php
/**
 * Template Name: Clients
 * Page template: clients
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/clients-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow" data-i18n="clients.page_hero_eyebrow.1">Confiance &amp; Partenariats</div>
<h1 class="hero-title" data-i18n-html="clients.page_hero_title.2">Aux côtés de ceux qui <em>innovent.</em></h1>
<p class="hero-subtitle" data-i18n="clients.page_hero_subtitle.3">De la startup deeptech aux grandes multinationales des dispositifs médicaux, Circum accompagne ses partenaires dans la durée. Confidentialité, exigence, partenariat.</p>
<div class="hero-actions reveal">
<a class="btn btn-pink" href="#clients-signature"><span data-i18n="clients.hero_btn.1">Découvrir nos partenariats</span><span class="btn-arrow">→</span></a>
<a class="btn btn-outline-white" href="<?php echo esc_url( circum_url('contact') ); ?>"><span data-i18n="clients.hero_btn.2">Nous contacter</span></a>
</div>
</div>
</section>
<section class="section clients-signature" id="clients-signature">
<div class="container clients-signature-grid">
<div class="clients-signature-copy reveal">
<span class="section-label" data-i18n="clients.signature_label.32">Pourquoi nous choisir</span>
<h2 class="section-title" data-i18n-html="clients.signature_title.33">Pourquoi <em>nous choisir.</em></h2>
<p class="clients-signature-lead" data-i18n="clients.signature_lead.34">Nous sommes agiles, flexibles, et totalement engagés à établir un vrai partenariat.</p>
<div class="clients-audience-row">
<span class="clients-pill" data-i18n="clients.audience.35">Start-ups</span>
<span class="clients-pill" data-i18n="clients.audience.36">Industriels chevronnés</span>
<span class="clients-pill" data-i18n="clients.audience.37">Double approvisionnement &amp; relocalisation</span>
</div>
</div>
<div class="clients-signature-aside reveal">
<div class="clients-signature-visual">
<img alt="Présence internationale Circum, drapeaux suisse, français et européen" data-i18n-alt="clients.flags_photo_alt.1" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/circum-flags-international.jpg') ); ?>"/>
</div>
<aside class="clients-signature-panel" aria-label="Points clés du partenariat client Circum" data-i18n-aria="clients.panel_aria.38">
<h3 data-i18n="clients.panel_title.39">Start-ups</h3>
<ul>
<li>
<strong data-i18n="clients.panel_item_title.40">Du concept au produit manufacturé</strong>
<span data-i18n="clients.panel_item_text.41">Nous collaborons avec vous depuis votre concept initial jusqu'à la livraison d'un produit manufacturé. Nous facilitons le processus pour obtenir le parcours le plus simple et le plus rapide vers les autorisations réglementaires.</span>
</li>
<li>
<strong data-i18n="clients.panel_item_title.42">POC efficace &amp; pragmatique</strong>
<span data-i18n="clients.panel_item_text.43">Nous vous aidons à développer un POC avec la plus grande efficacité et le plus de pragmatisme possibles. Grâce à notre expérience de fabricant, nous vous accompagnons pour optimiser votre design initial.</span>
</li>
<li>
<strong data-i18n="clients.panel_item_title.44">Industriels chevronnés</strong>
<span data-i18n="clients.panel_item_text.45">Double approvisionnement, relocalisation près de l'Europe ou lancement d'un nouveau produit : nous concevons un plan ensemble et vous offrons le même type de support.</span>
</li>
</ul>
</aside>
</div>
</div>
</section>
<section class="section clients-flow">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="clients.flow_label.46">Nos clients</span>
<h2 class="section-title" data-i18n-html="clients.flow_title.47">Start-ups &amp; <em>industriels.</em></h2>
</div>
<div class="clients-flow-track reveal">
<article class="clients-flow-step">
<div class="clients-flow-index">01</div>
<h3 data-i18n="clients.flow_step_title.48">Start-ups</h3>
<p data-i18n="clients.flow_step_text.49">Du concept initial à la livraison d'un produit manufacturé, autorisations réglementaires simplifiées et POC pragmatique.</p>
</article>
<article class="clients-flow-step">
<div class="clients-flow-index">02</div>
<h3 data-i18n="clients.flow_step_title.50">Double approvisionnement</h3>
<p data-i18n="clients.flow_step_text.51">Si vous êtes à la recherche d'un double approvisionnement, nous pouvons concevoir un plan ensemble.</p>
</article>
<article class="clients-flow-step">
<div class="clients-flow-index">03</div>
<h3 data-i18n="clients.flow_step_title.52">Relocalisation Europe</h3>
<p data-i18n="clients.flow_step_text.53">Si vous cherchez à relocaliser votre production près de l'Europe, nous sommes prêts à vous aider à mettre ce projet en place.</p>
</article>
</div>
<blockquote class="clients-quote reveal">
<p data-i18n="clients.quote_text.54">Nous sommes agiles, flexibles, et totalement engagés à établir un vrai partenariat.</p>
<cite data-i18n="clients.quote_cite.55">Anne Reiser, Présidente</cite>
</blockquote>
</div>
</section>
</main>
<?php get_footer();

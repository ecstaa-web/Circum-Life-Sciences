<?php
/**
 * Template Name: Accueil
 * Page template: home
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="home.hero_eyebrow.1">Laboratoire CDMO indépendant · Dispositifs médicaux</div>
<h1 class="hero-title reveal" data-i18n-html="home.hero_title.2">Concevoir, développer<br/>et fabriquer <em>les dispositifs médicaux</em><br/><strong>de demain.</strong></h1>
<p class="hero-subtitle reveal" data-i18n="home.hero_subtitle.3">Circum Life Sciences est une entreprise CDMO intégrée verticalement, opérant dans les domaines des dispositifs médicaux et des sciences de la vie. Une couverture complète, de la conception à la fabrication.</p>
<div class="hero-actions reveal">
<a class="btn btn-pink" href="<?php echo esc_url( circum_url('apropos') ); ?>"><span data-i18n="home.btn.1">Découvrir Circum</span><span class="btn-arrow">→</span></a>
<a class="btn btn-outline-white" href="<?php echo esc_url( circum_url('contact') ); ?>"><span data-i18n="home.btn.2">Nous contacter</span></a>
</div>
<div class="hero-meta reveal"><span data-i18n="home.hero_meta.4">Suisse · France · Tunisie</span><span data-i18n="home.hero_meta.5">3 sites · 1 équipe · Couverture CDMO complète</span></div>
</div>
</section>
<section class="mission">
<div class="mission-inner">
<div class="reveal">
<span class="section-label center" data-i18n="home.section_label.8">Notre mission</span>
<h2 class="mission-title" data-i18n-html="home.mission_title.5">Soutenir notre industrie avec <strong>des solutions innovantes</strong> et <em>fiables.</em></h2>
<p class="mission-text" data-i18n="home.mission_text.6">Notre raison d'être : améliorer les traitements de santé pour le compte de nos partenaires. Nous proposons une large gamme de technologies médicales et adaptons notre offre à vos besoins.</p>
<p class="mission-text" data-i18n="home.mission_text.7">Notre approche globale nous permet d'offrir à nos clients des produits innovants et fiables, d'accélérer leur mise sur le marché et de garantir leur succès. Notre flexibilité nous permet de collaborer avec des entreprises de toutes tailles · des startups aux plus grandes entreprises mondiales de dispositifs médicaux.</p>
</div>
</div>
</section>
<section class="pillars">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="home.section_label.9">Notre expertise</span>
<h2 class="section-title" data-i18n-html="home.section_title.12">Trois piliers, <em>une seule chaîne de valeur.</em></h2>
<p class="section-lead" data-i18n="home.section_lead.14" style="margin: 0 auto;">De la première esquisse jusqu'aux volumes de série, Circum couvre l'intégralité du cycle de vie d'un dispositif médical avec une intégration verticale réelle.</p>
</div>
<div class="pillars-grid">
<article class="pillar reveal">
<div class="pillar-num">01</div>
<svg class="pillar-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewbox="0 0 64 64"><circle cx="32" cy="32" r="22"></circle><circle cx="32" cy="32" r="12"></circle><circle cx="32" cy="32" fill="currentColor" r="4"></circle><path d="M32 4v8M32 52v8M4 32h8M52 32h8"></path></svg>
<h3 class="pillar-title" data-i18n="home.pillar_title.15">Design &amp; Développement</h3>
<p class="pillar-text" data-i18n="home.pillar_text.18">Conception industrielle, qualité réglementaire et validation : un parcours coordonné pour transformer l'idée en dispositif maîtrisé.</p>
<div class="pillar-list">
<div class="pillar-list-item" data-i18n="home.pillar_list_item.21">Conception industrielle</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.22">Qualité &amp; Affaires réglementaires</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.23">Laboratoire &amp; V&amp;V</div>
</div>
<a class="pillar-link" data-i18n="home.pillar_link.30" href="<?php echo esc_url( circum_url('design') ); ?>">Explorer →</a>
</article>
<article class="pillar reveal">
<div class="pillar-num">02</div>
<svg class="pillar-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewbox="0 0 64 64"><rect height="32" rx="2" width="48" x="8" y="18"></rect><rect height="20" opacity="0.4" rx="1" width="36" x="14" y="24"></rect><circle cx="32" cy="34" fill="currentColor" r="3"></circle><path d="M8 18V10M56 18V10M16 50v6M48 50v6"></path></svg>
<h3 class="pillar-title" data-i18n="home.pillar_title.16">Fabrication intégrée</h3>
<p class="pillar-text" data-i18n="home.pillar_text.19">Force One : 4 000 m² de production, salle propre ISO 7 de 700 m². Moulage, assemblage et stérilisation maîtrisés en interne.</p>
<div class="pillar-list">
<div class="pillar-list-item" data-i18n="home.pillar_list_item.24">Force One · site principal</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.25">Moulage par injection</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.26">Assemblage &amp; Stérilisation</div>
</div>
<a class="pillar-link" data-i18n="home.pillar_link.31" href="<?php echo esc_url( circum_url('fabrication') ); ?>">Explorer →</a>
</article>
<article class="pillar reveal">
<div class="pillar-num">03</div>
<svg class="pillar-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewbox="0 0 64 64"><path d="M32 8l22 11v17c0 14-9 26-22 30-13-4-22-16-22-30V19z"></path><path d="M22 32l8 8 16-16" stroke-width="2.5"></path></svg>
<h3 class="pillar-title" data-i18n="home.pillar_title.17">Conformité &amp; Qualité</h3>
<p class="pillar-text" data-i18n="home.pillar_text.20">ISO 13485, MDR EU 2017/745, FDA 21 CFR 820 : la conformité n'est pas une contrainte, c'est notre infrastructure de base.</p>
<div class="pillar-list">
<div class="pillar-list-item" data-i18n="home.pillar_list_item.27">Système qualité ISO 13485</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.28">Marquage CE · MDR EU</div>
<div class="pillar-list-item" data-i18n="home.pillar_list_item.29">Approche FDA · États-Unis</div>
</div>
<a class="pillar-link" data-i18n="home.pillar_link.32" href="<?php echo esc_url( circum_url('apropos', '#valeurs') ); ?>">Explorer →</a>
</article>
</div>
</div>
</section>
<section class="figures">
<div class="container">
<div class="figures-grid">
<div class="figure reveal"><div class="figure-value">3</div><div class="figure-label" data-i18n="home.figure_label.33">Sites européens</div></div>
<div class="figure reveal"><div class="figure-value">4 000<sup>m²</sup></div><div class="figure-label" data-i18n="home.figure_label.34">Force One · Tunisie</div></div>
<div class="figure reveal"><div class="figure-value">120<sup>+</sup></div><div class="figure-label" data-i18n="home.figure_label.35">Opérateurs qualifiés</div></div>
<div class="figure reveal"><div class="figure-value">100<sup>%</sup></div><div class="figure-label" data-i18n="home.figure_label.36">Intégration verticale</div></div>
</div>
</div>
</section>
<section class="home-showcase reveal">
<div class="home-showcase-inner">
<img alt="Campus Force One, façade du site de production à Sousse" class="home-showcase-photo" data-i18n-alt="home.showcase_photo_alt.1" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/force-one-facade.jpg') ); ?>"/>
<div class="home-showcase-overlay">
<span class="home-showcase-label" data-i18n="home.showcase_label.1">Force One · Sousse</span>
<p class="home-showcase-text" data-i18n="home.showcase_text.1">4 000 m² de production intégrée · salle propre ISO 7</p>
</div>
</div>
</section>
<section class="world">
<div class="world-inner">
<div class="world-text-block reveal" data-i18n-html="home.world_text.38">
<span class="section-label" data-i18n="home.section_label.10">Implantation</span>
<h2 class="world-title" data-i18n-html="home.world_title.37"><strong>Circum</strong> dans <em>le monde.</em></h2>
<p class="world-text">Notre architecture tripartite combine la rigueur réglementaire suisse, la créativité française et l'efficacité industrielle méditerranéenne. Trois sites, une seule équipe, une seule chaîne de valeur intégrée.</p>
<a class="btn btn-outline-white" href="<?php echo esc_url( circum_url('contact') ); ?>"><span data-i18n="home.btn.3">Nous rencontrer</span><span class="btn-arrow">→</span></a>
</div>
<div class="world-sites reveal">
<div class="world-site" data-map-lat="47.1661" data-map-lng="8.5155" data-map-zoom="12" data-map-label="Zug, Suisse"><div class="world-site-num">01</div><div class="world-site-info"><div class="world-site-city" data-i18n="home.world_site_city.39">Zug · Suisse</div><div class="world-site-role" data-i18n="home.world_site_role.42">Siège · Gouvernance</div></div></div>
<div class="world-site" data-map-lat="43.7102" data-map-lng="7.2620" data-map-zoom="12" data-map-label="Nice, France"><div class="world-site-num">02</div><div class="world-site-info"><div class="world-site-city" data-i18n="home.world_site_city.40">Nice · France</div><div class="world-site-role" data-i18n="home.world_site_role.43">R&amp;D · QARA · Laboratoire</div></div></div>
<div class="world-site" data-map-lat="35.8256" data-map-lng="10.6411" data-map-zoom="12" data-map-label="Sousse, Tunisie"><div class="world-site-num">03</div><div class="world-site-info"><div class="world-site-city" data-i18n="home.world_site_city.41">Sousse · Tunisie</div><div class="world-site-role" data-i18n="home.world_site_role.44">Force One · Production</div></div></div>
</div>
</div>
</section>
<section class="founders">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="home.section_label.11">Les trois fondateurs</span>
<h2 class="section-title" data-i18n-html="home.section_title.13">Trois expertises, <em>une exigence partagée.</em></h2>
</div>
<div class="founders-grid">
<div class="founder reveal">
<div class="founder-portrait" data-tone="blue"><img alt="Anne Reiser" class="founder-image" src="<?php echo esc_url( circum_asset('assets/img/Anne.png') ); ?>"/></div>
<h3 class="founder-name" data-i18n="home.founder_name.45">Anne Reiser</h3>
<div class="founder-role" data-i18n="home.founder_role.48">Présidente</div>
<p class="founder-bio" data-i18n="home.founder_bio.51">« Chez Circum Life Sciences, nous sommes flexibles, agiles, et nous écoutons activement nos clients. »</p>
</div>
<div class="founder reveal">
<div class="founder-portrait" data-tone="pink"><img alt="Mohamed Rekik" class="founder-image" src="<?php echo esc_url( circum_asset('assets/img/Mohamed-1501x1536.png') ); ?>"/></div>
<h3 class="founder-name" data-i18n="home.founder_name.46">Mohamed Rekik</h3>
<div class="founder-role" data-i18n="home.founder_role.49">Directeur général</div>
<p class="founder-bio" data-i18n="home.founder_bio.52">« Notre équipe est totalement dédiée à satisfaire nos clients. Vous venez avec un concept, et vous repartez avec une solution prête à l'emploi. »</p>
</div>
<div class="founder reveal">
<div class="founder-portrait" data-tone="dark"><img alt="Serge Barneaud" class="founder-image" src="<?php echo esc_url( circum_asset('assets/img/Serge-1523x1536.png') ); ?>"/></div>
<h3 class="founder-name" data-i18n="home.founder_name.47">Serge Barneaud</h3>
<div class="founder-role" data-i18n="home.founder_role.50">Directeur technique</div>
<p class="founder-bio" data-i18n="home.founder_bio.53">« Chez Circum Life Sciences, nous nous entraidons. C'est une aventure humaine. »</p>
</div>
</div>
<div class="reveal" style="text-align: center; margin-top: 56px;">
<a class="btn btn-outline" href="<?php echo esc_url( circum_url('apropos', '#founders') ); ?>"><span data-i18n="home.btn.4">Découvrir les fondateurs</span><span class="btn-arrow">→</span></a>
</div>
</div>
</section>
</main>
<?php get_footer();

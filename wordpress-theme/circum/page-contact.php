<?php
/**
 * Template Name: Contact
 * Page template: contact
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/contact-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="contact.page_hero_eyebrow.1">Démarrer une collaboration</div>
<h1 class="hero-title reveal" data-i18n-html="contact.page_hero_title.2">Parlons de votre <em>projet.</em></h1>
<p class="hero-subtitle reveal" data-i18n="contact.page_hero_subtitle.3">Premier contact avec un membre de l'équipe sous 24 heures ouvrées. NDA signé sous 48 heures avant tout échange technique. Devis chiffré sous 7 jours.</p>
</div>
</section>
<section class="section">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="contact.section_label.8">Nos sites</span>
<h2 class="section-title" data-i18n-html="contact.section_title.10">Trois <em>points d'ancrage</em> européens.</h2>
<p class="section-lead contact-sites-lead" data-i18n="contact.sites_lead.1">Survolez un site pour afficher la carte.</p>
</div>
<div class="contact-grid reveal" style="margin-top: 56px;">
<article class="contact-card" data-map-lat="47.1661" data-map-lng="8.5155" data-map-label="Zug, Suisse" data-map-zoom="12">
<div class="contact-card-media">
<img alt="Zug, vue aérienne de la ville et du lac" data-i18n-alt="contact.site_photo_alt.1" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/site-zug.jpg') ); ?>"/>
</div>
<div class="contact-card-body">
<div class="contact-card-flag">CH</div>
<h3 class="contact-card-city" data-i18n="contact.contact_card_city.13">Zug</h3>
<div class="contact-card-country" data-i18n="contact.contact_card_country.16">Siège · Suisse</div>
<p class="contact-card-detail" data-i18n="contact.contact_card_detail.19">Direction générale, gouvernance, partenariats institutionnels. Premier point de contact pour les discussions stratégiques et les grands comptes.</p>
<div class="contact-card-info"><strong data-i18n="footer.email">Email</strong> <a href="mailto:contact@circumlifesciences.com" data-i18n="topbar.email">contact@circumlifesciences.com</a></div>
<div class="contact-card-info" data-i18n-html="contact.contact_card_info.24"><strong>Horaires</strong> Lun–Ven · 8h30–18h00 CET</div>
</div>
</article>
<article class="contact-card" data-map-lat="43.7102" data-map-lng="7.2620" data-map-label="Nice, France" data-map-zoom="12">
<div class="contact-card-media">
<img alt="Nice, Promenade des Anglais et la baie" data-i18n-alt="contact.site_photo_alt.2" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/site-nice.jpg') ); ?>"/>
</div>
<div class="contact-card-body">
<div class="contact-card-flag">FR</div>
<h3 class="contact-card-city" data-i18n="contact.contact_card_city.14">Nice</h3>
<div class="contact-card-country" data-i18n="contact.contact_card_country.50">R&amp;D · QARA · France</div>
<p class="contact-card-detail" data-i18n="contact.contact_card_detail.20">Centre opérationnel historique : conception, développement, laboratoire de tests, qualité et affaires réglementaires. Supply Chain & Administration. Point d'entrée pour les projets techniques et le support clients.</p>
<div class="contact-card-info"><strong data-i18n="footer.email">Email</strong> <a href="mailto:contact@circumlifesciences.com" data-i18n="topbar.email">contact@circumlifesciences.com</a></div>
<div class="contact-card-info" data-i18n-html="contact.contact_card_info.27"><strong>Horaires</strong> Lun–Ven · 9h00–18h00 CET</div>
</div>
</article>
<article class="contact-card" data-map-lat="35.8256" data-map-lng="10.6411" data-map-label="Sousse, Tunisie" data-map-zoom="12">
<div class="contact-card-media">
<img alt="Sousse, front de mer et corniche" data-i18n-alt="contact.site_photo_alt.3" decoding="async" loading="lazy" src="<?php echo esc_url( circum_asset('assets/img/site-sousse.jpg') ); ?>"/>
</div>
<div class="contact-card-body">
<div class="contact-card-flag">TN</div>
<h3 class="contact-card-city" data-i18n="contact.contact_card_city.15">Sousse</h3>
<div class="contact-card-country" data-i18n="contact.contact_card_country.18">Force One · Tunisie</div>
<p class="contact-card-detail" data-i18n="contact.contact_card_detail.21">Site de fabrication principal. Visites d'audit, qualifications fournisseurs, supervision opérationnelle des programmes en production.</p>
<div class="contact-card-info"><strong data-i18n="footer.email">Email</strong> <a href="mailto:contact@circumlifesciences.com" data-i18n="topbar.email">contact@circumlifesciences.com</a></div>
<div class="contact-card-info" data-i18n-html="contact.contact_card_info.30"><strong>Horaires</strong> Lun–Ven · 8h00–17h00 CET</div>
</div>
</article>
</div>
</div>
</section>
<section class="form-section">
<div class="form-inner">
<div class="reveal" style="text-align: center; margin-bottom: 32px;">
<span class="section-label center" data-i18n="contact.section_label.9">Formulaire B2B</span>
<h2 class="section-title" data-i18n-html="contact.section_title.11" style="font-size: clamp(24px, 3vw, 36px);">Démarrer un <em>projet</em> avec Circum.</h2>
<p class="section-lead" data-i18n="contact.section_lead.12" style="margin: 16px auto 0;">Décrivez votre projet en quelques minutes. Notre équipe commerciale vous recontacte sous 24 heures ouvrées pour un premier échange.</p>
</div>
<form class="form reveal" data-form="contact" novalidate="">
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.31">
<label class="form-label">Prénom <span class="req">*</span></label>
<input class="form-input" name="firstname" required="" type="text"/>
</div>
<div class="form-group" data-i18n-html="contact.form_label.32">
<label class="form-label">Nom <span class="req">*</span></label>
<input class="form-input" name="lastname" required="" type="text"/>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.33">
<label class="form-label">Email professionnel <span class="req">*</span></label>
<input class="form-input" name="email" data-i18n-placeholder="contact.placeholder.1" placeholder="vous@entreprise.com" required="" type="email"/>
</div>
<div class="form-group" data-i18n-html="contact.form_label.34">
<label class="form-label">Téléphone</label>
<input class="form-input" name="phone" type="tel"/>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.35">
<label class="form-label">Société <span class="req">*</span></label>
<input class="form-input" name="company" required="" type="text"/>
</div>
<div class="form-group" data-i18n-html="contact.form_label.36">
<label class="form-label">Fonction</label>
<input class="form-input" name="role" data-i18n-placeholder="contact.placeholder.50" placeholder="CTO, R&amp;D, Achats…" type="text"/>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.37">
<label class="form-label">Pays <span class="req">*</span></label>
<input class="form-input" name="country" required="" type="text"/>
</div>
<div class="form-group" data-i18n-html="contact.form_label.38">
<label class="form-label">Taille de la société</label>
<select class="form-select" name="size">
<option data-i18n="contact.opt_size.50">Startup · &lt; 10 personnes</option>
<option data-i18n="contact.opt_size.51">PME · 10 à 250 personnes</option>
<option data-i18n="contact.opt_size.52">ETI · 250 à 5000 personnes</option>
<option data-i18n="contact.opt_size.53">Grand groupe · &gt; 5000 personnes</option>
</select>
</div>
</div>
<div class="form-group" data-i18n-html="contact.form_label.39">
<label class="form-label">Nature de votre demande <span class="req">*</span></label>
<select class="form-select" name="type" required="">
<option value="" data-i18n="contact.opt_type.50">Sélectionnez</option>
<option data-i18n="contact.opt_type.51">Demande de devis · projet nouveau</option>
<option data-i18n="contact.opt_type.52">Transfert industriel · projet existant</option>
<option data-i18n="contact.opt_type.53">Étude de faisabilité · concept en amont</option>
<option data-i18n="contact.opt_type.54">Sourcing matières / composants</option>
<option data-i18n="contact.opt_type.55">Audit fournisseur / qualification</option>
<option data-i18n="contact.opt_type.56">Partenariat R&amp;D</option>
<option data-i18n="contact.opt_type.57">Autre · à préciser ci-dessous</option>
</select>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.40">
<label class="form-label">Classe du dispositif</label>
<select class="form-select" name="class">
<option data-i18n="contact.opt_class.50">À déterminer</option>
<option data-i18n="contact.opt_class.51">Classe I</option>
<option data-i18n="contact.opt_class.52">Classe IIa</option>
<option data-i18n="contact.opt_class.53">Classe IIb</option>
<option data-i18n="contact.opt_class.54">Classe III</option>
<option data-i18n="contact.opt_class.55">IVD · Diagnostic in vitro</option>
</select>
</div>
<div class="form-group" data-i18n-html="contact.form_label.41">
<label class="form-label">Stade du projet</label>
<select class="form-select" name="stage">
<option data-i18n="contact.opt_stage.50">Idée / concept</option>
<option data-i18n="contact.opt_stage.51">Étude de faisabilité</option>
<option data-i18n="contact.opt_stage.52">Prototype fonctionnel</option>
<option data-i18n="contact.opt_stage.53">Pré-industrialisation</option>
<option data-i18n="contact.opt_stage.54">Production / transfert</option>
</select>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="contact.form_label.42">
<label class="form-label">Volume annuel estimé</label>
<select class="form-select" name="volume">
<option data-i18n="contact.opt_volume.50">Inconnu à ce stade</option>
<option data-i18n="contact.opt_volume.51">Moins de 1 000 unités/an</option>
<option data-i18n="contact.opt_volume.52">1 000 à 10 000 unités/an</option>
<option data-i18n="contact.opt_volume.53">10 000 à 100 000 unités/an</option>
<option data-i18n="contact.opt_volume.54">Plus de 100 000 unités/an</option>
</select>
</div>
<div class="form-group" data-i18n-html="contact.form_label.43">
<label class="form-label">Horizon de mise sur le marché</label>
<select class="form-select" name="timeline">
<option data-i18n="contact.opt_timeline.50">Moins de 12 mois</option>
<option data-i18n="contact.opt_timeline.51">12 à 24 mois</option>
<option data-i18n="contact.opt_timeline.52">2 à 4 ans</option>
<option data-i18n="contact.opt_timeline.53">Plus de 4 ans</option>
<option data-i18n="contact.opt_timeline.54">Non défini</option>
</select>
</div>
</div>
<div class="form-group" data-i18n-html="contact.form_label.44">
<label class="form-label">Décrivez votre projet <span class="req">*</span></label>
<textarea class="form-textarea" name="message" data-i18n-placeholder="contact.placeholder.3" placeholder="Quelques lignes pour nous présenter votre projet, vos enjeux et ce que vous attendez de Circum…" required=""></textarea>
<span class="form-help" data-i18n="contact.form_help.50">Confidentiel · Information traitée uniquement par l'équipe commerciale.</span>
</div>
<div class="form-group" data-i18n-html="contact.form_label.45">
<label class="form-label">Pièce jointe (cahier des charges, plans…)</label>
<div class="form-file">
<svg class="form-file-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-linecap="round" stroke-linejoin="round"></path></svg>
<div class="form-file-text" data-i18n="contact.form_file_text.50"><strong>Cliquez pour téléverser</strong> ou glissez vos documents ici</div>
<div class="form-file-hint" data-i18n="contact.form_file_hint.50">PDF, DOC, ZIP · Max 20 Mo · NDA recommandé en amont</div>
<input accept=".pdf,.doc,.docx,.zip" name="attachment" type="file"/>
</div>
</div>
<div class="form-checkbox" data-i18n-html="contact.form_checkbox.46">
<input id="nda-request" name="nda_request" type="checkbox" value="1"/>
<label for="nda-request"><strong>Je souhaite signer un NDA</strong> avant tout échange technique détaillé. Notre équipe juridique vous transmettra notre modèle standard sous 24 heures.</label>
</div>
<div class="form-checkbox" data-i18n-html="contact.form_checkbox.47">
<input id="contact-consent" name="consent" required="" type="checkbox"/>
<label for="contact-consent"><strong>J'accepte que mes données soient utilisées</strong> pour traiter ma demande commerciale, conformément à notre politique RGPD. Pas d'usage marketing automatisé sans mon accord explicite.</label>
</div>
<button class="btn btn-primary form-submit" type="submit">
<span data-i18n="contact.submit.50">Envoyer ma demande</span>
<span class="btn-arrow">→</span>
</button>
<div class="form-message"></div>
</form>
</div>
</section>
</main>
<?php get_footer();

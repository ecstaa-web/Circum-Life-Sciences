<?php
/**
 * Template Name: CarriÃ¨res
 * Page template: carrieres
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/fabrication-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="carrieres.page_hero_eyebrow.1">Rejoignez Circum</div>
<h1 class="hero-title reveal" data-i18n-html="carrieres.page_hero_title.2">Construisez avec nous <em>la santé de demain.</em></h1>
<p class="hero-subtitle reveal" data-i18n="carrieres.page_hero_subtitle.3">Trois sites européens, des équipes pluridisciplinaires, des projets à fort impact clinique. Si vous voulez travailler sur des dispositifs qui sauvent des vies, dans un environnement industriel exigeant, parlons.</p>
</div>
</section>
<section class="section">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="carrieres.section_label.8">Pourquoi nous rejoindre</span>
<h2 class="section-title" data-i18n-html="carrieres.section_title.11">Trois bonnes <em>raisons</em> de postuler.</h2>
</div>
<div class="benefits-grid reveal" style="margin-top: 56px;">
<div class="benefit">
<svg class="benefit-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 48 48"><path d="M24 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L4 18l14-2z"></path></svg>
<h3 class="benefit-title" data-i18n="carrieres.benefit_title.27">Projets à impact réel</h3>
<p class="benefit-text" data-i18n="carrieres.benefit_text.30">Vos dispositifs équipent des hôpitaux, soignent des patients, soutiennent les équipes médicales. Chaque ligne de production a une finalité concrète.</p>
</div>
<div class="benefit">
<svg class="benefit-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 48 48"><circle cx="24" cy="24" r="20"></circle><path d="M24 14v10l8 4" stroke-linecap="round"></path></svg>
<h3 class="benefit-title" data-i18n="carrieres.benefit_title.28">Mobilité tri-sites</h3>
<p class="benefit-text" data-i18n="carrieres.benefit_text.31">Zug, Nice, Sousse : nos équipes circulent entre les sites pour les projets transverses. Une opportunité d'expérience européenne réelle.</p>
</div>
<div class="benefit">
<svg class="benefit-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 48 48"><path d="M14 30l-4-4 4-4M34 18l4 4-4 4M28 14l-8 20" stroke-linecap="round" stroke-linejoin="round"></path></svg>
<h3 class="benefit-title" data-i18n="carrieres.benefit_title.29">Évolution technique</h3>
<p class="benefit-text" data-i18n="carrieres.benefit_text.32">Plan de formation continue, accès aux salons internationaux, accompagnement vers les certifications métier (lead auditor, expert MDR).</p>
</div>
</div>
</div>
</section>
<section class="section" style="background: var(--gray-50);">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="carrieres.section_label.9">Offres en cours</span>
<h2 class="section-title" data-i18n-html="carrieres.section_title.12">Nos <em>postes ouverts.</em></h2>
<p class="section-lead" data-i18n="carrieres.section_lead.14" style="margin: 0 auto;">Vous ne trouvez pas votre poste ? Envoyez-nous une candidature spontanée via le formulaire ci-dessous.</p>
</div>
<div class="content-empty-state reveal">
<p data-i18n="carrieres.empty_offers.86">Aucune offre d'emploi n'est publiée pour le moment. N'hésitez pas à nous envoyer une candidature spontanée via le formulaire ci-dessous.</p>
</div>
</div>
</section>
<section class="form-section" style="background: var(--white);">
<div class="form-inner">
<div class="reveal" style="text-align: center; margin-bottom: 32px;">
<span class="section-label center" data-i18n="carrieres.section_label.10">Candidature</span>
<h2 class="section-title" data-i18n-html="carrieres.section_title.13" style="font-size: clamp(24px, 3vw, 36px);">Envoyez-nous votre <em>candidature.</em></h2>
<p class="section-lead" data-i18n="carrieres.section_lead.15" style="margin: 16px auto 0;">Postulez à une offre spécifique ou envoyez une candidature spontanée. Notre équipe RH répond sous 5 jours ouvrés.</p>
</div>
<form class="form reveal" data-form="careers" data-testid="careers-form" novalidate="">
<div class="form-row">
<div class="form-group" data-i18n-html="carrieres.form_label.16">
<label class="form-label">Prénom <span class="req">*</span></label>
<input class="form-input" name="firstname" required="" type="text"/>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.17">
<label class="form-label">Nom <span class="req">*</span></label>
<input class="form-input" name="lastname" required="" type="text"/>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="carrieres.form_label.18">
<label class="form-label">Email <span class="req">*</span></label>
<input class="form-input" name="email" required="" type="email"/>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.19">
<label class="form-label">Téléphone</label>
<input class="form-input" name="phone" placeholder="+33 6 …" type="tel"/>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="carrieres.form_label.20">
<label class="form-label">Poste recherché <span class="req">*</span></label>
<select class="form-select" name="position" required="">
<option value="spontaneous" data-i18n="carrieres.opt_position.72">Candidature spontanée</option>
</select>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.21">
<label class="form-label">Site préféré</label>
<select class="form-select" name="location">
<option value="" data-i18n="carrieres.opt_site.73">Aucune préférence</option>
<option data-i18n="carrieres.opt_site.74">Zug · Suisse</option>
<option data-i18n="carrieres.opt_site.75">Nice · France</option>
<option data-i18n="carrieres.opt_site.76">Sousse · Tunisie</option>
<option data-i18n="carrieres.opt_site.77">Indifférent · Mobilité acceptée</option>
</select>
</div>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="carrieres.form_label.22">
<label class="form-label">Années d'expérience</label>
<select class="form-select" name="experience">
<option data-i18n="carrieres.opt_exp.78">Étudiant · stage</option>
<option data-i18n="carrieres.opt_exp.79">0 à 2 ans</option>
<option data-i18n="carrieres.opt_exp.80">3 à 5 ans</option>
<option data-i18n="carrieres.opt_exp.81">6 à 10 ans</option>
<option data-i18n="carrieres.opt_exp.82">Plus de 10 ans</option>
</select>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.23">
<label class="form-label">Disponibilité</label>
<input class="form-input" name="availability" placeholder="Immédiate, dans 3 mois…" type="text"/>
</div>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.24">
<label class="form-label">Lettre de motivation</label>
<textarea class="form-textarea" name="message" placeholder="Présentez-vous en quelques lignes : votre parcours, ce qui vous attire chez Circum, vos compétences clés…"></textarea>
</div>
<div class="form-group" data-i18n-html="carrieres.form_label.25">
<label class="form-label">CV <span class="req">*</span></label>
<div class="form-file">
<svg class="form-file-icon" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-linecap="round" stroke-linejoin="round"></path></svg>
<div class="form-file-text" data-i18n="carrieres.form_file_text.83"><strong>Cliquez pour téléverser</strong> ou glissez votre CV ici</div>
<div class="form-file-hint" data-i18n="carrieres.form_file_hint.84">PDF, DOC, DOCX · Max 10 Mo</div>
<input accept=".pdf,.doc,.docx" name="cv" required="" type="file"/>
</div>
</div>
<div class="form-checkbox" data-i18n-html="carrieres.form_checkbox.26">
<input id="careers-consent" name="consent" required="" type="checkbox" value="true"/>
<label for="careers-consent"><strong>J'accepte le traitement de mes données dans le cadre de cette candidature</strong> et la conservation pendant 2 ans, conformément à notre politique RGPD. Je peux exercer mes droits à tout moment via dpo@circumlifesciences.com.</label>
</div>
<button class="btn btn-pink form-submit" type="submit">
<span data-i18n="carrieres.form_submit.85">Envoyer ma candidature</span>
<span class="btn-arrow">→</span>
</button>
<div class="form-message"></div>
</form>
</div>
</section>
</main>
<?php get_footer();

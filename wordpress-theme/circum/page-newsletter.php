<?php
/**
 * Template Name: Newsletter
 * Page template: newsletter
 */
defined('ABSPATH') || exit;

get_header();
?>
<main class="page-content">
<section class="hero-video-wrap">
<video autoplay="" class="hero-video-bg" fetchpriority="high" loop="" muted="" playsinline="" preload="auto" src="<?php echo esc_url( circum_asset('assets/video/clients-hero.mp4') ); ?>"></video>
<div class="hero-video-overlay"></div>
<div class="hero-video-content">
<div class="hero-eyebrow reveal" data-i18n="newsletter.page_hero_eyebrow.1">Quatre éditions par an</div>
<h1 class="hero-title reveal" data-i18n-html="newsletter.page_hero_title.2">Newsletter <em>trimestrielle.</em></h1>
<p class="hero-subtitle reveal" data-i18n="newsletter.page_hero_subtitle.3">Quatre fois par an, nous partageons nos actualités industrielles, nos publications scientifiques, nos avancées techniques et les principales évolutions du secteur. Format court, signal fort.</p>
<div class="newsletter-hero-stat reveal">
<div class="newsletter-hero-stat-item">
<div class="value">4×/an</div>
<div class="label" data-i18n="newsletter.stat_label.50">Édition trimestrielle</div>
</div>
<div class="newsletter-hero-stat-item">
<div class="value" data-i18n="newsletter.stat_value.51">4 langues</div>
<div class="label">FR · EN · DE · IT</div>
</div>
<div class="newsletter-hero-stat-item">
<div class="value">5 min</div>
<div class="label" data-i18n="newsletter.stat_label.52">Temps de lecture</div>
</div>
</div>
</div>
</section>
<section class="form-section">
<div class="form-inner">
<div class="reveal" style="text-align: center; margin-bottom: 32px;">
<span class="section-label center" data-i18n="newsletter.section_label.8">Inscription</span>
<h2 class="section-title" data-i18n-html="newsletter.section_title.10" style="font-size: clamp(24px, 3vw, 36px);">Restez <em>informé</em> de nos avancées.</h2>
</div>
<form class="form reveal" data-form="newsletter" data-testid="newsletter-form" novalidate="">
<div class="form-row">
<div class="form-group" data-i18n-html="newsletter.form_label.12">
<label class="form-label">Prénom <span class="req">*</span></label>
<input class="form-input" name="firstname" required="" type="text"/>
</div>
<div class="form-group" data-i18n-html="newsletter.form_label.13">
<label class="form-label">Nom <span class="req">*</span></label>
<input class="form-input" name="lastname" required="" type="text"/>
</div>
</div>
<div class="form-group" data-i18n-html="newsletter.form_label.14">
<label class="form-label">Email professionnel <span class="req">*</span></label>
<input class="form-input" name="email" placeholder="vous@entreprise.com" data-i18n-placeholder="newsletter.placeholder.73" required="" type="email"/>
</div>
<div class="form-row">
<div class="form-group" data-i18n-html="newsletter.form_label.15">
<label class="form-label">Société</label>
<input class="form-input" name="company" type="text"/>
</div>
<div class="form-group" data-i18n-html="newsletter.form_label.16">
<label class="form-label">Fonction</label>
<input class="form-input" name="role" placeholder="R&amp;D, achats, qualité…" data-i18n-placeholder="newsletter.placeholder.74" type="text"/>
</div>
</div>
<div class="form-group" data-i18n-html="newsletter.form_label.53">
<label class="form-label">Langue préférée pour la newsletter</label>
<select class="form-select" name="lang">
<option value="fr">Français</option>
<option value="en">English</option>
<option value="de">Deutsch</option>
<option value="it">Italiano</option>
</select>
</div>
<div class="form-group" data-i18n-html="newsletter.form_label.54">
<label class="form-label">Centres d'intérêt (optionnel)</label>
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 8px;">
<label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;"><input style="width: 16px; height: 16px; accent-color: var(--blue);" type="checkbox" name="interests[]" value="design"/> <span data-i18n="newsletter.interest.55">Conception &amp; R&amp;D</span></label>
<label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;"><input style="width: 16px; height: 16px; accent-color: var(--blue);" type="checkbox" name="interests[]" value="quality"/> <span data-i18n="newsletter.interest.56">Qualité &amp; Réglementaire</span></label>
<label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;"><input style="width: 16px; height: 16px; accent-color: var(--blue);" type="checkbox" name="interests[]" value="manufacturing"/> <span data-i18n="newsletter.interest.57">Fabrication &amp; Industrie</span></label>
<label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;"><input style="width: 16px; height: 16px; accent-color: var(--blue);" type="checkbox" name="interests[]" value="innovation"/> <span data-i18n="newsletter.interest.58">Innovation &amp; Publications</span></label>
</div>
</div>
<div class="form-checkbox" data-i18n-html="newsletter.form_checkbox.19">
<input id="nl-consent" name="consent" required="" type="checkbox"/>
<label for="nl-consent"><strong>J'accepte de recevoir la newsletter trimestrielle Circum Life Sciences</strong> et confirme avoir pris connaissance de la politique de confidentialité. Désinscription possible à tout moment via un lien dans chaque envoi.</label>
</div>
<button class="btn btn-primary form-submit" type="submit">
<span data-i18n="newsletter.form_submit.59">S'inscrire à la newsletter</span>
<span class="btn-arrow">→</span>
</button>
<div class="form-message"></div>
</form>
</div>
</section>
<section class="section newsletter-archives-section">
<div class="container">
<div class="section-header center reveal">
<span class="section-label center" data-i18n="newsletter.section_label.9">Archives</span>
<h2 class="section-title" data-i18n-html="newsletter.section_title.11">Les <em>éditions précédentes.</em></h2>
</div>
<div class="newsletter-archives-empty reveal" id="newsletter-archives" data-testid="newsletter-archives">
<p class="newsletter-archives-empty-text" data-i18n="newsletter.empty_archives.75">Aucune édition n'a encore été publiée. Inscrivez-vous ci-dessus pour recevoir notre première newsletter trimestrielle.</p>
</div>
</div>
</section>
</main>
<?php get_footer();

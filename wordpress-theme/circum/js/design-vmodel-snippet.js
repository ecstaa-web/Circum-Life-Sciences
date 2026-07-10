/** V-Model « Design stages », panneau Conception (design page). */
(function () {
  'use strict';

  function buildVmodel(labels) {
    return (
      '<div class="circum-vdiagram">' +
      '<p class="circum-vdiagram-heading"><strong>' + labels.heading + '</strong></p>' +
      '<svg class="circum-vdiagram-svg" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + labels.aria + '">' +
        '<defs>' +
          '<marker id="cv-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#2e8b57"/></marker>' +
        '</defs>' +
        '<rect width="720" height="300" fill="#f8fafd" rx="10"/>' +
        '<path d="M90,88 L175,148 L360,248 L545,148 L630,88 L630,38" fill="none" stroke="#205a99" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<line x1="545" y1="162" x2="175" y2="162" stroke="#2e8b57" stroke-width="2.2" marker-end="url(#cv-g)"/>' +
        '<line x1="630" y1="98" x2="90" y2="98" stroke="#2e8b57" stroke-width="2.2" marker-end="url(#cv-g)"/>' +
        '<text x="360" y="152" text-anchor="middle" fill="#2e8b57" font-size="12" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.verification + '</text>' +
        '<text x="360" y="88" text-anchor="middle" fill="#2e8b57" font-size="12" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.validation + '</text>' +
        '<g transform="translate(23,66)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step0 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.userNeeds + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
        '<g transform="translate(108,126)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step1 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.inputs + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
        '<g transform="translate(293,226)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step2 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="10.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.designDev + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
        '<g transform="translate(478,126)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step3 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.outputs + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
        '<g transform="translate(563,66)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step4 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="10.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.designValidation + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
        '<g transform="translate(563,16)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">' + labels.step5 + '</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">' + labels.designTransfer + '</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
      '</svg>' +
      '<div class="circum-vdiagram-legend">' +
        '<p class="circum-vdiagram-legend-title"><span class="circum-vdiagram-star">★</span> ' + labels.reviewTitle + '</p>' +
        '<div class="circum-vdiagram-dr-grid">' +
          '<span>' + labels.dr0 + '</span><span>' + labels.dr1 + '</span><span>' + labels.dr2 + '</span>' +
          '<span>' + labels.dr3 + '</span><span>' + labels.dr4 + '</span><span>' + labels.dr5 + '</span>' +
        '</div>' +
      '</div>' +
      '</div>'
    );
  }

  var en = {
    heading: 'Design stages',
    aria: 'V-Model Design stages',
    verification: 'Verification',
    validation: 'Validation',
    step0: 'Step 0',
    userNeeds: 'User needs',
    step1: 'Step 1',
    inputs: 'Inputs',
    step2: 'Step 2',
    designDev: 'Design and development',
    step3: 'Step 3',
    outputs: 'Outputs',
    step4: 'Step 4',
    designValidation: 'Design validation',
    step5: 'Step 5',
    designTransfer: 'Design transfer',
    reviewTitle: 'Design review',
    dr0: 'DR-0 : Launch review',
    dr1: 'DR-1 : Inputs review',
    dr2: 'DR-2 : Development review',
    dr3: 'DR-3 : Outputs review',
    dr4: 'DR-4 : Validation review',
    dr5: 'DR-5 : Transfer review'
  };

  var fr = {
    heading: 'Étapes de conception',
    aria: 'Modèle en V, étapes de conception',
    verification: 'Vérification',
    validation: 'Validation',
    step0: 'Étape 0',
    userNeeds: 'Besoins utilisateurs',
    step1: 'Étape 1',
    inputs: 'Entrées',
    step2: 'Étape 2',
    designDev: 'Conception et développement',
    step3: 'Étape 3',
    outputs: 'Sorties',
    step4: 'Étape 4',
    designValidation: 'Validation de conception',
    step5: 'Étape 5',
    designTransfer: 'Transfert de conception',
    reviewTitle: 'Revue de conception',
    dr0: 'DR-0 : Revue de lancement',
    dr1: 'DR-1 : Revue des entrées',
    dr2: 'DR-2 : Revue de développement',
    dr3: 'DR-3 : Revue des sorties',
    dr4: 'DR-4 : Revue de validation',
    dr5: 'DR-5 : Revue de transfert'
  };

  window.CIRCUM_VMODEL_HTML_BY_LANG = {
    fr: buildVmodel(fr),
    en: buildVmodel(en),
    de: buildVmodel(en),
    it: buildVmodel(en)
  };
  window.CIRCUM_VMODEL_HTML = window.CIRCUM_VMODEL_HTML_BY_LANG.en;
})();

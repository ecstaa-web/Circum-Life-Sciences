/** V-Model « Design stages » — panneau Conception (design page). */
window.CIRCUM_VMODEL_HTML =
  '<div class="circum-vdiagram">' +
  '<p class="circum-vdiagram-heading"><strong>Design stages</strong></p>' +
  '<svg class="circum-vdiagram-svg" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="V-Model Design stages">' +
    '<defs>' +
      '<marker id="cv-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#2e8b57"/></marker>' +
    '</defs>' +
    '<rect width="720" height="300" fill="#f8fafd" rx="10"/>' +
    '<path d="M90,88 L175,148 L360,248 L545,148 L630,88 L630,38" fill="none" stroke="#205a99" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<line x1="545" y1="162" x2="175" y2="162" stroke="#2e8b57" stroke-width="2.2" marker-end="url(#cv-g)"/>' +
    '<line x1="630" y1="98" x2="90" y2="98" stroke="#2e8b57" stroke-width="2.2" marker-end="url(#cv-g)"/>' +
    '<text x="360" y="152" text-anchor="middle" fill="#2e8b57" font-size="12" font-weight="600" font-family="Inter,Arial,sans-serif">Verification</text>' +
    '<text x="360" y="88" text-anchor="middle" fill="#2e8b57" font-size="12" font-weight="600" font-family="Inter,Arial,sans-serif">Validation</text>' +
    '<g transform="translate(23,66)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 0</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">User needs</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
    '<g transform="translate(108,126)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 1</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">Inputs</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
    '<g transform="translate(293,226)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 2</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="10.5" font-weight="600" font-family="Inter,Arial,sans-serif">Design and development</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
    '<g transform="translate(478,126)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 3</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">Outputs</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
    '<g transform="translate(563,66)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 4</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="10.5" font-weight="600" font-family="Inter,Arial,sans-serif">Design validation</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
    '<g transform="translate(563,16)"><rect width="134" height="48" rx="3" fill="#fff" stroke="#205a99" stroke-width="1.8"/><text x="67" y="16" text-anchor="middle" fill="#444" font-size="10" font-family="Inter,Arial,sans-serif">Step 5</text><text x="67" y="34" text-anchor="middle" fill="#205a99" font-size="11.5" font-weight="600" font-family="Inter,Arial,sans-serif">Design transfer</text><text x="122" y="13" fill="#f365b4" font-size="13">★</text></g>' +
  '</svg>' +
  '<div class="circum-vdiagram-legend">' +
    '<p class="circum-vdiagram-legend-title"><span class="circum-vdiagram-star">★</span> Design review</p>' +
    '<div class="circum-vdiagram-dr-grid">' +
      '<span>DR-0 : Launch review</span><span>DR-1 : Inputs review</span><span>DR-2 : Development review</span>' +
      '<span>DR-3 : Outputs review</span><span>DR-4 : Validation review</span><span>DR-5 : Transfer review</span>' +
    '</div>' +
  '</div>' +
  '</div>';

'use strict';

const path = require('path');

const LOW_EFFORT_PLATFORMS = [
  { key: 'facebook', label: 'Facebook page instead of a real site' },
  { key: 'google-sites', label: 'Google Sites build — easy upgrade pitch' },
  { key: 'square', label: 'Square site — usually easy to outgrow' },
  { key: 'wix', label: 'Wix build — often fine, but easy to improve' },
  { key: 'weebly', label: 'Weebly build — usually dated and limited' },
  { key: 'godaddy', label: 'GoDaddy site builder — common small-business upgrade pitch' }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeCityLabel(value) {
  return String(value || '').split(',')[0].trim();
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function extractEmails({ html = '', textContent = '' } = {}) {
  const combined = `${html}\n${textContent}`;
  const matches = combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

  return unique(matches.map(email => email.trim().toLowerCase())).filter(email => {
    if (email.length > 120) return false;
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email)) return false;
    if (/(example|yourname|youremail)@/i.test(email)) return false;
    if (/(wixpress|sentry|cloudflare|godaddy|secureserver|facebookmail|example)\./i.test(email)) return false;
    return true;
  });
}

function extractPhones({ html = '', textContent = '' } = {}) {
  const combined = `${html}\n${textContent}`;
  const matches = combined.match(/(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g) || [];
  return unique(matches.map(phone => phone.replace(/\s+/g, ' ').trim()));
}

function detectPlatform({ url = '', html = '' } = {}) {
  const haystack = `${url}\n${html}`.toLowerCase();

  if (!url) return 'none';
  if (haystack.includes('facebook.com')) return 'facebook';
  if (haystack.includes('sites.google.com')) return 'google-sites';
  if (haystack.includes('square.site')) return 'square';
  if (haystack.includes('wixsite.com') || haystack.includes(' wix.com')) return 'wix';
  if (haystack.includes('weebly.com') || haystack.includes('weebly')) return 'weebly';
  if (haystack.includes('godaddy') || haystack.includes('secureserver.net')) return 'godaddy';
  if (haystack.includes('shopify')) return 'shopify';
  if (haystack.includes('wordpress')) return 'wordpress';
  return 'custom';
}

function platformLabel(platform) {
  return LOW_EFFORT_PLATFORMS.find(item => item.key === platform)?.label || null;
}

function inferPackage({ website, score, failedChecks = [], platform }) {
  if (!website) return 'launch-pad';
  if (platform && LOW_EFFORT_PLATFORMS.some(item => item.key === platform)) return 'refresh';
  if (failedChecks.some(issue => /ssl|mobile|contact info|cta/i.test(issue))) return 'refresh';
  if (typeof score === 'number' && score >= 82) return 'tune-up';
  return 'refresh';
}

function inferValue(packageId) {
  switch (packageId) {
    case 'launch-pad': return 1200;
    case 'refresh': return 900;
    case 'tune-up': return 500;
    default: return 750;
  }
}

function determineTier(score) {
  if (score >= 78) return 'prime';
  if (score >= 58) return 'pursue';
  if (score >= 40) return 'watch';
  return 'skip';
}

function defaultStageFromTier(tier) {
  switch (tier) {
    case 'prime': return 'Scored';
    case 'pursue': return 'Scored';
    case 'watch': return 'Research';
    default: return 'Parked';
  }
}

function computeOutreachScore({
  website,
  siteScore,
  error,
  failedChecks = [],
  emails = [],
  phones = [],
  platform = 'custom'
}) {
  let outreachScore = 0;
  const reasons = [];
  const cautions = [];

  const realWebsite = !!website && !error;
  const hasPublicEmail = emails.length > 0;
  const hasPhone = phones.length > 0;
  const criticalIssue = failedChecks.some(issue =>
    /ssl|mobile|contact info|cta|meta description|h1/i.test(issue)
  );

  if (!realWebsite) {
    outreachScore += 48;  // bumped: no-website is always worth pursuing
    reasons.push('No usable website — easiest value conversation');
  } else {
    const needScore = clamp(100 - (Number(siteScore) || 0), 0, 100);
    outreachScore += Math.round(needScore * 0.42);

    if ((Number(siteScore) || 0) <= 60) {
      reasons.push(`Website score is only ${siteScore}/100`);
    } else if ((Number(siteScore) || 0) >= 86) {
      outreachScore -= 16;
      cautions.push('Site is already pretty polished — lower priority');
    }
  }

  if (hasPublicEmail) {
    outreachScore += 20;
    reasons.push(`Public email found: ${emails[0]}`);
  } else if (!realWebsite) {
    // No-website leads: don't punish for missing email, phone is the contact path
    cautions.push('No public email — call or walk in');
  } else {
    outreachScore -= 6;
    cautions.push('No public email found');
  }

  if (hasPhone) {
    // Phone counts more for no-website leads (it's the primary contact path)
    outreachScore += !realWebsite ? 12 : 6;
    if (!realWebsite) reasons.push(`Reachable by phone: ${phones[0]}`);
  } else if (!realWebsite) {
    outreachScore -= 2; // softer penalty for no-website leads
    cautions.push('No phone captured — walk-in only');
  } else {
    outreachScore -= 4;
    cautions.push('No phone captured');
  }

  if (failedChecks.length >= 4) {
    outreachScore += 10;
    reasons.push(`${failedChecks.length} concrete website issues to reference`);
  } else if (failedChecks.length >= 2) {
    outreachScore += 6;
  }

  if (criticalIssue) {
    outreachScore += 8;
    reasons.push('Has at least one conversion or trust issue');
  }

  if (platform && LOW_EFFORT_PLATFORMS.some(item => item.key === platform)) {
    outreachScore += 10;
    reasons.push(platformLabel(platform));
  }

  if (/ssl|domain not found|connection refused/i.test(error || '')) {
    outreachScore += 12;
    reasons.push(`Site problem: ${error}`);
  }

  if (realWebsite && (Number(siteScore) || 0) >= 85 && failedChecks.length <= 1) {
    outreachScore -= 12;
    cautions.push('Not enough pain to justify cold outreach right now');
  }

  // No-website leads should always be at least WATCH regardless of final score
  let finalScore = clamp(Math.round(outreachScore), 0, 100);
  if (!realWebsite) finalScore = Math.max(finalScore, 40);
  const outreachTier = determineTier(finalScore);
  const recommendedPackage = inferPackage({
    website: realWebsite ? website : null,
    score: siteScore,
    failedChecks,
    platform
  });

  const topIssues = failedChecks.slice(0, 3);
  const quickPitch = !realWebsite
    ? 'You have no real website, so customers are forced to rely on Facebook, listings, or word of mouth.'
    : topIssues.length
      ? `I spotted ${topIssues.join(', ').toLowerCase()} issues that make the site harder to trust and use.`
      : 'There are a few easy wins here, but this one is lower urgency.';

  return {
    outreachScore: finalScore,
    outreachTier,
    shouldPursue: outreachTier === 'prime' || outreachTier === 'pursue',
    recommendedPackage,
    estimatedValue: inferValue(recommendedPackage),
    priorityReasons: unique(reasons).slice(0, 4),
    cautions: unique(cautions).slice(0, 3),
    nextAction: hasPublicEmail
      ? 'Draft a short audit-based email with 2–3 specific issues and a simple offer.'
      : hasPhone
        ? 'Call or walk in with the audit and ask who handles the website.'
        : 'Research contact details before spending more time here.',
    quickPitch
  };
}

function buildLeadProfile({ business = {}, result = {}, pageData = null } = {}) {
  const website = business.website || result.url || null;
  const html = pageData?.html || '';
  const textContent = pageData?.textContent || '';
  const detectedEmails = extractEmails({ html, textContent });
  const detectedPhones = extractPhones({ html, textContent });
  const phones = unique([business.phone, ...(business.phone ? [] : detectedPhones), ...detectedPhones]);
  const emails = detectedEmails;
  const platform = detectPlatform({ url: website, html });
  const failedChecks = result.failedChecks || [];
  const siteScore = typeof result.percentage === 'number'
    ? result.percentage
    : (typeof business.score === 'number' ? business.score : 0);
  const error = result.error || business.error || null;

  const computed = computeOutreachScore({
    website,
    siteScore,
    error,
    failedChecks,
    emails,
    phones,
    platform
  });

  return {
    id: slugify(`${business.name || business.biz || 'lead'}-${normalizeCityLabel(business.city || '')}`),
    publicEmails: emails,
    publicEmail: emails[0] || null,
    phones,
    primaryPhone: phones[0] || business.phone || null,
    platform,
    platformLabel: platformLabel(platform),
    siteScore,
    topIssues: failedChecks.slice(0, 5),
    ...computed
  };
}

function fromAuditBusiness(business, sourceReport = null) {
  const leadProfile = business.leadProfile || buildLeadProfile({
    business,
    result: {
      percentage: business.score,
      failedChecks: business.failedChecks || [],
      error: business.error || null,
      url: business.website || null
    }
  });

  return {
    id: leadProfile.id || slugify(`${business.name}-${normalizeCityLabel(business.city || '')}`),
    businessName: business.name,
    city: business.city,
    website: business.website || null,
    hasWebsite: !!(business.website && !business.error),
    publicEmail: leadProfile.publicEmail,
    publicEmails: leadProfile.publicEmails,
    phone: leadProfile.primaryPhone || business.phone || null,
    phones: leadProfile.phones,
    platform: leadProfile.platform,
    outreachScore: leadProfile.outreachScore,
    outreachTier: leadProfile.outreachTier,
    shouldPursue: leadProfile.shouldPursue,
    stage: defaultStageFromTier(leadProfile.outreachTier),
    auditScore: leadProfile.siteScore,
    siteHealth: business.grade || null,
    leadTemperature: business.leadTemperature || null,
    topIssues: leadProfile.topIssues,
    priorityReasons: leadProfile.priorityReasons,
    cautions: leadProfile.cautions,
    recommendedPackage: leadProfile.recommendedPackage,
    estimatedValue: leadProfile.estimatedValue,
    quickPitch: leadProfile.quickPitch,
    nextAction: leadProfile.nextAction,
    lastTouch: null,
    followUpOn: null,
    notes: '',
    proposal: {
      status: 'Not started',
      lastGeneratedAt: null,
      htmlPath: null,
      pdfPath: null,
      packageId: leadProfile.recommendedPackage,
      price: leadProfile.estimatedValue
    },
    sourceReport: sourceReport ? path.resolve(sourceReport) : null,
    importedAt: new Date().toISOString()
  };
}

module.exports = {
  slugify,
  normalizeCityLabel,
  extractEmails,
  extractPhones,
  detectPlatform,
  computeOutreachScore,
  buildLeadProfile,
  fromAuditBusiness,
  determineTier,
  defaultStageFromTier
};

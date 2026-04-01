/**
 * scorer.js - Scoring logic for site audits
 * Each check returns { pass: bool, score: number, max: number, detail: string }
 */

const CHECKS = {
  ssl: {
    label: 'SSL (HTTPS)',
    max: 10,
    weight: 'critical',
    emoji: '🔒'
  },
  mobileResponsive: {
    label: 'Mobile Responsive',
    max: 10,
    weight: 'important',
    emoji: '📱'
  },
  pageTitle: {
    label: 'Page Title',
    max: 8,
    weight: 'important',
    emoji: '📋'
  },
  metaDescription: {
    label: 'Meta Description',
    max: 8,
    weight: 'important',
    emoji: '📝'
  },
  h1Present: {
    label: 'H1 Heading',
    max: 7,
    weight: 'moderate',
    emoji: '🔤'
  },
  imageAltTags: {
    label: 'Image Alt Tags',
    max: 7,
    weight: 'moderate',
    emoji: '🖼️'
  },
  contactInfo: {
    label: 'Contact Info',
    max: 15,
    weight: 'critical',
    emoji: '📞'
  },
  socialMedia: {
    label: 'Social Media Links',
    max: 8,
    weight: 'moderate',
    emoji: '📣'
  },
  copyrightYear: {
    label: 'Copyright Up-to-Date',
    max: 5,
    weight: 'minor',
    emoji: '©️'
  },
  pageSpeed: {
    label: 'Page Load Speed',
    max: 12,
    weight: 'important',
    emoji: '⚡'
  },
  clearCTA: {
    label: 'Clear CTA (Button/Form)',
    max: 10,
    weight: 'important',
    emoji: '🎯'
  }
};

const TOTAL_MAX = Object.values(CHECKS).reduce((sum, c) => sum + c.max, 0);

function scoreSSL(url) {
  const pass = url.startsWith('https://');
  return {
    pass,
    score: pass ? CHECKS.ssl.max : 0,
    max: CHECKS.ssl.max,
    detail: pass ? 'Site uses HTTPS' : 'Site does NOT use HTTPS — major trust issue'
  };
}

function scoreMobileResponsive(html) {
  const hasViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html) ||
    /<meta[^>]+content=["'][^"']*width=device-width[^"']*["'][^>]*>/i.test(html);
  return {
    pass: hasViewport,
    score: hasViewport ? CHECKS.mobileResponsive.max : 0,
    max: CHECKS.mobileResponsive.max,
    detail: hasViewport ? 'Viewport meta tag found' : 'No viewport meta tag — likely not mobile-friendly'
  };
}

function scorePageTitle(html, url) {
  const match = html.match(/<title[^>]*>([^<]{0,200})<\/title>/i);
  const title = match ? match[1].trim() : null;
  
  if (!title) {
    return { pass: false, score: 0, max: CHECKS.pageTitle.max, detail: 'No page title found' };
  }
  
  const hostname = new URL(url).hostname.replace('www.', '');
  const tooGeneric = /^(home|welcome|index|untitled|page|new page)$/i.test(title) ||
    title === hostname;
  
  if (tooGeneric || title.length < 5) {
    return { pass: false, score: 3, max: CHECKS.pageTitle.max, detail: `Title exists but is generic: "${title}"` };
  }
  
  return {
    pass: true,
    score: CHECKS.pageTitle.max,
    max: CHECKS.pageTitle.max,
    detail: `Good title: "${title.substring(0, 60)}${title.length > 60 ? '…' : ''}"`
  };
}

function scoreMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,300})["'][^>]*>/i) ||
    html.match(/<meta[^>]+content=["']([^"']{0,300})["'][^>]+name=["']description["'][^>]*>/i);
  const desc = match ? match[1].trim() : null;
  
  if (!desc) {
    return { pass: false, score: 0, max: CHECKS.metaDescription.max, detail: 'No meta description — hurts Google ranking' };
  }
  if (desc.length < 50) {
    return { pass: false, score: 4, max: CHECKS.metaDescription.max, detail: `Meta description too short (${desc.length} chars): "${desc}"` };
  }
  return {
    pass: true,
    score: CHECKS.metaDescription.max,
    max: CHECKS.metaDescription.max,
    detail: `Meta description present (${desc.length} chars)`
  };
}

function scoreH1(html) {
  const h1s = html.match(/<h1[^>]*>[^<]{0,200}<\/h1>/gi) || [];
  if (h1s.length === 0) {
    return { pass: false, score: 0, max: CHECKS.h1Present.max, detail: 'No H1 heading found' };
  }
  if (h1s.length > 3) {
    return { pass: false, score: 4, max: CHECKS.h1Present.max, detail: `Too many H1s (${h1s.length}) — confuses search engines` };
  }
  const text = h1s[0].replace(/<[^>]+>/g, '').trim();
  return {
    pass: true,
    score: CHECKS.h1Present.max,
    max: CHECKS.h1Present.max,
    detail: `H1 found: "${text.substring(0, 60)}${text.length > 60 ? '…' : ''}"`
  };
}

function scoreImageAltTags(html) {
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  if (imgTags.length === 0) {
    return {
      pass: true,
      score: CHECKS.imageAltTags.max,
      max: CHECKS.imageAltTags.max,
      detail: 'No images found (no issue)'
    };
  }
  
  const missing = imgTags.filter(img => !/alt=["'][^"']*["']/i.test(img) && !/alt=""/i.test(img));
  const withEmpty = imgTags.filter(img => /alt=["']\s*["']/i.test(img));
  const ratio = 1 - (missing.length / imgTags.length);
  
  if (missing.length === 0) {
    return {
      pass: true,
      score: CHECKS.imageAltTags.max,
      max: CHECKS.imageAltTags.max,
      detail: `All ${imgTags.length} images have alt tags`
    };
  }
  
  const score = Math.round(ratio * CHECKS.imageAltTags.max);
  return {
    pass: missing.length < imgTags.length / 2,
    score,
    max: CHECKS.imageAltTags.max,
    detail: `${missing.length}/${imgTags.length} images missing alt tags`
  };
}

function scoreContactInfo(html, textContent) {
  const text = textContent || html.replace(/<[^>]+>/g, ' ');
  
  const hasPhone = /(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g.test(text);
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g.test(text);
  const hasAddress = /(street|st\.|avenue|ave\.|road|rd\.|drive|dr\.|blvd|suite|ste\.|\baz\b|\bca\b|\btx\b|\bfl\b)/i.test(text) ||
    /\b\d{5}\b/.test(text); // zip code
  
  const found = [hasPhone && 'phone', hasEmail && 'email', hasAddress && 'address'].filter(Boolean);
  
  let score = 0;
  if (hasPhone) score += 6;
  if (hasEmail) score += 4;
  if (hasAddress) score += 5;
  score = Math.min(score, CHECKS.contactInfo.max);
  
  return {
    pass: found.length >= 2,
    score,
    max: CHECKS.contactInfo.max,
    detail: found.length > 0
      ? `Contact info found: ${found.join(', ')}`
      : 'No contact info found — customers can\'t reach them!'
  };
}

function scoreSocialMedia(html) {
  const socialPatterns = {
    facebook: /facebook\.com\//i,
    instagram: /instagram\.com\//i,
    twitter: /twitter\.com\/|x\.com\//i,
    linkedin: /linkedin\.com\//i,
    youtube: /youtube\.com\//i,
    tiktok: /tiktok\.com\//i,
    yelp: /yelp\.com\//i
  };
  
  const found = Object.entries(socialPatterns)
    .filter(([, pattern]) => pattern.test(html))
    .map(([name]) => name);
  
  return {
    pass: found.length > 0,
    score: found.length > 0 ? CHECKS.socialMedia.max : 0,
    max: CHECKS.socialMedia.max,
    detail: found.length > 0
      ? `Social links: ${found.join(', ')}`
      : 'No social media links found'
  };
}

function scoreCopyrightYear(html) {
  const currentYear = new Date().getFullYear();
  const match = html.match(/©\s*(\d{4})|copyright\s*[©]?\s*(\d{4})/i);
  
  if (!match) {
    return {
      pass: false,
      score: 2,
      max: CHECKS.copyrightYear.max,
      detail: 'No copyright year found in footer'
    };
  }
  
  const year = parseInt(match[1] || match[2]);
  const yearsOld = currentYear - year;
  
  if (yearsOld === 0) {
    return { pass: true, score: CHECKS.copyrightYear.max, max: CHECKS.copyrightYear.max, detail: `Copyright © ${year} — up to date` };
  } else if (yearsOld <= 2) {
    return { pass: true, score: 3, max: CHECKS.copyrightYear.max, detail: `Copyright © ${year} — slightly outdated (${yearsOld} year${yearsOld > 1 ? 's' : ''} old)` };
  } else {
    return { pass: false, score: 0, max: CHECKS.copyrightYear.max, detail: `Copyright © ${year} — ${yearsOld} years outdated! Looks abandoned` };
  }
}

function scorePageSpeed(loadTimeMs) {
  const max = CHECKS.pageSpeed.max;
  if (loadTimeMs === null || loadTimeMs === undefined) {
    return { pass: false, score: 0, max, detail: 'Could not measure load time' };
  }
  
  if (loadTimeMs < 1500) {
    return { pass: true, score: max, max, detail: `Fast load: ${(loadTimeMs/1000).toFixed(1)}s` };
  } else if (loadTimeMs < 3000) {
    return { pass: true, score: Math.round(max * 0.75), max, detail: `Moderate load: ${(loadTimeMs/1000).toFixed(1)}s` };
  } else if (loadTimeMs < 5000) {
    return { pass: false, score: Math.round(max * 0.4), max, detail: `Slow load: ${(loadTimeMs/1000).toFixed(1)}s — hurts conversions` };
  } else {
    return { pass: false, score: Math.round(max * 0.1), max, detail: `Very slow load: ${(loadTimeMs/1000).toFixed(1)}s — terrible UX` };
  }
}

function scoreCTA(html, textContent) {
  const text = textContent || html.replace(/<[^>]+>/g, ' ');
  
  const hasForms = /<form[^>]*>/i.test(html);
  const hasButtonCTA = /<button[^>]*>/i.test(html) || /<a[^>]+class=["'][^"']*btn[^"']*["'][^>]*>/i.test(html);
  const ctaPhrases = [
    'call us', 'contact us', 'get a quote', 'free estimate', 'book now',
    'schedule', 'get started', 'learn more', 'sign up', 'order now',
    'buy now', 'request', 'call today', 'visit us', 'make a reservation',
    'get directions', 'call for', 'click here'
  ];
  const hasCTAText = ctaPhrases.some(phrase => text.toLowerCase().includes(phrase));
  
  const score = (hasForms ? 4 : 0) + (hasButtonCTA ? 3 : 0) + (hasCTAText ? 3 : 0);
  const capped = Math.min(score, CHECKS.clearCTA.max);
  
  const found = [];
  if (hasForms) found.push('contact form');
  if (hasButtonCTA) found.push('CTA button');
  if (hasCTAText) found.push('CTA text');
  
  return {
    pass: capped >= 6,
    score: capped,
    max: CHECKS.clearCTA.max,
    detail: found.length > 0 ? `CTA elements: ${found.join(', ')}` : 'No clear call-to-action found'
  };
}

/**
 * Run all checks and return a scored result
 */
function scoreWebsite({ url, html, textContent, loadTimeMs, error }) {
  if (error || !html) {
    return {
      url,
      error: error || 'No HTML content',
      score: 0,
      maxScore: TOTAL_MAX,
      percentage: 0,
      grade: 'F',
      checks: {},
      summary: 'Site could not be audited'
    };
  }

  const checks = {
    ssl: scoreSSL(url),
    mobileResponsive: scoreMobileResponsive(html),
    pageTitle: scorePageTitle(html, url),
    metaDescription: scoreMetaDescription(html),
    h1Present: scoreH1(html),
    imageAltTags: scoreImageAltTags(html),
    contactInfo: scoreContactInfo(html, textContent),
    socialMedia: scoreSocialMedia(html),
    copyrightYear: scoreCopyrightYear(html),
    pageSpeed: scorePageSpeed(loadTimeMs),
    clearCTA: scoreCTA(html, textContent)
  };

  const totalScore = Object.values(checks).reduce((sum, c) => sum + c.score, 0);
  const percentage = Math.round((totalScore / TOTAL_MAX) * 100);
  
  let grade;
  if (percentage >= 85) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 55) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else grade = 'F';

  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.pass)
    .map(([key]) => CHECKS[key].label);

  return {
    url,
    score: totalScore,
    maxScore: TOTAL_MAX,
    percentage,
    grade,
    checks,
    checkMeta: CHECKS,
    failedChecks,
    summary: `${percentage}% (${totalScore}/${TOTAL_MAX}) — Grade ${grade}`
  };
}

module.exports = { scoreWebsite, CHECKS, TOTAL_MAX };

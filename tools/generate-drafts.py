import json
from pathlib import Path
base = Path.home()/ 'Desktop' / 'Audit reports' / 'nightly-tucson' / '2026-04-01'
out = Path.home()/ 'Desktop' / 'Audit reports' / 'Tucson-Outreach-Drafts.md'
lines = ['# Tucson Outreach Drafts','','Use these as first-pass drafts for businesses with public contact emails or contact forms.','']
for f in sorted(base.glob('*/report.json')):
    data = json.loads(f.read_text())
    category = data['meta']['category']
    top = data['businesses'][:2]
    lines += [f'## {category.title()}','']
    for b in top:
        issues = ', '.join(b.get('failedChecks', [])[:3]) or 'a few website opportunities'
        lines += [f'### {b["name"]}','',
        f'Subject: Quick website audit for {b["name"]}','',
        f'Hi, I’m Gabriel with Desert Digital Studio. I ran a quick audit on {b["name"]} and noticed a few opportunities on your website — specifically {issues}.',
        '',
        'Nothing catastrophic, but they may be making the site harder to find or less effective for customers than it should be.',
        '',
        'If you want, I can send over a short summary of what I found and how I’d improve it.',
        '',
        'Best,',
        'Gabriel',
        'Desert Digital Studio',
        'gabriel@desertdigitalstudio.com',
        'desertdigitalstudio.com','']

out.write_text('\n'.join(lines))
print(out)

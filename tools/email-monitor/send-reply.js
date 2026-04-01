#!/usr/bin/env node
/**
 * send-reply.js — Send an email reply from gabriel@desertdigitalstudio.com
 *
 * Usage:
 *   node send-reply.js --to "email@example.com" --subject "Re: Your inquiry" --body "Hello..."
 *
 * Or pipe JSON:
 *   echo '{"to":"...","subject":"...","body":"..."}' | node send-reply.js
 */

const nodemailer = require('nodemailer');

const SMTP_CONFIG = {
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'gabriel@desertdigitalstudio.com',
    pass: 'arP6jSWisQ2H'
  }
};

const SIGNATURE = `\n\n--\nGabriel Maciel\nDesert Digital Studio\ngabriel@desertdigitalstudio.com\ndesertdigitalstudio.com`;

async function sendReply({ to, subject, body, attachments }) {
  const transporter = nodemailer.createTransport(SMTP_CONFIG);

  const info = await transporter.sendMail({
    from: '"Desert Digital Studio" <gabriel@desertdigitalstudio.com>',
    to,
    subject,
    text: body + SIGNATURE,
    attachments: attachments || []
  });

  return info;
}

// CLI usage
async function main() {
  let input = {};

  const args = process.argv.slice(2);
  const toIdx = args.indexOf('--to');
  const subIdx = args.indexOf('--subject');
  const bodyIdx = args.indexOf('--body');
  const attachIdx = args.indexOf('--attach');

  if (toIdx !== -1) input.to = args[toIdx + 1];
  if (subIdx !== -1) input.subject = args[subIdx + 1];
  if (bodyIdx !== -1) input.body = args[bodyIdx + 1];
  if (attachIdx !== -1) {
    input.attachments = [{
      filename: require('path').basename(args[attachIdx + 1]),
      path: args[attachIdx + 1]
    }];
  }

  // If piped JSON
  if (!input.to && !process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    input = JSON.parse(Buffer.concat(chunks).toString());
  }

  if (!input.to || !input.body) {
    console.error('Usage: node send-reply.js --to <email> --subject <subject> --body <body>');
    process.exit(1);
  }

  if (!input.subject) input.subject = 'Re: Your inquiry';

  try {
    const info = await sendReply(input);
    console.log(JSON.stringify({ success: true, messageId: info.messageId, to: input.to }));
  } catch (err) {
    console.error(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  }
}

main();

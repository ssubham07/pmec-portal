const crypto = require('crypto');

const CAPTCHA_SECRET = process.env.JWT_SECRET || 'pmec_captcha_secret_2026';

function generateRandomText(length = 5) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Avoid confusing 0, O, 1, I
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function generateCaptchaSvg(text) {
  const width = 140;
  const height = 44;
  
  // Random lines for noise
  let lines = '';
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const colors = ['#94a3b8', '#64748b', '#3b82f6', '#cbd5e1'];
    const color = colors[i % colors.length];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6"/>`;
  }

  // Individual character rendering with slight rotations
  let charsSvg = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = 18 + i * 22;
    const y = 30 + (Math.random() * 4 - 2);
    const rot = Math.floor(Math.random() * 24 - 12);
    const colors = ['#0f2a52', '#1e40af', '#1d4ed8', '#0369a1'];
    const color = colors[i % colors.length];
    charsSvg += `<text x="${x}" y="${y}" font-family="Courier New, monospace, sans-serif" font-size="24" font-weight="900" fill="${color}" transform="rotate(${rot}, ${x}, ${y})">${char}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #f1f5f9; border-radius: 6px; user-select: none;">
    <rect width="${width}" height="${height}" fill="#f8fafc" rx="6" stroke="#cbd5e1" stroke-width="1"/>
    ${lines}
    ${charsSvg}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createCaptcha() {
  const text = generateRandomText(5);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  const payload = `${text.toUpperCase()}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
  const captchaId = Buffer.from(`${payload}:${signature}`).toString('base64');
  const svgUrl = generateCaptchaSvg(text);

  return { captchaId, svgUrl, text };
}

function verifyCaptcha(captchaId, userInput) {
  if (!captchaId || !userInput) return false;
  try {
    const decoded = Buffer.from(captchaId, 'base64').toString('utf8');
    const [expectedText, expiresAtStr, signature] = decoded.split(':');
    
    if (!expectedText || !expiresAtStr || !signature) return false;

    // Check expiration
    if (Date.now() > parseInt(expiresAtStr, 10)) {
      return false;
    }

    // Verify HMAC signature
    const payload = `${expectedText}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) return false;

    // Compare text (case-insensitive)
    return expectedText.toUpperCase() === userInput.trim().toUpperCase();
  } catch (err) {
    return false;
  }
}

module.exports = { createCaptcha, verifyCaptcha };

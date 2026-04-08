const https = require('https');

// Simple in-memory rate limiter
// Limits each IP to 20 messages per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }

  // Reset window if expired
  if (now - entry.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries every hour to prevent memory bloat
setInterval(function() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.start > WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);

exports.handler = async function(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Rate limiting
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (isRateLimited(ip)) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        content: [{ text: 'You have sent too many messages. Please wait a while before trying again, or email us directly at axonarchives@gmail.com' }]
      })
    };
  }

  try {
    var body = JSON.parse(event.body);

    // Input validation
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new Error('Invalid request');
    }

    // Limit conversation history to last 10 messages to control token usage
    var messages = body.messages.slice(-10);

    // Limit message length to 1000 characters each
    messages = messages.map(function(msg) {
      return {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content.slice(0, 1000) : msg.content
      };
    });

    var systemPrompt = 'You are the studio assistant for AXON ARCHIVES, a premium architecture and visualization studio based in Lagos, Nigeria. Be professional, warm and knowledgeable. SERVICES: 3D Exterior View $80/view, 3D Interior View $80/view, Presentation Plan Drawing from $150, Architectural Construction Drawing from $250, Approval Drawing from $250, Animation $200/min, 7D Panoramic View $200/pano. Architectural Design and Interior Design are consultation-based. WORKFLOW: Client sends brief, provides survey plan for new designs or CAD files for 3D work, studio agrees fee, sends invoice, client pays 80% deposit, work begins, balance on delivery. CONTACT: axonarchives@gmail.com, Lagos Nigeria, serving clients globally.';

    var requestBody = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    });

    var result = await new Promise(function(resolve, reject) {
      var options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      };

      var req = https.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          resolve({ statusCode: res.statusCode, body: data });
        });
      });

      req.on('error', function(err) {
        reject(err);
      });

      req.write(requestBody);
      req.end();
    });

    if (result.statusCode !== 200) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          content: [{ text: 'I apologise, I am experiencing a technical issue. Please email us at axonarchives@gmail.com or try again shortly.' }]
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: result.body
    };

  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        content: [{ text: 'I apologise, something went wrong. Please email us at axonarchives@gmail.com' }]
      })
    };
  }
};

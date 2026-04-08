const https = require('https');

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

  try {
    var body = JSON.parse(event.body);
    console.log('Received messages:', JSON.stringify(body.messages));

    var systemPrompt = 'You are the studio assistant for AXON ARCHIVES, a premium architecture and visualization studio based in Lagos, Nigeria. Be professional, warm and knowledgeable. SERVICES: 3D Exterior View $80/view, 3D Interior View $80/view, Presentation Plan Drawing from $150, Architectural Construction Drawing from $250, Approval Drawing from $250, Animation $200/min, 7D Panoramic View $200/pano. Architectural Design and Interior Design are consultation-based. WORKFLOW: Client sends brief, provides survey plan for new designs or CAD files for 3D work, studio agrees fee, sends invoice, client pays 80% deposit, work begins, balance on delivery. CONTACT: axonarchives@gmail.com, Lagos Nigeria, serving clients globally.';

    var requestBody = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: systemPrompt,
      messages: body.messages
    });

    console.log('Calling Anthropic API...');

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
        console.log('API status code:', res.statusCode);
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
          console.log('API response:', data.substring(0, 200));
          resolve({ statusCode: res.statusCode, body: data });
        });
      });

      req.on('error', function(err) {
        console.log('Request error:', err.message);
        reject(err);
      });

      req.write(requestBody);
      req.end();
    });

    console.log('API call complete, status:', result.statusCode);

    if (result.statusCode !== 200) {
      console.log('API error response:', result.body);
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
    console.log('Function error:', err.message);
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

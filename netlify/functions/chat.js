const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    var body = JSON.parse(event.body);

    var systemPrompt = 'You are the studio assistant for AXON ARCHIVES, a premium architecture and visualization studio based in Lagos, Nigeria. You represent the brand with professionalism, warmth, and expertise. ABOUT AXON ARCHIVES: Based in Lagos, Nigeria, serving clients globally. Founded by (Iyanuoluwa & Tosanyemi), they are architects and interior designers. Specializes in architectural design, interior design, 3D visualization, animations, illustrated floor plans, and site plans. Brand identity: luxury, precision, restrained elegance. SERVICES & PRICING: Architectural Design & Concept - consultation-based. Interior Design - consultation-based. Design Consultancy - consultation-based. Architectural Construction Drawing from $250. Presentation Plan Drawing from $150. Approval Drawing from $250. 3D Exterior View $80 per view. 3D Interior View $80 per view. Animation $200 per minute. 7D Panoramic View $200 per panorama. WORKFLOW: Client submits a brief. For new designs client must provide survey plan or land measurements. For 3D work client provides SketchUp models or CAD files. Studio reviews and agrees on fee. Invoice issued. Client pays 80% deposit. Work begins. Balance due on delivery. CONTACT: Email axonarchives@gmail.com. Website axonarchives.studio. Lagos Nigeria. TONE: Professional, warm, knowledgeable, luxury studio representative. Be helpful and informative about architecture and design. Guide clients toward enquiry or payment. Keep responses concise.';

    var requestBody = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: systemPrompt,
      messages: body.messages
    });

    var result = await new Promise(function(resolve, reject) {
      var options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'x-api-key': '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',
          'anthropic-version': '2023-06-01'
        }
      };

      var req = https.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() { resolve(data); });
      });

      req.on('error', function(err) { reject(err); });
      req.write(requestBody);
      req.end();
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: result
    };

  } catch (err) {
    console.log('Error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
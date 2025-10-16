export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    // Placeholder for analytics processing
    return new Response(JSON.stringify({
        message: 'Analytics endpoint ready',
        timestamp: new Date().toISOString(),
        sports: ['Baseball', 'Football', 'Basketball', 'Track & Field']
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

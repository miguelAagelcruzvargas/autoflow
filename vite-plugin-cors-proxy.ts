import type { Plugin } from 'vite';

/**
 * Vite plugin to handle CORS proxy requests
 * Routes /api/proxy?url=<target> to the target URL
 */
export function corsProxyPlugin(): Plugin {
    return {
        name: 'cors-proxy',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                // Only handle /api/proxy requests
                if (!req.url?.startsWith('/api/proxy')) {
                    return next();
                }

                try {
                    // Extract target URL from query params
                    const url = new URL(req.url, `http://${req.headers.host}`);
                    const targetUrl = url.searchParams.get('url');

                    if (!targetUrl) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing url parameter' }));
                        return;
                    }

                    // Validate URL
                    let parsedUrl: URL;
                    try {
                        parsedUrl = new URL(targetUrl);
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid URL format' }));
                        return;
                    }

                    // Fetch the target URL
                    const response = await fetch(parsedUrl.toString(), {
                        method: req.method || 'GET',
                        headers: {
                            'User-Agent': 'AutoFlow-Pro/1.0'
                        }
                    });

                    // Copy response headers and add CORS headers
                    const headers: Record<string, string> = {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    };

                    // Copy content-type if present
                    const contentType = response.headers.get('content-type');
                    if (contentType) {
                        headers['Content-Type'] = contentType;
                    }

                    // Send response
                    res.writeHead(response.status, headers);

                    // Stream the response body
                    const body = await response.text();
                    res.end(body);

                } catch (error) {
                    console.error('Proxy error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Proxy request failed',
                        message: (error as Error).message
                    }));
                }
            });
        }
    };
}

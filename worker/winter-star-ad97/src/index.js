export default {
    async fetch(request, env) {
        const CLOUD_NAME = 'dahfywnc2';
        const API_KEY = env.CLOUDINARY_API_KEY;
        const API_SECRET = env.CLOUDINARY_API_SECRET;
        const FOLDER_NAME = 'Test'; // Specify your folder name

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`;
        const auth = 'Basic ' + btoa(API_KEY + ':' + API_SECRET);

        const params = {
            expression: `folder="${FOLDER_NAME}"`,
            max_results: 500, // Adjust as needed
        };

        const allowedOrigins = [
            "http://localhost:8788", // Local Wrangler Pages Dev
            "https://johncollins-art.co.uk" // Production Site
        ];

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: auth,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                return new Response('Error fetching images from Cloudinary', { status: 500 });
            }

            const data = await response.json();
            const images = data.resources.map((resource) => resource.secure_url);

            const origin = request.headers.get("Origin");
            const corsHeaders = {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "null",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            };

            return new Response(JSON.stringify(images), { headers: corsHeaders });

        } catch {
            return new Response('Internal Server Error', { status: 500 });
        }
    }
};

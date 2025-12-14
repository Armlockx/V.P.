// Configuração do Supabase
const SUPABASE_URL = 'https://esvjyjnyrmysvylnszjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmp5am55cm15c3Z5bG5zempkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzY2ODMsImV4cCI6MjA4MTMxMjY4M30.ZyEgF8y4cIdCPnlcfMOLt0fYMoZCJkXCdc6eqeF8xAA';

// Função para buscar vídeos do Supabase
async function fetchVideosFromSupabase() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/videos?select=*&order=order_index.asc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar vídeos');
        }

        const videos = await response.json();
        return videos.map(video => ({
            id: video.id,
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail,
            duration: video.duration
        }));
    } catch (error) {
        console.error('Erro ao buscar vídeos do Supabase:', error);
        // Retorna lista vazia em caso de erro
        return [];
    }
}

// Função para adicionar um novo vídeo
async function addVideoToSupabase(videoData) {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/videos`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    title: videoData.title,
                    url: videoData.url,
                    thumbnail: videoData.thumbnail || null,
                    duration: videoData.duration,
                    order_index: videoData.order_index || 0
                })
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao adicionar vídeo');
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao adicionar vídeo:', error);
        throw error;
    }
}

// Exportar funções
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fetchVideosFromSupabase, addVideoToSupabase };
}


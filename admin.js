// Script do Painel de Administração
(function() {
    'use strict';

    // Variáveis globais
    let supabaseClient = null;
    let currentUser = null;
    let isAdmin = false;

    // Elementos do DOM
    const adminLoading = document.getElementById('adminLoading');
    const adminAccessDenied = document.getElementById('adminAccessDenied');
    const adminDashboard = document.getElementById('adminDashboard');
    const adminBackBtn = document.getElementById('adminBackBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminUserInfo = document.getElementById('adminUserInfo');
    const adminVideosList = document.getElementById('adminVideosList');
    const adminUsersList = document.getElementById('adminUsersList');
    const adminAdminsList = document.getElementById('adminAdminsList');
    const adminStatsGrid = document.getElementById('adminStatsGrid');
    const refreshVideosBtn = document.getElementById('refreshVideosBtn');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');
    const deleteVideoBtn = document.getElementById('deleteVideoBtn');
    const editVideoBtn = document.getElementById('editVideoBtn');
    const addVideoBtn = document.getElementById('addVideoBtn');
    const usersSearchInput = document.getElementById('usersSearchInput');
    const videosSearchInput = document.getElementById('videosSearchInput');
    const videoEditModal = document.getElementById('videoEditModal');
    const videoEditForm = document.getElementById('videoEditForm');
    const videoModalClose = document.getElementById('videoModalClose');
    const videoModalCancel = document.getElementById('videoModalCancel');
    const videoModalTitle = document.getElementById('videoModalTitle');
    const editVideoId = document.getElementById('editVideoId');
    const editVideoTitle = document.getElementById('editVideoTitle');
    const editVideoUrl = document.getElementById('editVideoUrl');
    const editVideoThumbnail = document.getElementById('editVideoThumbnail');
    const editVideoDuration = document.getElementById('editVideoDuration');
    const editVideoOrder = document.getElementById('editVideoOrder');
    const editVideoUserId = document.getElementById('editVideoUserId');

    // Configuração do Supabase
    const SUPABASE_URL = typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url ? SUPABASE_CONFIG.url : '';
    const SUPABASE_ANON_KEY = typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.anonKey ? SUPABASE_CONFIG.anonKey : '';

    // Inicializar Supabase
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        }
        return false;
    }

    // Verificar se usuário é admin
    async function checkAdminStatus() {
        try {
            if (!supabaseClient) {
                throw new Error('Cliente Supabase não inicializado');
            }

            // Verificar sessão
            const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
            if (sessionError || !session) {
                console.error('Erro ao verificar sessão:', sessionError);
                return false;
            }

            currentUser = session.user;

            // Verificar status admin usando RPC
            const { data: isAdminData, error: rpcError } = await supabaseClient.rpc('check_user_admin');
            
            if (rpcError) {
                console.error('Erro ao verificar admin:', rpcError);
                // Fallback: buscar direto da tabela
                const { data: profile, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', currentUser.id)
                    .single();
                
                if (profileError) {
                    console.error('Erro ao buscar perfil:', profileError);
                    return false;
                }
                
                isAdmin = profile?.is_admin === true;
            } else {
                isAdmin = isAdminData === true;
            }

            return isAdmin;
        } catch (error) {
            console.error('Erro ao verificar status admin:', error);
            return false;
        }
    }

    // Carregar informações do usuário
    async function loadUserInfo() {
        try {
            if (!currentUser) return;

            const { data: profile, error } = await supabaseClient.rpc('get_user_profile');
            
            if (error) {
                // Fallback: buscar direto da tabela
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();
                
                if (profileError) {
                    console.error('Erro ao buscar perfil:', profileError);
                    return;
                }
                
                displayUserInfo(profileData);
            } else {
                displayUserInfo(profile);
            }
        } catch (error) {
            console.error('Erro ao carregar informações do usuário:', error);
        }
    }

    // Exibir informações do usuário
    function displayUserInfo(profile) {
        if (!profile) return;

        const avatarHtml = profile.avatar_url 
            ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.username)}" class="admin-user-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        
        const avatarPlaceholder = !profile.avatar_url 
            ? `<div class="admin-user-avatar-placeholder">${escapeHtml((profile.username || 'U').charAt(0).toUpperCase())}</div>`
            : '';

        adminUserInfo.innerHTML = `
            <div class="admin-user-card">
                ${avatarHtml}
                ${avatarPlaceholder}
                <div class="admin-user-details">
                    <h3>${escapeHtml(profile.username || 'Usuário')}</h3>
                    <p class="admin-user-email">${escapeHtml(profile.email || currentUser.email || '')}</p>
                    <p class="admin-user-badge ${(profile.is_admin || profile.admin) ? 'admin-badge-active' : 'admin-badge-inactive'}">
                        ${(profile.is_admin || profile.admin) ? '👑 Administrador' : '👤 Usuário'}
                    </p>
                </div>
            </div>
        `;
    }

    // Carregar lista de vídeos
    async function loadVideos(searchTerm = '') {
        try {
            let query = supabaseClient
                .from('videos')
                .select('*')
                .order('order_index', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            const { data: videos, error } = await query;

            if (error) {
                console.error('Erro ao carregar vídeos:', error);
                adminVideosList.innerHTML = '<p class="admin-error">Erro ao carregar vídeos.</p>';
                return;
            }

            if (!videos || videos.length === 0) {
                adminVideosList.innerHTML = '<p class="admin-empty">Nenhum vídeo encontrado.</p>';
                return;
            }

            adminVideosList.innerHTML = videos.map((video, index) => `
                <div class="admin-video-item" data-video-id="${video.id}">
                    <input type="radio" name="selectedVideo" id="video-${video.id}" value="${video.id}" class="admin-video-radio">
                    <label for="video-${video.id}" class="admin-video-label">
                        <div class="admin-video-thumbnail">
                            ${video.thumbnail ? `<img src="${escapeHtml(video.thumbnail)}" alt="${escapeHtml(video.title)}" onerror="this.parentElement.innerHTML='🎬';">` : '🎬'}
                            ${video.duration ? `<div class="admin-video-duration">${escapeHtml(video.duration)}</div>` : ''}
                        </div>
                        <div class="admin-video-info">
                            <h4>${escapeHtml(video.title || 'Sem título')}</h4>
                            <p class="admin-video-meta">
                                <span>Views: ${video.views || 0}</span> | 
                                <span>Tempo assistido: ${formatWatchTime(video.watch_time || 0)}</span> |
                                <span>Ordem: ${video.order_index !== null && video.order_index !== undefined ? video.order_index : 'N/A'}</span>
                            </p>
                            <p class="admin-video-meta-secondary">
                                Criado em: ${formatDate(video.created_at)}
                            </p>
                        </div>
                    </label>
                </div>
            `).join('');

            // Adicionar listener para habilitar botões e atualizar preview
            document.querySelectorAll('input[name="selectedVideo"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    deleteVideoBtn.disabled = false;
                    editVideoBtn.disabled = false;
                    updateVideoPreview(radio.value);
                });
            });
        } catch (error) {
            console.error('Erro ao carregar vídeos:', error);
            adminVideosList.innerHTML = '<p class="admin-error">Erro ao carregar vídeos.</p>';
        }
    }

    // Atualizar preview do vídeo
    async function updateVideoPreview(videoId) {
        try {
            const { data: video, error } = await supabaseClient
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error || !video) {
                console.error('Erro ao buscar vídeo para preview:', error);
                hideVideoPreview();
                return;
            }

            // Mostrar preview
            const previewContent = document.getElementById('previewVideoContent');
            const previewPlaceholder = document.querySelector('.admin-preview-placeholder');
            
            if (previewContent && previewPlaceholder) {
                previewPlaceholder.style.display = 'none';
                previewContent.style.display = 'flex';
            }

            // Atualizar dados do preview
            const previewThumbnail = document.getElementById('previewThumbnail');
            const previewDuration = document.getElementById('previewDuration');
            const previewTitle = document.getElementById('previewTitle');
            const previewViews = document.getElementById('previewViews');
            const previewWatchTime = document.getElementById('previewWatchTime');
            const previewOrder = document.getElementById('previewOrder');
            const previewCreatedAt = document.getElementById('previewCreatedAt');
            const previewUrl = document.getElementById('previewUrl');

            if (previewThumbnail) {
                previewThumbnail.src = video.thumbnail || '';
                previewThumbnail.alt = escapeHtml(video.title || 'Sem thumbnail');
            }

            if (previewDuration) {
                previewDuration.textContent = video.duration || 'N/A';
                previewDuration.style.display = video.duration ? 'block' : 'none';
            }

            if (previewTitle) {
                previewTitle.textContent = escapeHtml(video.title || 'Sem título');
            }

            if (previewViews) {
                previewViews.textContent = (video.views || 0).toLocaleString();
            }

            if (previewWatchTime) {
                previewWatchTime.textContent = formatWatchTime(video.watch_time || 0);
            }

            if (previewOrder) {
                previewOrder.textContent = video.order_index !== null && video.order_index !== undefined ? video.order_index : 'N/A';
            }

            if (previewCreatedAt) {
                previewCreatedAt.textContent = formatDate(video.created_at);
            }

            if (previewUrl) {
                previewUrl.textContent = escapeHtml(video.url || 'N/A');
                previewUrl.title = video.url || '';
            }
        } catch (error) {
            console.error('Erro ao atualizar preview:', error);
            hideVideoPreview();
        }
    }

    // Ocultar preview
    function hideVideoPreview() {
        const previewContent = document.getElementById('previewVideoContent');
        const previewPlaceholder = document.querySelector('.admin-preview-placeholder');
        
        if (previewContent && previewPlaceholder) {
            previewContent.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
        }
    }

    // Abrir modal para adicionar vídeo
    function openAddVideoModal() {
        editVideoId.value = '';
        editVideoTitle.value = '';
        editVideoUrl.value = '';
        editVideoThumbnail.value = '';
        editVideoDuration.value = '';
        editVideoOrder.value = '0';
        editVideoUserId.value = '';
        videoModalTitle.textContent = 'Adicionar Novo Vídeo';
        videoEditModal.style.display = 'flex';
    }

    // Abrir modal para editar vídeo
    async function openEditVideoModal() {
        const selectedRadio = document.querySelector('input[name="selectedVideo"]:checked');
        if (!selectedRadio) return;

        const videoId = selectedRadio.value;
        
        try {
            const { data: video, error } = await supabaseClient
                .from('videos')
                .select('*')
                .eq('id', videoId)
                .single();

            if (error) {
                console.error('Erro ao buscar vídeo:', error);
                alert('Erro ao carregar dados do vídeo.');
                return;
            }

            // Preencher formulário
            editVideoId.value = video.id;
            editVideoTitle.value = video.title || '';
            editVideoUrl.value = video.url || '';
            editVideoThumbnail.value = video.thumbnail || '';
            editVideoDuration.value = video.duration || '';
            editVideoOrder.value = video.order_index !== null && video.order_index !== undefined ? video.order_index : 0;
            editVideoUserId.value = video.user_id || '';

            videoModalTitle.textContent = 'Editar Vídeo';
            videoEditModal.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao abrir modal de edição:', error);
            alert('Erro ao carregar dados do vídeo.');
        }
    }

    // Salvar vídeo (criar ou atualizar)
    async function saveVideo(videoData) {
        try {
            if (videoData.id) {
                // Atualizar vídeo existente
                const { error } = await supabaseClient
                    .from('videos')
                    .update({
                        title: videoData.title,
                        url: videoData.url,
                        thumbnail: videoData.thumbnail,
                        duration: videoData.duration || null,
                        order_index: videoData.order_index !== '' ? parseInt(videoData.order_index) : null,
                        user_id: videoData.user_id || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', videoData.id);

                if (error) {
                    console.error('Erro ao atualizar vídeo:', error);
                    throw error;
                }

                return { success: true, message: 'Vídeo atualizado com sucesso!' };
            } else {
                // Criar novo vídeo
                const { error } = await supabaseClient
                    .from('videos')
                    .insert({
                        title: videoData.title,
                        url: videoData.url,
                        thumbnail: videoData.thumbnail,
                        duration: videoData.duration || null,
                        order_index: videoData.order_index !== '' ? parseInt(videoData.order_index) : null,
                        user_id: videoData.user_id || currentUser?.id || null,
                        views: 0,
                        watch_time: 0
                    });

                if (error) {
                    console.error('Erro ao criar vídeo:', error);
                    throw error;
                }

                return { success: true, message: 'Vídeo criado com sucesso!' };
            }
        } catch (error) {
            console.error('Erro ao salvar vídeo:', error);
            return { success: false, message: 'Erro ao salvar vídeo: ' + (error.message || 'Erro desconhecido') };
        }
    }

    // Excluir vídeo selecionado
    async function deleteSelectedVideo() {
        const selectedRadio = document.querySelector('input[name="selectedVideo"]:checked');
        if (!selectedRadio) {
            alert('Por favor, selecione um vídeo para excluir.');
            return;
        }

        const videoId = selectedRadio.value;
        const videoItem = selectedRadio.closest('.admin-video-item');
        if (!videoItem) {
            alert('Erro ao encontrar o item do vídeo.');
            return;
        }

        const videoTitle = videoItem.querySelector('h4')?.textContent || 'vídeo';

        if (!confirm(`Tem certeza que deseja excluir o vídeo "${videoTitle}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            console.log('Tentando excluir vídeo com ID:', videoId);
            
            // Tentar usar função RPC primeiro (mais seguro)
            const { data: rpcData, error: rpcError } = await supabaseClient.rpc('delete_video', {
                video_id: videoId
            });
            
            if (rpcError) {
                console.warn('RPC não disponível, tentando DELETE direto:', rpcError);
                
                // Fallback: tentar DELETE direto
                const { data, error } = await supabaseClient
                    .from('videos')
                    .delete()
                    .eq('id', videoId)
                    .select();

                if (error) {
                    console.error('Erro ao excluir vídeo:', error);
                    alert('Erro ao excluir vídeo: ' + (error.message || 'Erro desconhecido') + '\n\nCertifique-se de que você tem permissões de administrador e que a política RLS está configurada corretamente.');
                    return;
                }

                console.log('Vídeo excluído com sucesso (DELETE direto):', data);
            } else {
                console.log('Vídeo excluído com sucesso (RPC):', rpcData);
            }
            
            // Ocultar preview
            hideVideoPreview();
            
            // Desabilitar botões
            deleteVideoBtn.disabled = true;
            editVideoBtn.disabled = true;
            
            // Recarregar lista de vídeos
            const searchTerm = videosSearchInput?.value || '';
            await loadVideos(searchTerm);
            
            alert('Vídeo excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir vídeo:', error);
            alert('Erro ao excluir vídeo: ' + (error.message || 'Erro desconhecido'));
        }
    }

    // Carregar lista de usuários
    async function loadUsers(searchTerm = '') {
        try {
            let query = supabaseClient
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (searchTerm) {
                query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            }

            const { data: users, error } = await query;

            if (error) {
                console.error('Erro ao carregar usuários:', error);
                adminUsersList.innerHTML = '<p class="admin-error">Erro ao carregar usuários.</p>';
                if (adminAdminsList) {
                    adminAdminsList.innerHTML = '<p class="admin-error">Erro ao carregar usuários.</p>';
                }
                return;
            }

            // Separar usuários normais e administradores
            const normalUsers = users.filter(user => !(user.is_admin || user.admin));
            const adminUsers = users.filter(user => (user.is_admin || user.admin));

            // Função para renderizar um usuário
            const renderUser = (user) => `
                <div class="admin-user-item">
                    <div class="admin-user-item-avatar">
                        ${user.avatar_url 
                            ? `<img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.username)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                            : ''
                        }
                        ${!user.avatar_url 
                            ? `<div class="admin-user-item-avatar-placeholder">${escapeHtml((user.username || 'U').charAt(0).toUpperCase())}</div>`
                            : ''
                        }
                    </div>
                    <div class="admin-user-item-info">
                        <h4>${escapeHtml(user.username || 'Sem nome')}</h4>
                        <p>${escapeHtml(user.email || 'Sem email')}</p>
                        <p class="admin-user-item-meta">
                            Criado em: ${formatDate(user.created_at)} | 
                            Status: ${(user.is_admin || user.admin) ? '<span class="admin-badge-text">👑 Admin</span>' : '<span>👤 Usuário</span>'}
                        </p>
                    </div>
                </div>
            `;

            // Renderizar usuários normais
            if (normalUsers.length === 0) {
                adminUsersList.innerHTML = '<p class="admin-empty">Nenhum usuário encontrado.</p>';
            } else {
                adminUsersList.innerHTML = normalUsers.map(renderUser).join('');
            }

            // Renderizar administradores
            if (adminAdminsList) {
                if (adminUsers.length === 0) {
                    adminAdminsList.innerHTML = '<p class="admin-empty">Nenhum administrador encontrado.</p>';
                } else {
                    adminAdminsList.innerHTML = adminUsers.map(renderUser).join('');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            adminUsersList.innerHTML = '<p class="admin-error">Erro ao carregar usuários.</p>';
        }
    }

    // Carregar estatísticas
    async function loadStatistics() {
        try {
            // Estatísticas de vídeos
            const { count: videosCount } = await supabaseClient
                .from('videos')
                .select('*', { count: 'exact', head: true });

            const { data: videosStats } = await supabaseClient
                .from('videos')
                .select('views, watch_time');

            const totalViews = videosStats?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
            const totalWatchTime = videosStats?.reduce((sum, v) => sum + (v.watch_time || 0), 0) || 0;

            // Estatísticas de usuários
            const { count: usersCount } = await supabaseClient
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: adminsCount } = await supabaseClient
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('is_admin', true);

            adminStatsGrid.innerHTML = `
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${videosCount || 0}</div>
                    <div class="admin-stat-label">Total de Vídeos</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${totalViews.toLocaleString()}</div>
                    <div class="admin-stat-label">Total de Visualizações</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${formatWatchTime(totalWatchTime)}</div>
                    <div class="admin-stat-label">Tempo Total Assistido</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${usersCount || 0}</div>
                    <div class="admin-stat-label">Total de Usuários</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${adminsCount || 0}</div>
                    <div class="admin-stat-label">Administradores</div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            adminStatsGrid.innerHTML = '<p class="admin-error">Erro ao carregar estatísticas.</p>';
        }
    }

    // Utilitários
    function escapeHtml(text) {
        if (text == null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    function formatWatchTime(seconds) {
        if (!seconds || seconds < 0) return '0s';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    // Event Listeners
    if (adminBackBtn) {
        adminBackBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async () => {
            if (supabaseClient) {
                await supabaseClient.auth.signOut();
            }
            window.location.href = 'index.html';
        });
    }

    if (refreshVideosBtn) {
        refreshVideosBtn.addEventListener('click', () => loadVideos(videosSearchInput?.value || ''));
    }

    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', () => loadUsers(usersSearchInput.value));
    }

    if (deleteVideoBtn) {
        deleteVideoBtn.addEventListener('click', deleteSelectedVideo);
    }

    if (editVideoBtn) {
        editVideoBtn.addEventListener('click', openEditVideoModal);
    }

    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', openAddVideoModal);
    }

    if (videoModalClose) {
        videoModalClose.addEventListener('click', () => {
            videoEditModal.style.display = 'none';
        });
    }

    if (videoModalCancel) {
        videoModalCancel.addEventListener('click', () => {
            videoEditModal.style.display = 'none';
        });
    }

    if (videoEditModal) {
        videoEditModal.addEventListener('click', (e) => {
            if (e.target === videoEditModal || e.target.classList.contains('admin-modal-overlay')) {
                videoEditModal.style.display = 'none';
            }
        });
    }

    if (videoEditForm) {
        videoEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const videoData = {
                id: editVideoId.value || null,
                title: editVideoTitle.value.trim(),
                url: editVideoUrl.value.trim(),
                thumbnail: editVideoThumbnail.value.trim(),
                duration: editVideoDuration.value.trim() || null,
                order_index: editVideoOrder.value.trim(),
                user_id: editVideoUserId.value.trim() || null
            };

            // Validação básica
            if (!videoData.title || !videoData.url || !videoData.thumbnail) {
                alert('Por favor, preencha todos os campos obrigatórios (Título, URL e Thumbnail).');
                return;
            }

            // Validar formato de duração
            if (videoData.duration && !/^[0-9]+:[0-5][0-9]$/.test(videoData.duration)) {
                alert('Formato de duração inválido. Use o formato MM:SS (ex: 3:22)');
                return;
            }

            // Desabilitar botão durante o salvamento
            const saveBtn = document.getElementById('videoModalSave');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Salvando...';
            }

            const result = await saveVideo(videoData);

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Salvar';
            }

            if (result.success) {
                alert(result.message);
                videoEditModal.style.display = 'none';
                loadVideos(videosSearchInput?.value || '');
            } else {
                alert(result.message);
            }
        });
    }

    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', (e) => {
            loadUsers(e.target.value);
        });
    }

    if (videosSearchInput) {
        videosSearchInput.addEventListener('input', (e) => {
            loadVideos(e.target.value);
        });
    }

    // Inicialização
    async function init() {
        if (!initSupabase()) {
            console.error('Erro ao inicializar Supabase');
            adminLoading.style.display = 'none';
            adminAccessDenied.style.display = 'flex';
            return;
        }

        const adminStatus = await checkAdminStatus();
        
        adminLoading.style.display = 'none';

        if (!adminStatus) {
            adminAccessDenied.style.display = 'flex';
            return;
        }

        adminDashboard.style.display = 'block';
        await Promise.all([
            loadUserInfo(),
            loadVideos(''),
            loadUsers(''),
            loadStatistics()
        ]);
        
        // Ocultar preview inicialmente
        hideVideoPreview();
    }

    // Iniciar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


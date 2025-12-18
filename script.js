// Aguardar DOM e Supabase estarem prontos antes de inicializar
(function() {
    'use strict';
    
    // Variáveis globais
    let video, playPause, progress, progressContainer, volume, time, fullscreen, player;
    let queueMenu, queueList, queueToggle, queueClose, videoTitle, queueBadge, queueCount, queueSearch;
    let uploadBtn; // Botão de upload - precisa ser acessível globalmente
    let statsBtn, statsModal, statsCloseBtn; // Elementos do dashboard
    let videoLoader, loaderPercentage; // Loader
    let uploadModal; // Modal de upload
    let commandNotification, notificationIcon, notificationText; // Notificação de comando
    let authModal, loginForm, registerForm, authTabs, authClose; // Elementos de autenticação
    let logoutBtn; // Botão de logout
    let videoList = [];
    let currentVideoIndex = 0;
    let controlsTimeout = null;
    let controls;
    let supabaseClient = null;
    let isLoading = false;
    let isSeeking = false;
    let videoStatsTracking = {
        currentVideoId: null,
        startTime: null,
        lastUpdateTime: null,
        totalWatchTime: 0,
        viewIncremented: false,
        updateInterval: null
    };
    
    // Configuração do Supabase
    const SUPABASE_URL = 'https://esvjyjnyrmysvylnszjd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmp5am55cm15c3Z5bG5zempkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzY2ODMsImV4cCI6MjA4MTMxMjY4M30.ZyEgF8y4cIdCPnlcfMOLt0fYMoZCJkXCdc6eqeF8xAA';
    
    // Inicializar cliente Supabase com Auth
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        }
        return false;
    }
    
    // Função para inicializar elementos do DOM
    function initDOMElements() {
        video = document.getElementById("video");
        playPause = document.getElementById("playPause");
        progress = document.getElementById("progress");
        progressContainer = document.getElementById("progressContainer");
        volume = document.getElementById("volume");
        time = document.getElementById("time");
        fullscreen = document.getElementById("fullscreen");
        player = document.querySelector(".player");
        queueMenu = document.getElementById("queueMenu");
        queueList = document.getElementById("queueList");
        queueToggle = document.getElementById("queueToggle");
        queueClose = document.getElementById("queueClose");
        videoTitle = document.getElementById("videoTitle");
        queueBadge = document.getElementById("queueBadge");
        queueCount = document.getElementById("queueCount");
        queueSearch = document.getElementById("queueSearch");
        uploadBtn = document.getElementById("uploadBtn"); // Inicializar botão de upload
        statsBtn = document.getElementById("statsBtn"); // Botão de estatísticas
        statsModal = document.getElementById("statsModal"); // Modal de estatísticas
        statsCloseBtn = document.getElementById("statsCloseBtn"); // Botão de fechar modal
        videoLoader = document.getElementById("videoLoader"); // Loader
        loaderPercentage = document.getElementById("loaderPercentage"); // Porcentagem do loader
        commandNotification = document.getElementById("commandNotification"); // Notificação de comando
        notificationIcon = document.getElementById("notificationIcon"); // Ícone da notificação
        notificationText = document.getElementById("notificationText"); // Texto da notificação
        controls = document.querySelector(".controls");
        authModal = document.getElementById("authModal"); // Modal de autenticação
        loginForm = document.getElementById("loginForm"); // Formulário de login
        registerForm = document.getElementById("registerForm"); // Formulário de registro
        authTabs = document.querySelectorAll(".auth-tab"); // Tabs de autenticação
        authClose = document.getElementById("authClose"); // Botão de fechar modal
        logoutBtn = document.getElementById("logoutBtn"); // Botão de logout
        
        // Verificar se todos os elementos foram encontrados
        if (!video || !playPause || !player) {
            console.error('Elementos do DOM não encontrados');
            return false;
        }
        return true;
    }
    
    // Função para buscar vídeos do Supabase
    async function fetchVideosFromSupabase() {
        try {
            // Obter token de autenticação
            let authToken = SUPABASE_ANON_KEY;
            if (supabaseClient) {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    authToken = session.access_token;
                }
            }
            
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/videos?select=*&order=order_index.asc`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${authToken}`,
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
                duration: video.duration,
                views: video.views || 0,
                watch_time: video.watch_time || 0
            }));
        } catch (error) {
            console.error('Erro ao buscar vídeos do Supabase:', error);
            return [];
        }
    }

    // Carregar vídeos do Supabase ao iniciar
    async function loadVideosFromDatabase() {
        // Salvar estado atual antes de recarregar
        const previousVideoId = videoList.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < videoList.length 
            ? videoList[currentVideoIndex]?.id 
            : null;
        const previousUrl = video && video.src ? video.src : null;
        const wasPlaying = video && !video.paused;
        const currentTime = video ? video.currentTime : 0;
        
        videoList = await fetchVideosFromSupabase();
        
        if (videoList.length > 0) {
            updateQueueDisplay();
            updateQueueCount();
            
            // Tentar manter o vídeo atual se ainda existir
            if (previousVideoId && previousUrl) {
                const sameVideoIndex = videoList.findIndex(v => v.id === previousVideoId);
                if (sameVideoIndex >= 0) {
                    currentVideoIndex = sameVideoIndex;
                    // Se o vídeo já está carregado e é o mesmo, apenas atualizar display
                    if (video.src === previousUrl || video.src === videoList[sameVideoIndex].url) {
                        updateVideoTitle();
                        // Restaurar tempo se necessário (com margem de erro de 2 segundos)
                        if (currentTime > 0 && Math.abs(video.currentTime - currentTime) > 2) {
                            video.currentTime = currentTime;
                        }
                        // Restaurar estado de play se estava tocando
                        if (wasPlaying && video.paused) {
                            video.play().catch(() => {});
                        }
                        return; // Não recarregar o vídeo
                    } else {
                        // URL mudou, carregar novo vídeo
                        loadVideo(sameVideoIndex);
                    }
                } else {
                    // Vídeo anterior não existe mais, carregar primeiro
                    loadVideo(0);
                }
            } else {
                // Primeira vez carregando ou não havia vídeo anterior
                loadVideo(0);
            }
        } else {
            console.warn('Nenhum vídeo encontrado no banco de dados');
            document.title = "V.P. Player";
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${min}:${sec}`;
    }

    function loadVideo(index) {
        if (index < 0 || index >= videoList.length) return;
        
        // Parar rastreamento do vídeo anterior
        stopVideoStatsTracking();
        
        currentVideoIndex = index;
        const selectedVideo = videoList[index];
        
        // Resetar estado de rastreamento para o novo vídeo
        videoStatsTracking.viewIncremented = false;
        
        // Mostrar loader
        showLoader("🕐");
        
        video.src = selectedVideo.url;
        video.load();
        updateQueueDisplay();
        updateVideoTitle();
        
        if (!video.paused) {
            video.play();
        }
    }

    // Funções para controlar o loader
    function showLoader(text = "") {
        if (videoLoader) {
            videoLoader.classList.add("active");
            isLoading = true;
            if (loaderPercentage && text) {
                loaderPercentage.textContent = text;
            }
        }
    }

    function hideLoader() {
        if (videoLoader) {
            videoLoader.classList.remove("active");
            isLoading = false;
            if (loaderPercentage) {
                loaderPercentage.textContent = "0%";
            }
        }
    }

    function updateLoaderProgress(percent) {
        if (loaderPercentage && isLoading) {
            loaderPercentage.textContent = `${Math.round(percent)}%`;
        }
    }

    function updateQueueDisplay() {
        if (!queueList) return;
        
        queueList.innerHTML = "";
        
        const searchTerm = queueSearch ? queueSearch.value.toLowerCase() : "";
        const filteredVideos = videoList.filter(video => 
            video.title.toLowerCase().includes(searchTerm)
        );
        
        filteredVideos.forEach((videoItem, filteredIndex) => {
            const originalIndex = videoList.indexOf(videoItem);
            const listItem = document.createElement("li");
            listItem.className = "queue-item";
            if (originalIndex === currentVideoIndex) {
                listItem.classList.add("active");
            }
            
            // Formatar views
            const views = videoItem.views || 0;
            const viewsText = views === 0 ? '0 views' : views === 1 ? '1 view' : `${views.toLocaleString()} views`;
            
            // Criar HTML da thumbnail com tempo no canto inferior direito
            let thumbnailHtml;
            const duration = videoItem.duration || '0:00';
            if (videoItem.thumbnail) {
                thumbnailHtml = `
                    <img src="${videoItem.thumbnail}" alt="${videoItem.title}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.querySelector('.thumbnail-duration')?.remove(); this.parentElement.innerHTML='🎬';" />
                    <div class="thumbnail-duration">${duration}</div>
                `;
            } else {
                thumbnailHtml = '🎬';
            }
            
            listItem.innerHTML = `
                <div class="queue-item-thumbnail">${thumbnailHtml}</div>
                <div class="queue-item-info">
                    <div class="queue-item-title">${videoItem.title}</div>
                    <div class="queue-item-duration">${viewsText}</div>
                </div>
            `;
            
            listItem.onclick = () => {
                loadVideo(originalIndex);
                if (video.paused) {
                    video.play();
                    playPause.textContent = "⏸";
                    playPause.setAttribute("data-icon", "⏸");
                }
                if (queueMenu) queueMenu.classList.remove("open");
                if (queueToggle) queueToggle.classList.remove("active");
                document.body.classList.remove("menu-open");
                hideControls();
            };
            
            queueList.appendChild(listItem);
        });
        
        updateQueueCount();
    }

    function updateQueueCount() {
        if (queueBadge) queueBadge.textContent = videoList.length;
        if (queueCount) queueCount.textContent = `${videoList.length} ${videoList.length === 1 ? 'vídeo' : 'vídeos'}`;
    }

    function updateVideoTitle() {
        if (videoTitle && currentVideoIndex >= 0 && currentVideoIndex < videoList.length) {
            videoTitle.textContent = videoList[currentVideoIndex].title;
        }
        
        // Atualizar título da página
        if (currentVideoIndex >= 0 && currentVideoIndex < videoList.length && videoList[currentVideoIndex].title) {
            document.title = `V.P. Player - ${videoList[currentVideoIndex].title}`;
        } else {
            document.title = "V.P. Player";
        }
    }

    function showControls() {
        if (!controls || !videoTitle) return;
        
        controls.classList.remove("hidden");
        videoTitle.classList.remove("hidden");
        // Mostrar botão de logout com opacidade reduzida
        if (logoutBtn && logoutBtn.style.display !== "none") {
            logoutBtn.classList.remove("hidden");
        }
        // Mostrar cursor
        if (player) {
            player.classList.remove("cursor-hidden");
        }
        clearTimeout(controlsTimeout);
        // Não iniciar timeout se o mouse estiver sobre os controles ou botão de logout
        if (!isMouseOverControls()) {
            controlsTimeout = setTimeout(() => {
                hideControls();
            }, 2000);
        }
    }

    function hideControls() {
        if (!controls || !videoTitle) return;
        
        // Não esconder se o mouse estiver sobre os controles ou botão de logout
        if (isMouseOverControls()) {
            return;
        }
        
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            // Verificar novamente antes de esconder
            if (!isMouseOverControls()) {
                controls.classList.add("hidden");
                videoTitle.classList.add("hidden");
                // Esconder botão de logout junto com os controles
                if (logoutBtn && logoutBtn.style.display !== "none") {
                    logoutBtn.classList.add("hidden");
                }
                // Esconder cursor
                if (player) {
                    player.classList.add("cursor-hidden");
                }
            }
        }, 2000);
    }
    
    // Verificar se o mouse está sobre os controles ou botão de logout
    function isMouseOverControls() {
        // Verificar se existe um elemento com mouse sobre ele
        const hoveredElement = document.querySelector(':hover');
        if (!hoveredElement) return false;
        
        // Verificar se está sobre a barra de controles
        if (hoveredElement.closest('.controls') || hoveredElement.closest('.controls-row')) {
            return true;
        }
        
        // Verificar se está sobre o botão de logout
        if (hoveredElement.closest('.logout-btn')) {
            return true;
        }
        
        return false;
    }

    function updateVolumeProgress() {
        if (!volume) return;
        const percent = volume.value * 100;
        volume.style.setProperty("--volume-percent", percent + "%");
    }
    
    // Verificar se o mouse está sobre os controles ou botão de logout
    function isMouseOverControls() {
        // Verificar se existe um elemento com mouse sobre ele
        const hoveredElement = document.querySelector(':hover');
        if (!hoveredElement) return false;
        
        // Verificar se está sobre a barra de controles
        if (hoveredElement.closest('.controls') || hoveredElement.closest('.controls-row')) {
            return true;
        }
        
        // Verificar se está sobre o botão de logout
        if (hoveredElement.closest('.logout-btn')) {
            return true;
        }
        
        return false;
    }

    // Inicializar eventos e controles
    function initEventListeners() {
        if (!video || !playPause || !player) return;
        
        // Event listener para botão de logout
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await handleLogout();
            });
        }

playPause.onclick = () => {
    if (video.paused) {
        video.play();
        playPause.textContent = "⏸";
                playPause.setAttribute("data-icon", "⏸");
    } else {
        video.pause();
        playPause.textContent = "▶";
                playPause.setAttribute("data-icon", "▶");
    }
};

video.ontimeupdate = () => {
            if (!progress || !time) return;
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = percent + "%";
    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);
    time.textContent = `${current} / ${total}`;
};

        // Eventos de carregamento do vídeo
        video.addEventListener("loadstart", () => {
            showLoader("🕐");
        });

        video.addEventListener("loadedmetadata", () => {
            if (isLoading && !isSeeking) {
                updateLoaderProgress(30);
            }
        });

        video.addEventListener("loadeddata", () => {
            if (isLoading && !isSeeking) {
                updateLoaderProgress(60);
            }
        });

        video.addEventListener("progress", () => {
            if (isLoading && !isSeeking && video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                const duration = video.duration;
                if (duration > 0) {
                    const bufferedPercent = (bufferedEnd / duration) * 100;
                    updateLoaderProgress(Math.min(bufferedPercent, 90));
                }
            }
        });

        video.addEventListener("canplay", () => {
            if (isLoading && !isSeeking) {
                updateLoaderProgress(95);
            }
        });

        video.addEventListener("canplaythrough", () => {
            if (!isSeeking) {
                updateLoaderProgress(100);
                setTimeout(() => {
                    hideLoader();
                }, 300);
            }
        });

        video.addEventListener("waiting", () => {
            if (!isSeeking) {
                showLoader("🕐");
            }
        });

        video.addEventListener("playing", () => {
            if (!isSeeking) {
                hideLoader();
            }
        });

        // Eventos de seeking
        video.addEventListener("seeking", () => {
            isSeeking = true;
            showLoader("🔎");
        });

        video.addEventListener("seeked", () => {
            isSeeking = false;
            setTimeout(() => {
                hideLoader();
            }, 200);
        });

        if (progressContainer) {
progressContainer.onclick = (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
                const newTime = (clickX / width) * video.duration;

                // Mostrar loader ao fazer seek
                if (Math.abs(video.currentTime - newTime) > 1) {
                    showLoader("🔎");
                }

                video.currentTime = newTime;
            };
        }

        if (volume) {
volume.oninput = () => {
    video.volume = volume.value;
                updateVolumeProgress();
};
            volume.addEventListener("input", updateVolumeProgress);
            updateVolumeProgress();
        }

        if (fullscreen) {
fullscreen.onclick = () => {
    if (!document.fullscreenElement) {
                    player.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};
        }

        document.addEventListener("fullscreenchange", () => {
            if (fullscreen) {
                fullscreen.textContent = "⛶";
            }
        });

        video.onended = () => {
            // Parar rastreamento do vídeo atual
            stopVideoStatsTracking();
            
            if (currentVideoIndex < videoList.length - 1) {
                // Mostrar loader ao passar para próximo vídeo
                showLoader("Próximo vídeo...");
                loadVideo(currentVideoIndex + 1);
                video.play();
                playPause.textContent = "⏸";
                playPause.setAttribute("data-icon", "⏸");
            }
        };

        if (queueToggle) {
            queueToggle.onclick = (e) => {
                e.stopPropagation();
                const isOpen = queueMenu.classList.toggle("open");
                queueToggle.classList.toggle("active");
                document.body.classList.toggle("menu-open", isOpen);
                
                // Ajustar posição do menu e seta baseado na posição do botão
                if (isOpen && queueMenu) {
                    const toggleRect = queueToggle.getBoundingClientRect();
                    const menuWidth = 360;
                    // Posicionar menu bem à direita, alinhado com o botão
                    const menuRight = Math.max(10, window.innerWidth - toggleRect.right);
                    // Calcular offset da seta: centro do botão relativo à borda direita do menu
                    const toggleCenterX = toggleRect.left + toggleRect.width / 2;
                    const menuLeftEdge = window.innerWidth - menuRight - menuWidth;
                    const arrowOffset = toggleCenterX - menuLeftEdge;
                    
                    queueMenu.style.right = `${menuRight}px`;
                    queueMenu.style.setProperty('--arrow-offset', `${Math.max(20, Math.min(340, arrowOffset))}px`);
                }
                
                if (isOpen && queueSearch) {
                    queueSearch.focus();
                }
                // Mostrar/esconder botões quando o menu abre/fecha
                if (uploadBtn) {
                    uploadBtn.style.display = isOpen ? "flex" : "none";
                }
                if (statsBtn) {
                    statsBtn.style.display = isOpen ? "flex" : "none";
                }
                showControls();
            };
        }

        if (queueClose) {
            queueClose.onclick = () => {
                if (queueMenu) queueMenu.classList.remove("open");
                if (queueToggle) queueToggle.classList.remove("active");
                document.body.classList.remove("menu-open");
                // Esconder botões quando o menu fecha
                if (uploadBtn) {
                    uploadBtn.style.display = "none";
                }
                if (statsBtn) {
                    statsBtn.style.display = "none";
                }
                hideControls();
            };
        }

        if (queueSearch) {
            queueSearch.addEventListener("input", () => {
                updateQueueDisplay();
            });

            queueSearch.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    queueSearch.value = "";
                    updateQueueDisplay();
                    queueSearch.blur();
                }
            });
        }

        if (player) {
            player.addEventListener("mouseenter", () => {
                showControls();
            });
            
            // Mostrar controles ao passar mouse no botão de logout
            if (logoutBtn) {
                logoutBtn.addEventListener("mouseenter", () => {
                    showControls();
                });
                
                logoutBtn.addEventListener("mouseleave", () => {
                    // Só esconder se não estiver sobre os controles
                    setTimeout(() => {
                        if (!isMouseOverControls()) {
                            hideControls();
                        }
                    }, 100);
                });
            }
            
            // Manter controles visíveis quando mouse está sobre a barra de controles
            if (controls) {
                controls.addEventListener("mouseenter", () => {
                    showControls();
                });
                
                controls.addEventListener("mouseleave", () => {
                    // Só esconder se não estiver sobre o botão de logout
                    setTimeout(() => {
                        if (!isMouseOverControls()) {
                            hideControls();
                        }
                    }, 100);
                });
            }

        player.addEventListener("mouseleave", (e) => {
            const relatedTarget = e.relatedTarget;
            // Não esconder se o mouse estiver indo para os controles ou botão de logout
            if (relatedTarget && (relatedTarget.closest(".queue-menu") || relatedTarget.closest(".queue-toggle-btn") || relatedTarget.closest(".controls-row") || relatedTarget.closest(".logout-btn") || relatedTarget.closest(".controls"))) {
                return;
            }
            hideControls();
        });

            player.addEventListener("mousemove", () => {
                showControls();
            });

            let clickTimer = null;
            let isDoubleClick = false;

            player.addEventListener("click", (e) => {
                if (e.target.closest(".controls") || e.target.closest(".queue-menu") || e.target.closest(".queue-toggle-btn")) {
                    return;
                }
                
                if (isDoubleClick) {
                    isDoubleClick = false;
                    return;
                }
                
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    if (!isDoubleClick) {
                        if (video.paused) {
                            video.play();
                            playPause.textContent = "⏸";
                            playPause.setAttribute("data-icon", "⏸");
                        } else {
                            video.pause();
                            playPause.textContent = "▶";
                            playPause.setAttribute("data-icon", "▶");
                        }
                        showControls();
                    }
                }, 200);
            });

            player.addEventListener("dblclick", (e) => {
                if (e.target.closest(".controls") || e.target.closest(".queue-menu") || e.target.closest(".queue-toggle-btn")) {
                    return;
                }
                
                isDoubleClick = true;
                clearTimeout(clickTimer);
                
                if (!document.fullscreenElement) {
                    player.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                
                setTimeout(() => {
                    isDoubleClick = false;
                }, 300);
            });
        }

        // Botão agora está na barra de controles, não precisa de eventos separados de mouse

        if (queueMenu) {
            queueMenu.addEventListener("mouseenter", () => {
                showControls();
            });

            queueMenu.addEventListener("mouseleave", () => {
                hideControls();
            });
        }

        video.addEventListener("play", () => {
            console.log('Evento play disparado');
            hideControls();
            
            // Incrementar views na primeira vez que o vídeo toca
            if (videoList.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < videoList.length) {
                const currentVideo = videoList[currentVideoIndex];
                console.log('Vídeo atual:', currentVideo);
                if (currentVideo) {
                    // Incrementar views apenas na primeira vez
                    if (!videoStatsTracking.viewIncremented) {
                        console.log('Incrementando views para vídeo:', currentVideo.id, currentVideo.title);
                        incrementVideoViews(currentVideo.id);
                        videoStatsTracking.viewIncremented = true;
                    } else {
                        console.log('Views já incrementadas para este vídeo');
                    }
                    
                    // Iniciar/retomar rastreamento de tempo assistido
                    // Se já está rastreando o mesmo vídeo, apenas atualiza o lastUpdateTime
                    if (videoStatsTracking.currentVideoId === currentVideo.id) {
                        console.log('Retomando rastreamento para vídeo:', currentVideo.id);
                        videoStatsTracking.lastUpdateTime = Date.now();
                    } else {
                        console.log('Iniciando novo rastreamento para vídeo:', currentVideo.id);
                        startVideoStatsTracking(currentVideo.id);
                    }
                } else {
                    console.warn('currentVideo não encontrado');
                }
            } else {
                console.warn('videoList vazio ou currentVideoIndex inválido', {
                    videoListLength: videoList.length,
                    currentVideoIndex: currentVideoIndex
                });
            }
        });

        video.addEventListener("pause", () => {
            showControls();
            
            // Salvar tempo assistido quando pausar
            if (videoStatsTracking.currentVideoId && video) {
                const now = Date.now();
                const elapsedSeconds = (now - videoStatsTracking.lastUpdateTime) / 1000;
                if (elapsedSeconds > 0) {
                    updateVideoWatchTime(videoStatsTracking.currentVideoId, elapsedSeconds);
                    videoStatsTracking.lastUpdateTime = now;
                }
            }
        });

        showControls();
    }

    // Função para mostrar notificação de comando
    function showCommandNotification(icon, text = "") {
        if (!commandNotification || !notificationIcon || !notificationText) return;
        
        notificationIcon.textContent = icon;
        notificationText.textContent = text;
        
        commandNotification.classList.add("show");
        
        // Remover após 1.5 segundos
        setTimeout(() => {
            commandNotification.classList.remove("show");
        }, 1500);
    }

    // ==================== ATALHOS DE TECLADO ====================
    function initKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            // Ignorar se estiver digitando em um input, textarea ou se algum modal estiver aberto
            if (e.target.tagName === "INPUT" || 
                e.target.tagName === "TEXTAREA" || 
                (statsModal && statsModal.classList.contains("active")) ||
                (uploadModal && uploadModal.classList.contains("active"))) {
                return;
            }

            // Espaço: Play/Pause
            if (e.code === "Space") {
                e.preventDefault();
                if (video.paused) {
                    video.play();
                    if (playPause) {
                        playPause.textContent = "⏸";
                        playPause.setAttribute("data-icon", "⏸");
                    }
                    showCommandNotification("▶", "");
                } else {
                    video.pause();
                    if (playPause) {
                        playPause.textContent = "▶";
                        playPause.setAttribute("data-icon", "▶");
                    }
                    showCommandNotification("⏸", "");
                }
                showControls();
                return;
            }

            // F: Fullscreen
            if (e.code === "KeyF") {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    if (player) player.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
                showControls();
                return;
            }

            // M: Mudo
            if (e.code === "KeyM") {
                e.preventDefault();
                if (video.muted) {
                    video.muted = false;
                    if (volume) volume.value = video.volume;
                    const volumePercent = Math.round(video.volume * 100);
                    showCommandNotification("🔊", `${volumePercent}%`);
                } else {
                    video.muted = true;
                    showCommandNotification("🔇", "");
                }
                if (volume) updateVolumeProgress();
                showControls();
                return;
            }

            // Setas: Voltar/Avançar 10s
            if (e.code === "ArrowLeft") {
                e.preventDefault();
                if (video.duration) {
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    showCommandNotification("⏪", "-10s");
                    showControls();
                }
                return;
            }

            if (e.code === "ArrowRight") {
                e.preventDefault();
                if (video.duration) {
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    showCommandNotification("⏩", "+10s");
                    showControls();
                }
                return;
            }

            // ↑: Aumentar volume
            if (e.code === "ArrowUp") {
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.1);
                if (volume) volume.value = video.volume;
                video.muted = false;
                const volumePercent = Math.round(video.volume * 100);
                showCommandNotification("🔊", `${volumePercent}%`);
                updateVolumeProgress();
                showControls();
                return;
            }

            // ↓: Diminuir volume
            if (e.code === "ArrowDown") {
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.1);
                if (volume) volume.value = video.volume;
                const volumePercent = Math.round(video.volume * 100);
                showCommandNotification("🔉", `${volumePercent}%`);
                updateVolumeProgress();
                showControls();
                return;
            }

            // Números: Pular para posição (0-9 = 0% a 90%)
            const numKey = parseInt(e.key);
            if (!isNaN(numKey) && numKey >= 0 && numKey <= 9) {
                e.preventDefault();
                if (video.duration) {
                    const targetPercent = numKey * 10;
                    video.currentTime = (video.duration * targetPercent) / 100;
                    showControls();
                }
                return;
            }
        });
    }

    // Inicializar upload de vídeos
    function initUpload() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase não está disponível');
            return;
        }

        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // uploadBtn já foi inicializado em initDOMElements() como variável global
        uploadModal = document.getElementById("uploadModal");
        const uploadCloseBtn = document.getElementById("uploadCloseBtn");
        const uploadCancelBtn = document.getElementById("uploadCancelBtn");
        const uploadForm = document.getElementById("uploadForm");
        const videoFileInput = document.getElementById("videoFile");
        const thumbnailFileInput = document.getElementById("thumbnailFile");
        const videoTitleInput = document.getElementById("videoTitleInput");
        const videoPreview = document.getElementById("videoPreview");
        const thumbnailPreview = document.getElementById("thumbnailPreview");
        const videoDuration = document.getElementById("videoDuration");
        const durationText = document.getElementById("durationText");
        const uploadProgress = document.getElementById("uploadProgress");
        const uploadProgressFill = document.getElementById("uploadProgressFill");
        const uploadProgressText = document.getElementById("uploadProgressText");
        const uploadMessage = document.getElementById("uploadMessage");
        const uploadSubmitBtn = document.getElementById("uploadSubmitBtn");
        const videoFileText = document.getElementById("videoFileText");
        const thumbnailFileText = document.getElementById("thumbnailFileText");

        if (!uploadBtn || !uploadForm) return;

        let videoDurationSeconds = 0;

        if (uploadBtn) {
            uploadBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (uploadModal) {
                    uploadModal.classList.add("active");
                    document.body.style.overflow = "hidden";
                }
            });
            // Botão começa escondido, será mostrado quando o menu abrir
            uploadBtn.style.display = "none";
        }

        function closeUploadModal() {
            if (uploadModal) {
                uploadModal.classList.remove("active");
                document.body.style.overflow = "";
                resetUploadForm();
            }
        }

        function resetUploadForm() {
            if (uploadForm) uploadForm.reset();
            if (videoPreview) {
                videoPreview.innerHTML = "";
                videoPreview.style.display = "none";
            }
            if (thumbnailPreview) {
                thumbnailPreview.innerHTML = "";
                thumbnailPreview.style.display = "none";
            }
            if (videoDuration) videoDuration.style.display = "none";
            if (uploadProgress) uploadProgress.style.display = "none";
            if (uploadMessage) {
                uploadMessage.style.display = "none";
                uploadMessage.className = "upload-message";
            }
            videoDurationSeconds = 0;
            if (videoFileText) {
                videoFileText.textContent = "Selecione o arquivo de vídeo";
                videoFileText.classList.remove("has-file");
            }
            if (thumbnailFileText) {
                thumbnailFileText.textContent = "Selecione a imagem de thumbnail";
                thumbnailFileText.classList.remove("has-file");
            }
            if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
        }

        if (uploadCloseBtn) uploadCloseBtn.addEventListener("click", closeUploadModal);
        if (uploadCancelBtn) uploadCancelBtn.addEventListener("click", closeUploadModal);

        if (uploadModal) {
            uploadModal.addEventListener("click", (e) => {
                if (e.target === uploadModal) {
                    closeUploadModal();
                }
            });
        }

        if (videoFileInput) {
            videoFileInput.addEventListener("change", async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (videoFileText) {
                    videoFileText.textContent = file.name;
                    videoFileText.classList.add("has-file");
                }

                if (videoPreview) {
                    const video = document.createElement("video");
                    video.src = URL.createObjectURL(file);
                    video.controls = true;
                    video.style.width = "100%";
                    video.style.maxHeight = "300px";
                    
                    videoPreview.innerHTML = "";
                    videoPreview.appendChild(video);
                    videoPreview.style.display = "block";

                    if (videoDuration) {
                        videoDuration.style.display = "block";
                        if (durationText) durationText.textContent = "Calculando...";
                    }
                    
                    video.addEventListener("loadedmetadata", () => {
                        videoDurationSeconds = Math.floor(video.duration);
                        const minutes = Math.floor(videoDurationSeconds / 60);
                        const seconds = videoDurationSeconds % 60;
                        if (durationText) {
                            durationText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
                        }
                    });
                }
            });
        }

        if (thumbnailFileInput) {
            thumbnailFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (thumbnailFileText) {
                    thumbnailFileText.textContent = file.name;
                    thumbnailFileText.classList.add("has-file");
                }

                if (thumbnailPreview) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = document.createElement("img");
                        img.src = event.target.result;
                        img.style.width = "100%";
                        img.style.maxHeight = "200px";
                        img.style.objectFit = "contain";
                        
                        thumbnailPreview.innerHTML = "";
                        thumbnailPreview.appendChild(img);
                        thumbnailPreview.style.display = "block";
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        function formatDuration(seconds) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}:${secs.toString().padStart(2, "0")}`;
        }

        if (uploadForm) {
            uploadForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                // Verificar autenticação
                if (!supabaseClient) {
                    if (typeof supabase !== 'undefined') {
                        initSupabase();
                    } else {
                        if (uploadMessage) {
                            uploadMessage.textContent = "Erro: Supabase não está disponível. Recarregue a página.";
                            uploadMessage.className = "upload-message error";
                            uploadMessage.style.display = "block";
                        }
                        return;
                    }
                }
                
                // Verificar se usuário está autenticado
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (!session) {
                    if (uploadMessage) {
                        uploadMessage.textContent = "Erro: Você precisa estar logado para fazer upload de vídeos.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    closeUploadModal();
                    showAuthModal();
                    return;
                }

                if (videoTitleInput && !videoTitleInput.value.trim()) {
                    if (uploadMessage) {
                        uploadMessage.textContent = "Por favor, preencha o título do vídeo.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    return;
                }

                if (!videoFileInput || !videoFileInput.files[0]) {
                    if (uploadMessage) {
                        uploadMessage.textContent = "Por favor, selecione um arquivo de vídeo.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    return;
                }

                if (!thumbnailFileInput || !thumbnailFileInput.files[0]) {
                    if (uploadMessage) {
                        uploadMessage.textContent = "Por favor, selecione uma imagem de thumbnail.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    return;
                }

                if (videoDurationSeconds === 0) {
                    if (uploadMessage) {
                        uploadMessage.textContent = "Aguarde o cálculo da duração do vídeo.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    return;
                }

                if (uploadSubmitBtn) uploadSubmitBtn.disabled = true;
                if (uploadProgress) uploadProgress.style.display = "block";
                if (uploadMessage) uploadMessage.style.display = "none";

                try {
                    const videoFile = videoFileInput.files[0];
                    const thumbnailFile = thumbnailFileInput.files[0];
                    const title = videoTitleInput ? videoTitleInput.value.trim() : "";
                    const duration = formatDuration(videoDurationSeconds);

                    const videoFileName = `${Date.now()}_${videoFile.name}`;
                    const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;

                    if (uploadProgressFill && uploadProgressText) {
                        uploadProgressFill.style.width = "10%";
                        uploadProgressText.textContent = "10% - Enviando vídeo...";
                    }

                    const { data: videoData, error: videoError } = await supabaseClient.storage
                        .from("v-p-player")
                        .upload(`Videos/${videoFileName}`, videoFile, {
                            cacheControl: "3600",
                            upsert: false
                        });

                    if (videoError) {
                        throw new Error(`Erro ao fazer upload do vídeo: ${videoError.message}`);
                    }

                    if (uploadProgressFill && uploadProgressText) {
                        uploadProgressFill.style.width = "50%";
                        uploadProgressText.textContent = "50% - Enviando thumbnail...";
                    }

                    const { data: thumbnailData, error: thumbnailError } = await supabaseClient.storage
                        .from("v-p-player")
                        .upload(`Thumbnails/${thumbnailFileName}`, thumbnailFile, {
                            cacheControl: "3600",
                            upsert: false
                        });

                    if (thumbnailError) {
                        throw new Error(`Erro ao fazer upload da thumbnail: ${thumbnailError.message}`);
                    }

                    const { data: videoUrlData } = supabaseClient.storage
                        .from("v-p-player")
                        .getPublicUrl(`Videos/${videoFileName}`);

                    const { data: thumbnailUrlData } = supabaseClient.storage
                        .from("v-p-player")
                        .getPublicUrl(`Thumbnails/${thumbnailFileName}`);

                    const { data: videos } = await supabaseClient
                        .from("videos")
                        .select("order_index")
                        .order("order_index", { ascending: false })
                        .limit(1);

                    const nextOrderIndex = videos && videos.length > 0 ? videos[0].order_index + 1 : 1;

                    if (uploadProgressFill && uploadProgressText) {
                        uploadProgressFill.style.width = "80%";
                        uploadProgressText.textContent = "80% - Salvando no banco de dados...";
                    }

                    const { data: newVideo, error: dbError } = await supabaseClient
                        .from("videos")
                        .insert([
                            {
                                title: title,
                                url: videoUrlData.publicUrl,
                                thumbnail: thumbnailUrlData.publicUrl,
                                duration: duration,
                                order_index: nextOrderIndex
                            }
                        ])
                        .select()
                        .single();

                    if (dbError) {
                        throw new Error(`Erro ao salvar no banco de dados: ${dbError.message}`);
                    }

                    if (uploadProgressFill && uploadProgressText) {
                        uploadProgressFill.style.width = "100%";
                        uploadProgressText.textContent = "100% - Concluído!";
                    }
                    
                    if (uploadMessage) {
                        uploadMessage.textContent = "Vídeo adicionado com sucesso!";
                        uploadMessage.className = "upload-message success";
                        uploadMessage.style.display = "block";
                    }

                    setTimeout(async () => {
                        await loadVideosFromDatabase();
                        closeUploadModal();
                    }, 1500);

                } catch (error) {
                    console.error("Erro no upload:", error);
                    if (uploadMessage) {
                        uploadMessage.textContent = error.message || "Erro ao fazer upload do vídeo. Tente novamente.";
                        uploadMessage.className = "upload-message error";
                        uploadMessage.style.display = "block";
                    }
                    if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
                }
            });
        }
    }

    // ========== FUNÇÕES DE ESTATÍSTICAS ==========
    
    // Atualizar views no Supabase
    async function incrementVideoViews(videoId) {
        try {
            if (!videoId) {
                console.warn('incrementVideoViews: videoId não fornecido');
                return;
            }
            
            if (!supabaseClient) {
                console.warn('incrementVideoViews: supabaseClient não inicializado');
                return;
            }
            
            // Buscar views atuais
            const currentVideo = videoList.find(v => v.id === videoId);
            if (!currentVideo) {
                console.warn('incrementVideoViews: vídeo não encontrado no videoList', videoId);
                return;
            }
            
            const newViews = (currentVideo.views || 0) + 1;
            console.log(`Incrementando views para vídeo ${videoId}: ${currentVideo.views || 0} -> ${newViews}`);
            
            // Tentar atualizar usando incremento SQL via RPC primeiro (se disponível)
            // Se não funcionar, usar update normal
            let updateSuccess = false;
            
            // Tentar usar RPC para incremento atômico (mais seguro)
            // Só tenta se a função existir (evita 404)
            try {
                const { data: rpcData, error: rpcError } = await supabaseClient.rpc('increment_video_views', {
                    video_id: videoId
                });
                
                if (rpcError) {
                    // Se for 404, a função não existe - não tentar novamente
                    if (rpcError.code === 'P0001' || rpcError.message?.includes('404') || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
                        console.log('Função RPC não disponível, usando update normal');
                    } else {
                        console.warn('Erro ao chamar RPC:', rpcError);
                    }
                } else if (rpcData !== null) {
                    currentVideo.views = newViews;
                    console.log('Views incrementadas via RPC:', rpcData);
                    updateSuccess = true;
                }
            } catch (rpcErr) {
                // RPC não disponível, continuar com update normal
                if (rpcErr.message?.includes('404') || rpcErr.message?.includes('function')) {
                    // Função não existe, não logar como erro
                } else {
                    console.log('RPC não disponível, usando update normal');
                }
            }
            
            // Se RPC não funcionou, usar update normal
            if (!updateSuccess) {
                const { data, error } = await supabaseClient
                    .from('videos')
                    .update({ views: newViews })
                    .eq('id', videoId)
                    .select('*');
                
                if (error) {
                    console.error('Erro ao atualizar views no Supabase:', error);
                    updateSuccess = false;
                } else if (!data || data.length === 0) {
                    // Data vazio significa que RLS bloqueou ou registro não encontrado
                    console.warn('Update de views retornou array vazio - possível problema de RLS');
                    
                    // Tentar verificar se o registro existe e se temos permissão de leitura
                    const { data: checkData, error: checkError } = await supabaseClient
                        .from('videos')
                        .select('id, views')
                        .eq('id', videoId)
                        .single();
                    
                    if (checkError) {
                        console.error('Erro ao verificar registro:', checkError);
                    } else if (checkData) {
                        console.log('Registro existe e pode ser lido. Views atuais:', checkData.views);
                        console.warn('RLS está bloqueando UPDATE mas permite SELECT. Execute o script supabase_functions.sql no Supabase SQL Editor.');
                    }
                    
                    updateSuccess = false;
                } else {
                    currentVideo.views = newViews;
                    console.log('Views atualizadas com sucesso:', data);
                    updateSuccess = true;
                }
            }
            
            // Se ainda não funcionou, tentar com fetch como fallback
            if (!updateSuccess) {
                try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    const authToken = session ? session.access_token : SUPABASE_ANON_KEY;
                    
                    const response = await fetch(
                        `${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({ views: newViews })
                        }
                    );
                    
                    let responseData;
                    try {
                        responseData = await response.json();
                    } catch (e) {
                        responseData = await response.text();
                    }
                    
                    if (response.ok) {
                        if (responseData && Array.isArray(responseData) && responseData.length > 0) {
                            currentVideo.views = newViews;
                            console.log('Views atualizadas via fetch fallback:', responseData);
                            updateSuccess = true;
                        } else {
                            // Status 200 mas array vazio = RLS bloqueou
                            console.error('RLS bloqueou UPDATE via fetch. Status 200 mas resposta vazia. Execute o script supabase_functions.sql no Supabase SQL Editor para ajustar as políticas RLS.');
                        }
                    } else {
                        const errorText = responseData ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData)) : 'Sem resposta';
                        console.error('Erro ao atualizar views via fetch. Status:', response.status, 'Response:', errorText);
                    }
                } catch (fetchError) {
                    console.error('Erro no fallback fetch:', fetchError);
                }
            }
        } catch (error) {
            console.error('Erro ao incrementar views:', error);
        }
    }
    
    // Atualizar tempo de visualização no Supabase
    async function updateVideoWatchTime(videoId, additionalSeconds) {
        try {
            if (!videoId) {
                console.warn('updateVideoWatchTime: videoId não fornecido');
                return;
            }
            
            if (!supabaseClient) {
                console.warn('updateVideoWatchTime: supabaseClient não inicializado');
                return;
            }
            
            if (additionalSeconds <= 0) {
                return;
            }
            
            // Buscar watch_time atual
            const currentVideo = videoList.find(v => v.id === videoId);
            if (!currentVideo) {
                console.warn('updateVideoWatchTime: vídeo não encontrado no videoList', videoId);
                return;
            }
            
            const oldWatchTime = parseFloat(currentVideo.watch_time || 0);
            const additionalSecondsNum = parseFloat(additionalSeconds);
            const newWatchTime = oldWatchTime + additionalSecondsNum;
            console.log(`Atualizando watch_time para vídeo ${videoId}: ${oldWatchTime}s -> ${newWatchTime}s (+${additionalSecondsNum}s)`);
            
            // Tentar atualizar usando incremento SQL via RPC primeiro (se disponível)
            let updateSuccess = false;
            
            // Tentar usar RPC para incremento atômico (mais seguro)
            // Só tenta se a função existir (evita 404)
            try {
                const { data: rpcData, error: rpcError } = await supabaseClient.rpc('increment_video_watch_time', {
                    video_id: videoId,
                    seconds: additionalSecondsNum
                });
                
                if (rpcError) {
                    // Se for 404, a função não existe - não tentar novamente
                    if (rpcError.code === 'P0001' || rpcError.message?.includes('404') || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
                        console.log('Função RPC não disponível, usando update normal');
                    } else {
                        console.warn('Erro ao chamar RPC:', rpcError);
                    }
                } else if (rpcData !== null) {
                    currentVideo.watch_time = newWatchTime;
                    console.log('Watch_time incrementado via RPC:', rpcData);
                    updateSuccess = true;
                }
            } catch (rpcErr) {
                // RPC não disponível, continuar com update normal
                if (rpcErr.message?.includes('404') || rpcErr.message?.includes('function')) {
                    // Função não existe, não logar como erro
                } else {
                    console.log('RPC não disponível, usando update normal');
                }
            }
            
            // Se RPC não funcionou, usar update normal
            if (!updateSuccess) {
                const { data, error } = await supabaseClient
                    .from('videos')
                    .update({ watch_time: parseFloat(newWatchTime) })
                    .eq('id', videoId)
                    .select('*');
                
                if (error) {
                    console.error('Erro ao atualizar watch_time no Supabase:', error);
                    updateSuccess = false;
                } else if (!data || data.length === 0) {
                    // Data vazio significa que RLS bloqueou ou registro não encontrado
                    console.warn('Update de watch_time retornou array vazio - possível problema de RLS');
                    
                    // Tentar verificar se o registro existe e se temos permissão de leitura
                    const { data: checkData, error: checkError } = await supabaseClient
                        .from('videos')
                        .select('id, watch_time')
                        .eq('id', videoId)
                        .single();
                    
                    if (checkError) {
                        console.error('Erro ao verificar registro:', checkError);
                    } else if (checkData) {
                        console.log('Registro existe e pode ser lido. Watch_time atual:', checkData.watch_time);
                        console.warn('RLS está bloqueando UPDATE mas permite SELECT. Execute o script supabase_functions.sql no Supabase SQL Editor.');
                    }
                    
                    updateSuccess = false;
                } else {
                    currentVideo.watch_time = newWatchTime;
                    console.log('Watch_time atualizado com sucesso:', data);
                    updateSuccess = true;
                }
            }
            
            // Se ainda não funcionou, tentar com fetch como fallback
            if (!updateSuccess) {
                try {
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    const authToken = session ? session.access_token : SUPABASE_ANON_KEY;
                    
                    const response = await fetch(
                        `${SUPABASE_URL}/rest/v1/videos?id=eq.${videoId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                                'Prefer': 'return=representation'
                            },
                            body: JSON.stringify({ watch_time: parseFloat(newWatchTime) })
                        }
                    );
                    
                    let responseData;
                    try {
                        responseData = await response.json();
                    } catch (e) {
                        responseData = await response.text();
                    }
                    
                    if (response.ok) {
                        if (responseData && Array.isArray(responseData) && responseData.length > 0) {
                            currentVideo.watch_time = newWatchTime;
                            console.log('Watch_time atualizado via fetch fallback:', responseData);
                            updateSuccess = true;
                        } else {
                            // Status 200 mas array vazio = RLS bloqueou
                            console.error('RLS bloqueou UPDATE via fetch. Status 200 mas resposta vazia. Execute o script supabase_functions.sql no Supabase SQL Editor para ajustar as políticas RLS.');
                        }
                    } else {
                        const errorText = responseData ? (typeof responseData === 'string' ? responseData : JSON.stringify(responseData)) : 'Sem resposta';
                        console.error('Erro ao atualizar watch_time via fetch. Status:', response.status, 'Response:', errorText);
                    }
                } catch (fetchError) {
                    console.error('Erro no fallback fetch:', fetchError);
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar watch_time:', error);
        }
    }
    
    // Iniciar rastreamento de estatísticas para um vídeo
    function startVideoStatsTracking(videoId) {
        console.log('startVideoStatsTracking chamado para vídeo:', videoId);
        // Parar rastreamento anterior se houver
        stopVideoStatsTracking();
        
        if (!videoId) {
            console.warn('startVideoStatsTracking: videoId não fornecido');
            return;
        }
        
        videoStatsTracking.currentVideoId = videoId;
        videoStatsTracking.startTime = Date.now();
        videoStatsTracking.lastUpdateTime = Date.now();
        videoStatsTracking.totalWatchTime = 0;
        // Não resetar viewIncremented aqui, pois já foi setado no evento play
        
        console.log('Rastreamento iniciado para vídeo:', videoId);
        
        // Atualizar watch_time a cada 10 segundos
        videoStatsTracking.updateInterval = setInterval(() => {
            if (videoStatsTracking.currentVideoId && video && !video.paused) {
                const now = Date.now();
                const elapsedSeconds = (now - videoStatsTracking.lastUpdateTime) / 1000;
                
                if (elapsedSeconds >= 10) {
                    console.log(`Atualizando watch_time: ${elapsedSeconds.toFixed(1)}s assistidos`);
                    updateVideoWatchTime(videoStatsTracking.currentVideoId, elapsedSeconds);
                    videoStatsTracking.lastUpdateTime = now;
                }
            }
        }, 10000); // Atualizar a cada 10 segundos
    }
    
    // Parar rastreamento de estatísticas
    function stopVideoStatsTracking() {
        if (videoStatsTracking.updateInterval) {
            clearInterval(videoStatsTracking.updateInterval);
            videoStatsTracking.updateInterval = null;
        }
        
        // Salvar tempo restante antes de parar
        if (videoStatsTracking.currentVideoId && video && !video.paused) {
            const now = Date.now();
            const elapsedSeconds = (now - videoStatsTracking.lastUpdateTime) / 1000;
            if (elapsedSeconds > 0) {
                updateVideoWatchTime(videoStatsTracking.currentVideoId, elapsedSeconds);
            }
        }
        
        videoStatsTracking.currentVideoId = null;
        videoStatsTracking.startTime = null;
        videoStatsTracking.lastUpdateTime = null;
        videoStatsTracking.totalWatchTime = 0;
    }
    
    // Inicializar dashboard de estatísticas
    function initStats() {
        if (!statsBtn || !statsModal) return;

        // Abrir modal de estatísticas
        if (statsBtn) {
            statsBtn.addEventListener("click", () => {
                openStatsModal();
            });
        }

        // Fechar modal
        if (statsCloseBtn) {
            statsCloseBtn.addEventListener("click", closeStatsModal);
        }

        // Fechar ao clicar fora do modal
        if (statsModal) {
            statsModal.addEventListener("click", (e) => {
                if (e.target === statsModal) {
                    closeStatsModal();
                }
            });
        }
    }

    // Carregar e exibir estatísticas
    async function loadStatistics() {
        try {
            // Verificar se há um vídeo atual
            if (videoList.length === 0 || currentVideoIndex < 0 || currentVideoIndex >= videoList.length) {
                console.warn('Nenhum vídeo selecionado para mostrar estatísticas');
                return;
            }
            
            const currentVideo = videoList[currentVideoIndex];
            if (!currentVideo) {
                console.warn('Vídeo atual não encontrado');
                return;
            }
            
            // Recarregar dados do banco para garantir que as estatísticas estejam atualizadas
            const updatedVideos = await fetchVideosFromSupabase();
            if (updatedVideos && updatedVideos.length > 0) {
                // Atualizar views e watch_time do vídeo atual
                const updatedVideo = updatedVideos.find(v => v.id === currentVideo.id);
                if (updatedVideo) {
                    currentVideo.views = updatedVideo.views || 0;
                    currentVideo.watch_time = updatedVideo.watch_time || 0;
                }
            }
            
            // Estatísticas do vídeo atual
            const videoViews = currentVideo.views || 0;
            const videoWatchTime = parseFloat(currentVideo.watch_time || 0);
            
            // Formatar tempo assistido
            const hours = Math.floor(videoWatchTime / 3600);
            const minutes = Math.floor((videoWatchTime % 3600) / 60);
            const seconds = Math.floor(videoWatchTime % 60);
            let watchTimeText;
            if (hours > 0) {
                watchTimeText = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                watchTimeText = `${minutes}m ${seconds}s`;
            } else {
                watchTimeText = `${seconds}s`;
            }
            
            // Atualizar estatísticas do vídeo atual
            const totalVideosEl = document.getElementById("totalVideos");
            const totalViewsEl = document.getElementById("totalViews");
            const totalWatchTimeEl = document.getElementById("totalWatchTime");
            
            // Mostrar título do vídeo no lugar de "Total de Vídeos"
            if (totalVideosEl) {
                const videoTitle = currentVideo.title || 'Vídeo sem título';
                totalVideosEl.textContent = videoTitle.length > 30 ? videoTitle.substring(0, 30) + '...' : videoTitle;
            }
            if (totalViewsEl) totalViewsEl.textContent = videoViews.toLocaleString();
            if (totalWatchTimeEl) totalWatchTimeEl.textContent = watchTimeText;
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    function openStatsModal() {
        if (statsModal) {
            statsModal.classList.add("active");
            document.body.style.overflow = "hidden";
            loadStatistics();
        }
    }

    function closeStatsModal() {
        if (statsModal) {
            statsModal.classList.remove("active");
            document.body.style.overflow = "";
        }
    }

    // ========== FUNÇÕES DE AUTENTICAÇÃO ==========
    
    // Verificar se usuário está autenticado
    async function checkAuth() {
        if (!supabaseClient) {
            if (!initSupabase()) {
                console.error('Supabase não inicializado');
                return false;
            }
        }
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return false;
        }
        
        if (session) {
            // Usuário autenticado
            hideAuthModal();
            return true;
        } else {
            // Usuário não autenticado
            showAuthModal();
            return false;
        }
    }
    
    // Mostrar modal de autenticação
    function showAuthModal() {
        if (authModal) {
            authModal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
        // Esconder botão de logout quando não autenticado
        if (logoutBtn) {
            logoutBtn.style.display = "none";
            logoutBtn.classList.add("hidden");
        }
    }
    
    // Esconder modal de autenticação
    function hideAuthModal() {
        if (authModal) {
            authModal.classList.remove("active");
            document.body.style.overflow = "";
        }
        // Mostrar botão de logout quando autenticado
        if (logoutBtn) {
            logoutBtn.style.display = "flex";
            logoutBtn.classList.remove("hidden");
        }
    }
    
    // Mostrar erro no formulário
    function showAuthError(formId, message) {
        const errorEl = document.getElementById(formId + "Error");
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = "block";
            setTimeout(() => {
                errorEl.style.display = "none";
            }, 5000);
        }
    }
    
    // Login
    async function handleLogin(email, password) {
        if (!supabaseClient) {
            showAuthError("login", "Erro: Supabase não inicializado");
            return false;
        }
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            showAuthError("login", "Erro: " + error.message);
            return false;
        }
        
        // Login bem-sucedido
        hideAuthModal();
        loadVideosFromDatabase();
        return true;
    }
    
    // Registro
    async function handleRegister(email, password, confirmPassword) {
        if (password !== confirmPassword) {
            showAuthError("register", "As senhas não coincidem!");
            return false;
        }
        
        if (password.length < 8) {
            showAuthError("register", "A senha deve ter no mínimo 8 caracteres!");
            return false;
        }
        
        if (!supabaseClient) {
            showAuthError("register", "Erro: Supabase não inicializado");
            return false;
        }
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password
        });
        
        if (error) {
            showAuthError("register", "Erro: " + error.message);
            return false;
        }
        
        // Registro bem-sucedido
        showAuthError("register", "Registro realizado! Verifique seu email para confirmar a conta.");
        
        // Trocar para aba de login após 2 segundos
        setTimeout(() => {
            switchAuthTab("login");
        }, 2000);
        
        return true;
    }
    
    // Logout
    async function handleLogout() {
        if (!supabaseClient) return;
        
        await supabaseClient.auth.signOut();
        showAuthModal();
        videoList = [];
        currentVideoIndex = 0;
        if (video) {
            video.src = "";
        }
        if (queueList) {
            queueList.innerHTML = "";
        }
        if (videoTitle) {
            videoTitle.textContent = "";
        }
        document.title = "V.P. Player";
    }
    
    // Trocar entre tabs de login/registro
    function switchAuthTab(tab) {
        if (!authTabs || !loginForm || !registerForm) return;
        
        authTabs.forEach(t => {
            if (t.dataset.tab === tab) {
                t.classList.add("active");
            } else {
                t.classList.remove("active");
            }
        });
        
        if (tab === "login") {
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        } else {
            loginForm.classList.remove("active");
            registerForm.classList.add("active");
        }
    }
    
    // Inicializar event listeners de autenticação
    function initAuth() {
        // Tabs
        if (authTabs) {
            authTabs.forEach(tab => {
                tab.addEventListener("click", () => {
                    switchAuthTab(tab.dataset.tab);
                });
            });
        }
        
        // Fechar modal
        if (authClose) {
            authClose.addEventListener("click", () => {
                // Não permitir fechar se não estiver autenticado
                checkAuth();
            });
        }
        
        // Formulário de login
        if (loginForm) {
            loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("loginEmail").value;
                const password = document.getElementById("loginPassword").value;
                await handleLogin(email, password);
            });
        }
        
        // Formulário de registro
        if (registerForm) {
            registerForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const email = document.getElementById("registerEmail").value;
                const password = document.getElementById("registerPassword").value;
                const confirmPassword = document.getElementById("registerPasswordConfirm").value;
                await handleRegister(email, password, confirmPassword);
            });
        }
        
        // Escutar mudanças de autenticação
        if (supabaseClient) {
            let isInitialAuthCheck = true;
            supabaseClient.auth.onAuthStateChange((event, session) => {
                // Ignorar eventos durante o carregamento inicial
                if (isInitialAuthCheck && event === 'SIGNED_IN') {
                    isInitialAuthCheck = false;
                    return;
                }
                
                if (event === 'SIGNED_OUT') {
                    showAuthModal();
                } else if (event === 'SIGNED_IN') {
                    hideAuthModal();
                    // Só recarregar se realmente houver mudança de estado (não apenas ao voltar à aba)
                    if (!isInitialAuthCheck) {
                        loadVideosFromDatabase();
                    }
                }
                isInitialAuthCheck = false;
            });
        }
    }

    // Gerenciar visibilidade da aba para preservar estado do vídeo
    function initVisibilityHandlers() {
        // Salvar estado do vídeo quando a aba perde foco
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Aba perdeu foco - salvar estado no localStorage
                if (video && videoList.length > 0 && currentVideoIndex >= 0 && currentVideoIndex < videoList.length) {
                    const videoState = {
                        videoId: videoList[currentVideoIndex].id,
                        currentTime: video.currentTime,
                        isPlaying: !video.paused,
                        volume: video.volume,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('vpPlayerState', JSON.stringify(videoState));
                }
            } else {
                // Aba voltou ao foco - restaurar estado se necessário
                const savedState = localStorage.getItem('vpPlayerState');
                if (savedState && video && videoList.length > 0) {
                    try {
                        const state = JSON.parse(savedState);
                        // Só restaurar se o estado foi salvo há menos de 10 minutos
                        if (Date.now() - state.timestamp < 600000) {
                            const videoIndex = videoList.findIndex(v => v.id === state.videoId);
                            
                            if (videoIndex >= 0 && videoIndex === currentVideoIndex) {
                                // Mesmo vídeo, restaurar tempo e estado
                                // Só restaurar o tempo se o vídeo estava PAUSADO quando a aba foi escondida
                                // Se estava tocando, o vídeo continuou avançando e já está no tempo correto
                                if (!state.isPlaying && state.currentTime > 0 && Math.abs(video.currentTime - state.currentTime) > 1) {
                                    video.currentTime = state.currentTime;
                                }
                                if (state.isPlaying && video.paused) {
                                    video.play().catch(() => {});
                                }
                                if (state.volume !== undefined && Math.abs(state.volume - video.volume) > 0.01) {
                                    video.volume = state.volume;
                                    if (volume) volume.value = state.volume;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Erro ao restaurar estado:', e);
                    }
                }
            }
        });
    }

    // Função principal de inicialização
    async function init() {
        if (!initDOMElements()) {
            console.error('Falha ao inicializar elementos do DOM');
            return;
        }
        
        // Inicializar Supabase
        if (typeof supabase !== 'undefined') {
            initSupabase();
        }
        
        initEventListeners();
        initKeyboardShortcuts(); // Inicializar atalhos de teclado
        initUpload();
        initStats(); // Inicializar dashboard
        initAuth(); // Inicializar autenticação
        initVisibilityHandlers(); // Gerenciar visibilidade da aba
        
        // Verificar autenticação antes de carregar vídeos
        const isAuthenticated = await checkAuth();
        
        if (isAuthenticated) {
            // Aguardar Supabase estar disponível antes de carregar vídeos
            function waitForSupabase() {
                if (typeof supabase !== 'undefined' && supabaseClient) {
                    loadVideosFromDatabase();
                } else {
                    setTimeout(waitForSupabase, 100);
                }
            }
            
            waitForSupabase();
        }
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

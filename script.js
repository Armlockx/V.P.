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
    let videoList = [];
    let currentVideoIndex = 0;
    let controlsTimeout = null;
    let controls;
    let supabaseClient = null;
    let isLoading = false;
    let isSeeking = false;
    
    // Configuração do Supabase
    const SUPABASE_URL = 'https://esvjyjnyrmysvylnszjd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmp5am55cm15c3Z5bG5zempkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzY2ODMsImV4cCI6MjA4MTMxMjY4M30.ZyEgF8y4cIdCPnlcfMOLt0fYMoZCJkXCdc6eqeF8xAA';
    
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
                duration: video.duration,
                views: video.views || 0,
                watch_time: video.watch_time || 0,
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
        videoList = await fetchVideosFromSupabase();
        if (videoList.length > 0) {
            updateQueueDisplay();
            updateQueueCount();
            loadVideo(0);
            updateVideoTitle();
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
        
        currentVideoIndex = index;
        const selectedVideo = videoList[index];
        
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
            
            const thumbnailHtml = videoItem.thumbnail 
                ? `<img src="${videoItem.thumbnail}" alt="${videoItem.title}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='🎬';" />`
                : '🎬';
            
            listItem.innerHTML = `
                <div class="queue-item-thumbnail">${thumbnailHtml}</div>
                <div class="queue-item-info">
                    <div class="queue-item-title">${videoItem.title}</div>
                    <div class="queue-item-duration">${videoItem.duration}</div>
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
        // Botão agora está na barra de controles, não precisa esconder/mostrar separadamente
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            controls.classList.add("hidden");
            videoTitle.classList.add("hidden");
        }, 2000);
    }

    function hideControls() {
        if (!controls || !videoTitle) return;
        
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(() => {
            controls.classList.add("hidden");
            videoTitle.classList.add("hidden");
        }, 2000);
    }

    function updateVolumeProgress() {
        if (!volume) return;
        const percent = volume.value * 100;
        volume.style.setProperty("--volume-percent", percent + "%");
    }

    // Inicializar eventos e controles
    function initEventListeners() {
        if (!video || !playPause || !player) return;

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

        player.addEventListener("mouseleave", (e) => {
            const relatedTarget = e.relatedTarget;
            if (!relatedTarget || (!relatedTarget.closest(".queue-menu") && !relatedTarget.closest(".queue-toggle-btn") && !relatedTarget.closest(".controls-row"))) {
                hideControls();
            }
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
            hideControls();
        });

        video.addEventListener("pause", () => {
            showControls();
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

                if (!supabaseClient) {
                    if (typeof supabase !== 'undefined') {
                        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    } else {
                        if (uploadMessage) {
                            uploadMessage.textContent = "Erro: Supabase não está disponível. Recarregue a página.";
                            uploadMessage.className = "upload-message error";
                            uploadMessage.style.display = "block";
                        }
                        return;
                    }
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
            const totalVideos = videoList.length;
            const totalViews = videoList.reduce((sum, v) => sum + (v.views || 0), 0);
            const totalWatchTime = videoList.reduce((sum, v) => sum + (v.watch_time || 0), 0);
            
            // Formatar tempo assistido
            const hours = Math.floor(totalWatchTime / 3600);
            const minutes = Math.floor((totalWatchTime % 3600) / 60);
            const watchTimeText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            
            // Atualizar estatísticas gerais
            const totalVideosEl = document.getElementById("totalVideos");
            const totalViewsEl = document.getElementById("totalViews");
            const totalWatchTimeEl = document.getElementById("totalWatchTime");
            
            if (totalVideosEl) totalVideosEl.textContent = totalVideos;
            if (totalViewsEl) totalViewsEl.textContent = totalViews.toLocaleString();
            if (totalWatchTimeEl) totalWatchTimeEl.textContent = watchTimeText;
            
            // Vídeos mais populares
            const popularVideos = [...videoList]
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5);
            
            const popularList = document.getElementById("popularVideos");
            if (popularList) {
                popularList.innerHTML = "";
                
                popularVideos.forEach((video, index) => {
                    const item = document.createElement("li");
                    item.className = "popular-video-item";
                    item.innerHTML = `
                        <span class="popular-rank">${index + 1}</span>
                        <span class="popular-title">${video.title}</span>
                        <span class="popular-views">${(video.views || 0).toLocaleString()} visualizações</span>
                    `;
                    item.onclick = () => {
                        const videoIndex = videoList.findIndex(v => v.id === video.id);
                        if (videoIndex >= 0) {
                            loadVideo(videoIndex);
                            closeStatsModal();
                            // Fechar menu lateral também
                            if (queueMenu) queueMenu.classList.remove("open");
                            if (queueToggle) queueToggle.classList.remove("active");
                            document.body.classList.remove("menu-open");
                            if (uploadBtn) uploadBtn.style.display = "none";
                            if (statsBtn) statsBtn.style.display = "none";
                        }
                    };
                    popularList.appendChild(item);
                });
            }
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

    // Função principal de inicialização
    function init() {
        if (!initDOMElements()) {
            console.error('Falha ao inicializar elementos do DOM');
            return;
        }
        
        initEventListeners();
        initKeyboardShortcuts(); // Inicializar atalhos de teclado
        initUpload();
        initStats(); // Inicializar dashboard
        
        // Aguardar Supabase estar disponível antes de carregar vídeos
        function waitForSupabase() {
            if (typeof supabase !== 'undefined') {
                loadVideosFromDatabase();
            } else {
                setTimeout(waitForSupabase, 100);
            }
        }
        
        waitForSupabase();
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

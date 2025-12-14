const video = document.getElementById("video");
const playPause = document.getElementById("playPause");
const progress = document.getElementById("progress");
const progressContainer = document.getElementById("progressContainer");
const volume = document.getElementById("volume");
const time = document.getElementById("time");
const fullscreen = document.getElementById("fullscreen");
const player = document.querySelector(".player");
const queueMenu = document.getElementById("queueMenu");
const queueList = document.getElementById("queueList");
const queueToggle = document.getElementById("queueToggle");
const queueClose = document.getElementById("queueClose");
const videoTitle = document.getElementById("videoTitle");
const queueBadge = document.getElementById("queueBadge");
const queueCount = document.getElementById("queueCount");
const queueSearch = document.getElementById("queueSearch");


// Lista de vídeos será carregada do Supabase
let videoList = [];
let currentVideoIndex = 0;

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
    }
}
let controlsTimeout = null;
const controls = document.querySelector(".controls");


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
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = percent + "%";


    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);
    time.textContent = `${current} / ${total}`;
};


progressContainer.onclick = (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    video.currentTime = (clickX / width) * video.duration;
};


volume.oninput = () => {
    video.volume = volume.value;
    updateVolumeProgress();
};

function updateVolumeProgress() {
    const percent = volume.value * 100;
    volume.style.setProperty("--volume-percent", percent + "%");
}

volume.addEventListener("input", updateVolumeProgress);
updateVolumeProgress();


fullscreen.onclick = () => {
    if (!document.fullscreenElement) {
        player.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};


document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
        fullscreen.textContent = "⛶";
    } else {
        fullscreen.textContent = "⛶";
    }
});


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
    video.src = selectedVideo.url;
    video.load();
    updateQueueDisplay();
    updateVideoTitle();
    
    if (!video.paused) {
        video.play();
    }
}


function updateQueueDisplay() {
    queueList.innerHTML = "";
    
    const searchTerm = queueSearch.value.toLowerCase();
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
            queueMenu.classList.remove("open");
            queueToggle.classList.remove("active");
            document.body.classList.remove("menu-open");
            hideControls();
        };
        
        queueList.appendChild(listItem);
    });
    
    updateQueueCount();
}


function updateQueueCount() {
    const total = videoList.length;
    queueBadge.textContent = total;
    queueCount.textContent = `${total} ${total === 1 ? 'vídeo' : 'vídeos'}`;
}


queueToggle.onclick = () => {
    const isOpen = queueMenu.classList.toggle("open");
    queueToggle.classList.toggle("active");
    document.body.classList.toggle("menu-open", isOpen);
    if (isOpen) {
        queueSearch.focus();
        queueToggle.classList.remove("hidden");
        uploadBtn.style.display = "flex";
    } else {
        hideControls();
        uploadBtn.style.display = "none";
    }
};


queueClose.onclick = () => {
    queueMenu.classList.remove("open");
    queueToggle.classList.remove("active");
    document.body.classList.remove("menu-open");
    uploadBtn.style.display = "none";
    hideControls();
};


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


video.onended = () => {
    if (currentVideoIndex < videoList.length - 1) {
        loadVideo(currentVideoIndex + 1);
        video.play();
        playPause.textContent = "⏸";
        playPause.setAttribute("data-icon", "⏸");
    }
};


// Inicializar carregando vídeos do Supabase
loadVideosFromDatabase();


function showControls() {
    controls.classList.remove("hidden");
    videoTitle.classList.remove("hidden");
    if (!queueMenu.classList.contains("open")) {
        queueToggle.classList.remove("hidden");
    }
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        controls.classList.add("hidden");
        videoTitle.classList.add("hidden");
        if (!queueMenu.classList.contains("open")) {
            queueToggle.classList.add("hidden");
        }
    }, 2000);
}


function hideControls() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        controls.classList.add("hidden");
        videoTitle.classList.add("hidden");
        if (!queueMenu.classList.contains("open")) {
            queueToggle.classList.add("hidden");
            uploadBtn.style.display = "none";
        } else {
            queueMenu.classList.remove("open");
            queueToggle.classList.remove("active");
            document.body.classList.remove("menu-open");
            queueToggle.classList.add("hidden");
            uploadBtn.style.display = "none";
        }
    }, 2000);
}


function updateVideoTitle() {
    if (currentVideoIndex >= 0 && currentVideoIndex < videoList.length) {
        videoTitle.textContent = videoList[currentVideoIndex].title;
    }
}


player.addEventListener("mouseenter", () => {
    showControls();
});


player.addEventListener("mouseleave", (e) => {
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || (!relatedTarget.closest(".queue-menu") && !relatedTarget.closest(".queue-toggle-btn"))) {
        hideControls();
    }
});


player.addEventListener("mousemove", () => {
    showControls();
});


queueToggle.addEventListener("mouseenter", () => {
    showControls();
});


queueMenu.addEventListener("mouseenter", () => {
    showControls();
});


queueMenu.addEventListener("mouseleave", () => {
    hideControls();
});


queueToggle.addEventListener("mouseleave", () => {
    if (!queueMenu.classList.contains("open")) {
        hideControls();
    }
});


video.addEventListener("play", () => {
    hideControls();
});


video.addEventListener("pause", () => {
    showControls();
});


showControls();


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

// ==================== UPLOAD DE VÍDEOS ====================

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos do modal de upload
const uploadBtn = document.getElementById("uploadBtn");
const uploadModal = document.getElementById("uploadModal");
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

let videoDurationSeconds = 0;

// Abrir modal
uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevenir que o clique feche o menu
    uploadModal.classList.add("active");
    document.body.style.overflow = "hidden";
});

// Esconder botão de upload quando o menu não está aberto
uploadBtn.style.display = "none";

// Fechar modal
function closeUploadModal() {
    uploadModal.classList.remove("active");
    document.body.style.overflow = "";
    resetUploadForm();
}

uploadCloseBtn.addEventListener("click", closeUploadModal);
uploadCancelBtn.addEventListener("click", closeUploadModal);

// Fechar ao clicar fora do modal
uploadModal.addEventListener("click", (e) => {
    if (e.target === uploadModal) {
        closeUploadModal();
    }
});

// Resetar formulário
function resetUploadForm() {
    uploadForm.reset();
    videoPreview.innerHTML = "";
    videoPreview.style.display = "none";
    thumbnailPreview.innerHTML = "";
    thumbnailPreview.style.display = "none";
    videoDuration.style.display = "none";
    uploadProgress.style.display = "none";
    uploadMessage.style.display = "none";
    uploadMessage.className = "upload-message";
    videoDurationSeconds = 0;
    videoFileText.textContent = "Selecione o arquivo de vídeo";
    videoFileText.classList.remove("has-file");
    thumbnailFileText.textContent = "Selecione a imagem de thumbnail";
    thumbnailFileText.classList.remove("has-file");
    uploadSubmitBtn.disabled = false;
}

// Preview do vídeo e cálculo de duração
videoFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    videoFileText.textContent = file.name;
    videoFileText.classList.add("has-file");

    // Criar preview
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.controls = true;
    video.style.width = "100%";
    video.style.maxHeight = "300px";
    
    videoPreview.innerHTML = "";
    videoPreview.appendChild(video);
    videoPreview.style.display = "block";

    // Calcular duração
    videoDuration.style.display = "block";
    durationText.textContent = "Calculando...";
    
    video.addEventListener("loadedmetadata", () => {
        videoDurationSeconds = Math.floor(video.duration);
        const minutes = Math.floor(videoDurationSeconds / 60);
        const seconds = videoDurationSeconds % 60;
        durationText.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    });
});

// Preview da thumbnail
thumbnailFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    thumbnailFileText.textContent = file.name;
    thumbnailFileText.classList.add("has-file");

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
});

// Função para formatar duração
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Upload do formulário
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validações
    if (!videoTitleInput.value.trim()) {
        showUploadMessage("Por favor, preencha o título do vídeo.", "error");
        return;
    }

    if (!videoFileInput.files[0]) {
        showUploadMessage("Por favor, selecione um arquivo de vídeo.", "error");
        return;
    }

    if (!thumbnailFileInput.files[0]) {
        showUploadMessage("Por favor, selecione uma imagem de thumbnail.", "error");
        return;
    }

    if (videoDurationSeconds === 0) {
        showUploadMessage("Aguarde o cálculo da duração do vídeo.", "error");
        return;
    }

    // Desabilitar botão
    uploadSubmitBtn.disabled = true;
    uploadProgress.style.display = "block";
    uploadMessage.style.display = "none";

    try {
        const videoFile = videoFileInput.files[0];
        const thumbnailFile = thumbnailFileInput.files[0];
        const title = videoTitleInput.value.trim();
        const duration = formatDuration(videoDurationSeconds);

        // Gerar nomes únicos para os arquivos
        const videoFileName = `${Date.now()}_${videoFile.name}`;
        const thumbnailFileName = `${Date.now()}_${thumbnailFile.name}`;

        // Upload do vídeo
        updateUploadProgress(10, "Enviando vídeo...");
        const { data: videoData, error: videoError } = await supabaseClient.storage
            .from("v-p-player")
            .upload(`Videos/${videoFileName}`, videoFile, {
                cacheControl: "3600",
                upsert: false
            });

        if (videoError) {
            throw new Error(`Erro ao fazer upload do vídeo: ${videoError.message}`);
        }

        // Upload da thumbnail
        updateUploadProgress(50, "Enviando thumbnail...");
        const { data: thumbnailData, error: thumbnailError } = await supabaseClient.storage
            .from("v-p-player")
            .upload(`Thumbnails/${thumbnailFileName}`, thumbnailFile, {
                cacheControl: "3600",
                upsert: false
            });

        if (thumbnailError) {
            throw new Error(`Erro ao fazer upload da thumbnail: ${thumbnailError.message}`);
        }

        // Obter URLs públicas
        const { data: videoUrlData } = supabaseClient.storage
            .from("v-p-player")
            .getPublicUrl(`Videos/${videoFileName}`);

        const { data: thumbnailUrlData } = supabaseClient.storage
            .from("v-p-player")
            .getPublicUrl(`Thumbnails/${thumbnailFileName}`);

        // Obter próximo order_index
        const { data: videos } = await supabaseClient
            .from("videos")
            .select("order_index")
            .order("order_index", { ascending: false })
            .limit(1);

        const nextOrderIndex = videos && videos.length > 0 ? videos[0].order_index + 1 : 1;

        // Inserir no banco de dados usando REST API diretamente
        updateUploadProgress(80, "Salvando no banco de dados...");
        
        const insertResponse = await fetch(
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
                    title: title,
                    url: videoUrlData.publicUrl,
                    thumbnail: thumbnailUrlData.publicUrl,
                    duration: duration,
                    order_index: nextOrderIndex
                })
            }
        );

        if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            let errorMessage = insertResponse.statusText;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error_description || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(`Erro ao salvar no banco de dados: ${errorMessage}`);
        }

        const newVideoArray = await insertResponse.json();
        const newVideo = Array.isArray(newVideoArray) ? newVideoArray[0] : newVideoArray;

        updateUploadProgress(100, "Concluído!");
        
        // Mostrar mensagem de sucesso
        showUploadMessage("Vídeo adicionado com sucesso!", "success");

        // Recarregar lista de vídeos
        setTimeout(async () => {
            await loadVideosFromDatabase();
            closeUploadModal();
        }, 1500);

    } catch (error) {
        console.error("Erro no upload:", error);
        showUploadMessage(error.message || "Erro ao fazer upload do vídeo. Tente novamente.", "error");
        uploadSubmitBtn.disabled = false;
    }
});

// Função para atualizar progresso
function updateUploadProgress(percent, text) {
    uploadProgressFill.style.width = `${percent}%`;
    uploadProgressText.textContent = `${percent}% - ${text}`;
}

// Função para mostrar mensagens
function showUploadMessage(message, type) {
    uploadMessage.textContent = message;
    uploadMessage.className = `upload-message ${type}`;
    uploadMessage.style.display = "block";
}
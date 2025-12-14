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
    } else {
        hideControls();
    }
};


queueClose.onclick = () => {
    queueMenu.classList.remove("open");
    queueToggle.classList.remove("active");
    document.body.classList.remove("menu-open");
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
        } else {
            queueMenu.classList.remove("open");
            queueToggle.classList.remove("active");
            document.body.classList.remove("menu-open");
            queueToggle.classList.add("hidden");
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
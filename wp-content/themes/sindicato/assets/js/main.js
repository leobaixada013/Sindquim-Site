const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#site-menu");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

const player = document.querySelector("[data-player]");

const reproduzirVideo = (videoId, titulo, link, thumb) => {
  if (!player || !videoId) {
    return false;
  }
  const slot = player.querySelector("[data-player-slot]");
  if (!slot) {
    return false;
  }

  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0";
  iframe.title = titulo || "Vídeo do sindicato";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;
  slot.replaceChildren(iframe);
  slot.hidden = false;

  const tituloEl = player.querySelector("[data-player-title]");
  if (tituloEl && titulo) {
    tituloEl.textContent = titulo;
  }
  const linkEl = player.querySelector("[data-player-link]");
  if (linkEl && link) {
    linkEl.href = link;
  }
  if (thumb) {
    player.style.backgroundImage = "url(" + thumb + ")";
  }
  player.classList.add("podcast-feature--playing");
  return true;
};

if (player) {
  const playButton = player.querySelector(".play-button[data-video-id]");
  if (playButton) {
    playButton.addEventListener("click", () => {
      reproduzirVideo(playButton.dataset.videoId, playButton.dataset.videoTitle);
    });
  }

  document.querySelectorAll(".podcast-list a[data-video-id]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const abriu = reproduzirVideo(
        link.dataset.videoId,
        link.dataset.videoTitle,
        link.href,
        link.dataset.videoThumb,
      );
      if (abriu) {
        event.preventDefault();
        player.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}

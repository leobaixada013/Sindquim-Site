const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#site-menu");

const urgentNotices = [
  {
    label: "Comunicado urgente",
    message: "Assembleia geral nesta quinta, às 18h, na sede do sindicato.",
    url: "#avisos",
    linkText: "Ver comunicados",
  },
];

const quickNotices = [
  {
    date: "2026-07-12",
    shortDate: "12 jul",
    title: "Assembleia geral extraordinária",
  },
  {
    date: "2026-07-15",
    shortDate: "15 jul",
    title: "Plantão jurídico para associados",
  },
  {
    date: "2026-07-19",
    shortDate: "19 jul",
    title: "Prazo para envio de documentos",
  },
  {
    date: "2026-07-22",
    shortDate: "22 jul",
    title: "Reunião sobre segurança no trabalho",
  },
];

const renderUrgentNotice = () => {
  const urgentSection = document.querySelector("[data-urgent-notice]");
  const urgentLabel = document.querySelector("[data-urgent-label]");
  const urgentMessage = document.querySelector("[data-urgent-message]");
  const urgentLink = document.querySelector("[data-urgent-link]");
  const [notice] = urgentNotices;

  if (!urgentSection || !urgentLabel || !urgentMessage || !urgentLink || !notice) {
    return;
  }

  urgentLabel.textContent = notice.label;
  urgentMessage.textContent = notice.message;
  urgentLink.href = notice.url;
  urgentLink.textContent = notice.linkText;
  urgentSection.hidden = false;
};

const renderQuickNotices = () => {
  const noticePanel = document.querySelector("[data-quick-notices]");
  const noticeList = document.querySelector("[data-quick-notice-list]");
  const newsLayout = document.querySelector(".news-layout");

  if (!noticePanel || !noticeList || !newsLayout) {
    return;
  }

  if (quickNotices.length === 0) {
    noticePanel.hidden = true;
    newsLayout.classList.add("news-layout--without-notices");
    return;
  }

  noticeList.innerHTML = quickNotices
    .map(
      (notice) => `
        <li>
          <time datetime="${notice.date}">${notice.shortDate}</time>
          <span>${notice.title}</span>
        </li>
      `,
    )
    .join("");

  noticePanel.hidden = false;
  newsLayout.classList.remove("news-layout--without-notices");
};

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".episode-list button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".episode-list button").forEach((item) => {
      item.classList.remove("is-active");
    });
    button.classList.add("is-active");
  });
});

renderUrgentNotice();
renderQuickNotices();

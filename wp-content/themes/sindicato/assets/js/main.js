const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#site-menu");

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

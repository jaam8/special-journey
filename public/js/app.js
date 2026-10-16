const STORAGE_KEY = "savedNews";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchStatus = document.getElementById("searchStatus");
const newsContainer = document.getElementById("newsContainer");
const savedStatus = document.getElementById("savedStatus");
const savedContainer = document.getElementById("savedContainer");
const savedCountEl = document.getElementById("savedCount");
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");
const toast = document.getElementById("toast");

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSavedNews() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function isSaved(saved, article) {
  return saved.some((item) => item.url === article.url);
}

function toggleSave(article) {
  const saved = getSavedNews();
  const existingIndex = saved.findIndex((item) => item.url === article.url);

  if (existingIndex >= 0) {
    saved.splice(existingIndex, 1);
    showToast("Удалено из избранного");
  } else {
    saved.unshift(article);
    showToast("Добавлено в избранное");
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  renderSavedNews();
  syncSaveButtons();
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
}

function articleCard(article, saved) {
  const image = article.urlToImage
    ? `<img class="article-image" src="${escapeHtml(article.urlToImage)}" alt="" loading="lazy" onerror="this.remove()" />`
    : "";

  return `
    <article class="article" data-url="${escapeHtml(article.url)}">
      ${image}
      <div class="article-body">
        <span class="article-source">${escapeHtml(article.source?.name || "")}</span>
        <h3 class="article-title">
          <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(article.title)}
          </a>
        </h3>
        <p class="article-desc">${escapeHtml(article.description || "")}</p>
        <div class="article-footer">
          <span class="article-date">${formatDate(article.publishedAt)}</span>
          <button class="save-btn ${saved ? "is-saved" : ""}" data-action="toggle-save" aria-label="Save" title="В избранное">
            ${saved ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  `;
}

const articlesByUrl = new Map();

function renderArticles(container, articles, emptyMessage) {
  if (!articles.length) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  const saved = getSavedNews();
  container.innerHTML = articles
    .map((article) => {
      articlesByUrl.set(article.url, article);
      return articleCard(article, isSaved(saved, article));
    })
    .join("");
}

function syncSaveButtons() {
  const saved = getSavedNews();
  document.querySelectorAll(".article").forEach((el) => {
    const article = articlesByUrl.get(el.dataset.url);
    if (!article) return;
    const btn = el.querySelector("[data-action='toggle-save']");
    const saved_ = isSaved(saved, article);
    btn.classList.toggle("is-saved", saved_);
    btn.textContent = saved_ ? "♥" : "♡";
  });
}

function renderSavedNews() {
  const saved = getSavedNews();
  savedCountEl.textContent = saved.length;
  savedStatus.textContent = "";
  renderArticles(savedContainer, saved, "Пока нет сохранённых новостей");
}

async function handleSearch(query) {
  searchBtn.disabled = true;
  searchStatus.classList.remove("is-error");
  searchStatus.textContent = "Загрузка...";
  newsContainer.innerHTML = "";

  try {
    const res = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Не удалось загрузить новости");
    }

    searchStatus.textContent = `Найдено: ${data.length}`;
    renderArticles(newsContainer, data, "Ничего не найдено");
  } catch (err) {
    searchStatus.classList.add("is-error");
    searchStatus.textContent = err.message || "Не удалось загрузить новости";
  } finally {
    searchBtn.disabled = false;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query.length < 2) return;
  handleSearch(query);
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action='toggle-save']");
  if (!btn) return;
  const card = btn.closest(".article");
  const article = articlesByUrl.get(card.dataset.url);
  if (article) toggleSave(article);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.toggle("is-active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });
    panels.forEach((panel) =>
      panel.classList.toggle("is-hidden", panel.dataset.panel !== tab.dataset.tab),
    );
  });
});

renderSavedNews();

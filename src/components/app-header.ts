import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("app-header")
export class AppHeader extends LitElement {
  @property({ type: String }) lang: "ko" | "en" = "ko";
  @state() private dropdownOpen = false;
  @state() private isDark = true;

  protected override createRenderRoot() {
    return this;
  }

  private handleDocumentClick = (e: MouseEvent) => {
    const path = e.composedPath();
    const isClickInside = path.some(
      (el) => el instanceof HTMLElement && el.classList.contains("custom-dropdown-container"),
    );
    if (!isClickInside) {
      this.dropdownOpen = false;
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this.handleDocumentClick);

    // Initialize theme before first render to prevent double-update warning
    const savedTheme = localStorage.getItem("batcher-theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (savedTheme === null && systemPrefersDark);

    this.isDark = shouldBeDark;
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }

  override disconnectedCallback() {
    document.removeEventListener("click", this.handleDocumentClick);
    super.disconnectedCallback();
  }

  private toggleTheme() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("batcher-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("batcher-theme", "light");
    }
  }

  private selectLanguage(lang: "ko" | "en") {
    this.dropdownOpen = false;
    this.dispatchEvent(
      new CustomEvent("change-lang", {
        detail: lang,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleSupportClick(e: MouseEvent) {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("open-support", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected override render() {
    const desc = this.lang === "ko" ? "쉽고 빠른 파일 변환 툴" : "Easy and Fast File Converter";

    return html`
      <header
        class="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-14 h-14 animate-logo-float">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="w-full h-full">
              <defs>
                <linearGradient id="header-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#4f46e5" />
                </linearGradient>
                <linearGradient id="header-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#a855f7" />
                  <stop offset="100%" stop-color="#6366f1" />
                </linearGradient>
                <linearGradient id="header-emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#34d399" />
                  <stop offset="100%" stop-color="#059669" />
                </linearGradient>
                <filter id="header-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Stack Layer 3 (Background) -->
              <rect
                x="10"
                y="4"
                width="16"
                height="16"
                rx="4"
                fill="#1e293b"
                stroke="#334155"
                stroke-width="1.2"
                opacity="0.4"
                transform="rotate(-6 18 12)"
              />

              <!-- Stack Layer 2 (Middle) -->
              <rect
                x="8"
                y="6"
                width="16"
                height="16"
                rx="4"
                fill="url(#header-accent-grad)"
                stroke="#ffffff"
                stroke-width="0.8"
                stroke-opacity="0.15"
                opacity="0.8"
                transform="rotate(3 16 14)"
              />

              <!-- Stack Layer 1 (Foreground/Main) -->
              <g transform="translate(4, 8)">
                <rect
                  x="0"
                  y="0"
                  width="18"
                  height="18"
                  rx="4.5"
                  fill="url(#header-primary-grad)"
                  stroke="#ffffff"
                  stroke-width="1"
                  stroke-opacity="0.25"
                  filter="url(#header-glow)"
                />
                <path
                  d="M3 14 L7.5 8.5 L11 12.5 L13 10 L15.5 14 Z"
                  fill="#ffffff"
                  fill-opacity="0.95"
                />
                <circle cx="12.5" cy="5.5" r="2" fill="#34d399" />
              </g>

              <!-- Export Dynamic Arrow -->
              <path
                d="M21 17 L27 17 L27 23 M27 17 L18 26"
                stroke="#34d399"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                filter="url(#header-glow)"
              />
            </svg>
          </div>
          <div>
            <h1
              class="text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2 font-sans"
            >
              배처 툴(Batcher Tools)
            </h1>
            <p class="text-xs text-slate-400 font-medium tracking-wide">${desc}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 self-end md:self-center">
          <!-- Main Nav Links for SEO & AdSense Crawlers -->
          <nav class="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-300 mr-1 sm:mr-2 font-sans">
            <a
              href="/guides/index.html"
              class="hover:text-indigo-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-900/80 border border-transparent hover:border-slate-800"
            >
              ${this.lang === "ko" ? "사용 가이드" : "Guides"}
            </a>
            <a
              href="/about.html"
              class="hover:text-indigo-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-900/80 border border-transparent hover:border-slate-800"
            >
              ${this.lang === "ko" ? "소개" : "About"}
            </a>
            <a
              href="/contact.html"
              class="hover:text-indigo-400 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-900/80 border border-transparent hover:border-slate-800"
            >
              ${this.lang === "ko" ? "문의" : "Contact"}
            </a>
          </nav>

          <!-- Buy Me a Coffee Support Button (Opens in-app Modal) -->
          <button
            @click="${this.handleSupportClick}"
            class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 group font-sans shrink-0 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
            title="${this.lang === "ko" ? "도움이 되셨다면 커피 한 잔 후원해주세요! ☕" : "Support on Buy Me a Coffee! ☕"}"
          >
            <span class="text-sm group-hover:scale-110 transition-transform inline-block">☕</span>
            <span class="hidden sm:inline">${this.lang === "ko" ? "커피 후원" : "Buy a Coffee"}</span>
          </button>

          <!-- Theme Toggle Switch -->
          <button
            @click="${this.toggleTheme}"
            class="flex items-center justify-center w-10 h-10 bg-slate-950 border border-slate-800 hover:border-brand-primary/30 hover:bg-slate-900 text-slate-400 hover:text-brand-primary rounded-xl cursor-pointer focus:outline-none transition-all shadow-sm active:scale-95"
            title="${this.lang === "ko" ? "테마 변경" : "Change Theme"}"
          >
            ${this.isDark
              ? html`<i class="fa-solid fa-circle-half-stroke text-white"></i>`
              : html`<i class="fa-solid fa-circle-half-stroke text-gray-700"></i>`}
          </button>

          <!-- Language Selector dropdown -->
          <div class="relative inline-block text-left w-32.5 custom-dropdown-container">
            <button
              @click="${() => (this.dropdownOpen = !this.dropdownOpen)}"
              class="flex items-center justify-start w-full pl-9 pr-8 py-2.5 bg-slate-950 border border-slate-800 hover:border-brand-primary/30 hover:bg-slate-900 text-slate-200 rounded-xl text-xs cursor-pointer focus:outline-none transition-all font-sans font-medium shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] focus:border-brand-primary select-none relative"
            >
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              >
                <i class="fa-solid fa-globe text-xs"></i>
              </div>
              <span>${this.lang === "ko" ? "한국어" : "English"}</span>
              <div
                class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs"
              >
                <i
                  class="fa-solid fa-chevron-down transition-transform duration-200 ${this
                    .dropdownOpen
                    ? "rotate-180"
                    : ""}"
                ></i>
              </div>
            </button>

            <!-- Custom Dropdown Menu -->
            ${this.dropdownOpen
              ? html`
                  <div
                    class="absolute right-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] z-50 py-1.5 focus:outline-none animate-fade-in font-sans"
                  >
                    <button
                      @click="${() => this.selectLanguage("ko")}"
                      class="w-full pl-5 pr-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${this
                        .lang === "ko"
                        ? "text-brand-text bg-brand-bg"
                        : "text-slate-400 hover:bg-brand-bg hover:text-brand-text"}"
                    >
                      <span>한국어</span>
                      <div class="w-3.5 flex items-center justify-center shrink-0">
                        ${this.lang === "ko"
                          ? html`<i class="fa-solid fa-check text-brand-primary text-xs"></i>`
                          : ""}
                      </div>
                    </button>
                    <button
                      @click="${() => this.selectLanguage("en")}"
                      class="w-full pl-5 pr-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${this
                        .lang === "en"
                        ? "text-brand-text bg-brand-bg"
                        : "text-slate-400 hover:bg-brand-bg hover:text-brand-text"}"
                    >
                      <span>English</span>
                      <div class="w-3.5 flex items-center justify-center shrink-0">
                        ${this.lang === "en"
                          ? html`<i class="fa-solid fa-check text-brand-primary text-xs"></i>`
                          : ""}
                      </div>
                    </button>
                  </div>
                `
              : ""}
          </div>
        </div>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-header": AppHeader;
  }
}

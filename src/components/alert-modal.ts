import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("alert-modal")
export class AlertModal extends LitElement {
  @property({ type: String }) message = "";
  @property({ type: String }) type: "info" | "success" | "error" | "support" = "info";
  @property({ type: Boolean }) show = false;
  @property({ type: String }) lang: "ko" | "en" = "ko";
  @property({ type: String }) customTitle = "";

  protected override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("show")) {
      if (this.show) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }

  override disconnectedCallback() {
    document.body.style.overflow = "";
    super.disconnectedCallback();
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  protected override render() {
    if (!this.show) return html``;

    const isSupportOrSuccess = this.type === "success" || this.type === "support";

    const defaultTitle =
      this.customTitle ||
      (this.type === "support"
        ? this.lang === "ko"
          ? "☕ 개발자 응원하기"
          : "☕ Support the Developer"
        : this.type === "success"
          ? this.lang === "ko"
            ? "🎉 변환이 깔끔하게 끝났어요!"
            : "🎉 Completed Smoothly!"
          : this.type === "error"
            ? this.lang === "ko"
              ? "오류 안내"
              : "Error"
            : this.lang === "ko"
              ? "알림 메시지"
              : "Notification");

    return html`
      <div
        class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        @click="${(e: MouseEvent) => {
          if (e.target === e.currentTarget) this.handleClose();
        }}"
      >
        <div
          class="glass-panel rounded-3xl ${isSupportOrSuccess
            ? "max-w-lg"
            : "max-w-md"} w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-800 bg-slate-900/95 my-auto relative"
        >
          <!-- Modal Header -->
          <div
            class="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${this.type ===
                  "success" || this.type === "support"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : this.type === "error"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}"
              >
                ${this.type === "support"
                  ? html`<span class="text-lg">☕</span>`
                  : this.type === "success"
                    ? html`<i class="fa-solid fa-circle-check text-lg text-emerald-400"></i>`
                    : this.type === "error"
                      ? html`<i class="fa-solid fa-circle-exclamation text-lg"></i>`
                      : html`<i class="fa-solid fa-circle-info text-lg"></i>`}
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-100 tracking-wide font-sans">
                  ${defaultTitle}
                </h3>
              </div>
            </div>
            <button
              @click="${this.handleClose}"
              class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="${this.lang === "ko" ? "닫기" : "Close"}"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Modal Body (Single Smooth Scroll Container) -->
          <div class="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 font-sans text-sm">
            <!-- Result / Alert Message if any -->
            ${this.message
              ? html`
                  <div
                    class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-200 leading-relaxed font-medium whitespace-pre-wrap ${this
                      .type === "success"
                      ? "border-emerald-500/20 text-emerald-300"
                      : ""}"
                  >
                    ${this.message}
                  </div>
                `
              : ""}

            <!-- Warm supportive sub-message -->
            ${isSupportOrSuccess
              ? html`
                  <div class="text-center px-2 py-1">
                    <p class="text-xs text-slate-300 leading-relaxed font-sans">
                      ${this.lang === "ko"
                        ? "Batcher Tools가 소중한 작업 시간을 조금이나마 아껴드렸나요? 😊"
                        : "Did Batcher Tools save your valuable time? 😊"}
                      <br />
                      <span class="text-slate-400">
                        ${this.lang === "ko"
                          ? "보내주시는 따뜻한 커피 한 잔은 지속적인 업데이트와 관리에 정말 큰 힘이 됩니다."
                          : "A warm cup of coffee gives huge support for continuous updates and maintenance."}
                      </span>
                    </p>
                  </div>
                `
              : ""}

            <!-- Seamless Direct Buy Me a Coffee iFrame -->
            ${isSupportOrSuccess
              ? html`
                  <div
                    class="w-full rounded-2xl overflow-hidden shadow-inner bg-slate-950 border border-slate-800"
                  >
                    <iframe
                      src="https://buymeacoffee.com/widget/page/playNolang"
                      title="Buy Me a Coffee Widget"
                      class="w-full h-150 border-0 block"
                      scrolling="auto"
                      loading="lazy"
                    ></iframe>
                  </div>
                `
              : ""}
          </div>

          <!-- Modal Footer -->
          <div
            class="bg-slate-950/80 px-6 py-3.5 flex items-center justify-between border-t border-slate-800 shrink-0"
          >
            <div class="text-xs text-slate-500 font-medium">&copy; 2026 Batcher Tools</div>
            <button
              @click="${this.handleClose}"
              class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer font-sans"
            >
              ${this.lang === "ko" ? "닫기" : "Close"}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "alert-modal": AlertModal;
  }
}

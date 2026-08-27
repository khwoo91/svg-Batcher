import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { AudioClipItem } from "../types";
import { generateSmilXml, generateJsonData } from "../utils/audio-duration-utils";

@customElement("audio-timestamp-modal")
export class AudioTimestampModal extends LitElement {
  @property({ type: Boolean }) show = false;
  @property({ type: Array }) items: AudioClipItem[] = [];
  @property({ type: String }) lang: "ko" | "en" = "ko";

  @state() private activeTab: "table" | "smil" | "json" = "table";
  @state() private copiedToast = false;

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

  private async handleCopyContent() {
    let contentToCopy = "";
    if (this.activeTab === "json") {
      contentToCopy = generateJsonData(this.items);
    } else if (this.activeTab === "smil") {
      contentToCopy = generateSmilXml(this.items);
    } else {
      // Default: SMIL Tags list
      contentToCopy = this.items.map((item) => item.smilTag).join("\n");
    }

    try {
      await navigator.clipboard.writeText(contentToCopy);
      this.copiedToast = true;
      setTimeout(() => {
        this.copiedToast = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  private handleDownloadSmil() {
    const xmlContent = generateSmilXml(this.items);
    const blob = new Blob([xmlContent], { type: "application/smil+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio-clips-${Date.now()}.smil`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private handleDownloadJson() {
    const jsonContent = generateJsonData(this.items);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio-clips-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  protected override render() {
    if (!this.show) return html``;

    const isKo = this.lang === "ko";
    const totalDurationSec = this.items.reduce((acc, item) => acc + item.durationSec, 0);
    const smilContent = generateSmilXml(this.items);
    const jsonContent = generateJsonData(this.items);

    return html`
      <div
        class="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="bg-slate-950 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-800"
        >
          <!-- Header -->
          <div
            class="px-6 py-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg shadow-md"
              >
                <i class="fa-solid fa-stopwatch"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-100 font-sans tracking-tight">
                  ${isKo
                    ? "오디오 타임스탬프 (clipBegin / clipEnd) 추출 결과"
                    : "Audio Timestamps (clipBegin / clipEnd) Extracted"}
                </h3>
                <p class="text-xs text-slate-300 font-sans mt-0.5 font-medium">
                  ${isKo
                    ? `총 ${this.items.length}개 파일 (전체 길이: ${totalDurationSec.toFixed(2)}초)`
                    : `Total ${this.items.length} files (Total duration: ${totalDurationSec.toFixed(2)}s)`}
                </p>
              </div>
            </div>
            <button
              @click="${this.handleClose}"
              class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <i class="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          <!-- Tab Bar & Action Toolbar -->
          <div
            class="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0"
          >
            <!-- Tabs -->
            <div class="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                @click="${() => (this.activeTab = "table")}"
                class="px-4 py-1.5 rounded-lg text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${this
                  .activeTab === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-indigo-400 hover:bg-slate-800 font-bold"}"
              >
                <i class="fa-solid fa-table-list text-xs"></i>
                <span>${isKo ? "목록 테이블" : "Table View"}</span>
              </button>
              <button
                @click="${() => (this.activeTab = "smil")}"
                class="px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${this
                  .activeTab === "smil"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-indigo-400 hover:bg-slate-800 font-bold"}"
              >
                <i class="fa-solid fa-code text-xs"></i>
                <span>SMIL / XML</span>
              </button>
              <button
                @click="${() => (this.activeTab = "json")}"
                class="px-4 py-1.5 rounded-lg text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer ${this
                  .activeTab === "json"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-indigo-400 hover:bg-slate-800 font-bold"}"
              >
                <i class="fa-solid fa-file-code text-xs"></i>
                <span>JSON</span>
              </button>
            </div>

            <!-- Top Download & Copy Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="${this.handleCopyContent}"
                class="px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-indigo-600/20 border border-indigo-400/30"
              >
                ${this.copiedToast
                  ? html`<i class="fa-solid fa-check text-emerald-300 text-xs"></i>
                      <span class="text-emerald-100">${isKo ? "복사 완료!" : "Copied!"}</span>`
                  : html`<i class="fa-regular fa-copy text-xs"></i>
                      <span>${isKo ? "복사" : "Copy"}</span>`}
              </button>

              <button
                @click="${this.handleDownloadSmil}"
                class="px-4 py-2 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-purple-600/20 border border-purple-400/30"
              >
                <i class="fa-solid fa-file-code text-xs"></i>
                <span>${isKo ? "SMIL 다운로드" : "Download .smil"}</span>
              </button>

              <button
                @click="${this.handleDownloadJson}"
                class="px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold font-sans transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-emerald-600/20 border border-emerald-400/30"
              >
                <i class="fa-solid fa-file-arrow-down text-xs"></i>
                <span>${isKo ? "JSON 다운로드" : "Download .json"}</span>
              </button>
            </div>
          </div>

          <!-- Main Content Body (Unified Fixed Height) -->
          <div class="p-6 font-sans bg-slate-950">
            <div
              class="h-105 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-inner"
            >
              ${this.activeTab === "table"
                ? html`
                    <table class="w-full text-left text-xs text-slate-200 border-collapse">
                      <thead
                        class="sticky top-0 bg-slate-950 text-slate-200 font-extrabold border-b border-slate-800 z-10 shadow-sm"
                      >
                        <tr>
                          <th class="py-3.5 px-4 whitespace-nowrap text-slate-300">#</th>
                          <th class="py-3.5 px-4 whitespace-nowrap text-slate-100">
                            ${isKo ? "파일명" : "File Name"}
                          </th>
                          <th class="py-3.5 px-4 whitespace-nowrap text-emerald-400 font-extrabold">
                            ${isKo ? "길이 (초)" : "Duration"}
                          </th>
                          <th
                            class="py-3.5 px-4 whitespace-nowrap font-mono text-sky-400 font-extrabold"
                          >
                            clipBegin
                          </th>
                          <th
                            class="py-3.5 px-4 whitespace-nowrap font-mono text-fuchsia-400 font-extrabold"
                          >
                            clipEnd
                          </th>
                          <th class="py-3.5 px-4 whitespace-nowrap text-slate-200">
                            ${isKo ? "SMIL 태그" : "SMIL Tag"}
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-800/80 font-mono">
                        ${this.items.map(
                          (item, index) => html`
                            <tr class="hover:bg-slate-800/60 transition-colors">
                              <td class="py-3 px-4 whitespace-nowrap text-slate-400 font-sans">
                                ${index + 1}
                              </td>
                              <td
                                class="py-3 px-4 whitespace-nowrap font-sans font-extrabold text-slate-100 max-w-xs truncate"
                                title="${item.relativePath}"
                              >
                                ${item.name}
                              </td>
                              <td
                                class="py-3 px-4 whitespace-nowrap text-emerald-400 font-extrabold"
                              >
                                ${item.durationSec.toFixed(3)}s
                              </td>
                              <td class="py-3 px-4 whitespace-nowrap text-sky-300 font-bold">
                                ${item.clipBegin}
                              </td>
                              <td class="py-3 px-4 whitespace-nowrap text-fuchsia-300 font-bold">
                                ${item.clipEnd}
                              </td>
                              <td
                                class="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300 font-semibold select-all"
                              >
                                ${item.smilTag}
                              </td>
                            </tr>
                          `,
                        )}
                      </tbody>
                    </table>
                  `
                : ""}
              ${this.activeTab === "smil"
                ? html`
                    <pre
                      class="p-4 text-xs font-mono text-sky-300 leading-relaxed select-all"
                    ><code>${smilContent}</code></pre>
                  `
                : ""}
              ${this.activeTab === "json"
                ? html`
                    <pre
                      class="p-4 text-xs font-mono text-fuchsia-300 leading-relaxed select-all"
                    ><code>${jsonContent}</code></pre>
                  `
                : ""}
            </div>
          </div>

          <!-- Footer -->
          <div
            class="bg-slate-900 px-6 py-4 flex items-center justify-between border-t border-slate-800 shrink-0"
          >
            <div class="text-xs text-slate-300 font-sans font-medium flex items-center gap-1.5">
              <i class="fa-solid fa-circle-info text-indigo-400"></i>
              <span
                >${isKo
                  ? "브라우저 로컬 메모리에서 100% 안전하게 분석되었습니다."
                  : "Processed 100% locally in browser memory."}</span
              >
            </div>
            <button
              @click="${this.handleClose}"
              class="px-6 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
            >
              ${isKo ? "닫기" : "Close"}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "audio-timestamp-modal": AudioTimestampModal;
  }
}

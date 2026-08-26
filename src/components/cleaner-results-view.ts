import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BrokenLinkItem, UnusedFileItem, CleanScanResult } from "../types";

@customElement("cleaner-results-view")
export class CleanerResultsView extends LitElement {
  @property({ type: String }) lang: "ko" | "en" = "ko";
  @property({ type: Object }) scanResult: CleanScanResult | null = null;
  @property({ type: Boolean }) isExecuting = false;

  @state() private activeSubTab: "unused" | "broken" = "unused";
  @state() private unusedItems: UnusedFileItem[] = [];
  @state() private brokenItems: BrokenLinkItem[] = [];

  protected override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has("scanResult") && this.scanResult) {
      this.unusedItems = [...this.scanResult.unusedFiles];
      this.brokenItems = [...this.scanResult.brokenLinks];
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private toggleSelectAllUnused(checked: boolean) {
    this.unusedItems = this.unusedItems.map((item) => ({ ...item, selected: checked }));
  }

  private toggleUnusedItem(id: string) {
    this.unusedItems = this.unusedItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item,
    );
  }

  private toggleSelectAllBroken(checked: boolean) {
    this.brokenItems = this.brokenItems.map((item) => ({ ...item, selected: checked }));
  }

  private toggleBrokenItem(id: string) {
    this.brokenItems = this.brokenItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item,
    );
  }

  private handleExecute() {
    const selectedUnused = this.unusedItems.filter((i) => i.selected);
    const selectedBroken = this.brokenItems.filter((i) => i.selected);

    this.dispatchEvent(
      new CustomEvent("confirm-cleanup", {
        detail: {
          selectedUnused,
          selectedBroken,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const isKo = this.lang === "ko";

    if (!this.scanResult) {
      return html`
        <div
          class="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center shadow-xl"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-inner"
          >
            <i class="fa-solid fa-magnifying-glass-chart text-2xl"></i>
          </div>
          <h3 class="text-base font-bold text-slate-100">
            ${isKo ? "폴더 검사 대기 중" : "Ready to Scan Folder"}
          </h3>
          <p
            class="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed whitespace-pre-line"
          >
            ${isKo
              ? "정리를 시작할 폴더를 선택한 후,\n하단의 [🔍 검사 시작] 버튼을 누르면 정밀 검사 결과가 표시됩니다."
              : "Select a target folder and click [Start Scan]."}
          </p>
        </div>
      `;
    }

    const selectedUnusedCount = this.unusedItems.filter((i) => i.selected).length;
    const selectedUnusedBytes = this.unusedItems
      .filter((i) => i.selected)
      .reduce((acc, curr) => acc + curr.sizeBytes, 0);

    const selectedBrokenCount = this.brokenItems.filter((i) => i.selected).length;

    return html`
      <div
        class="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col text-slate-100 font-sans"
      >
        <!-- Header -->
        <div
          class="p-5 border-b border-slate-800/80 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner"
            >
              <i class="fa-solid fa-square-poll-vertical text-xl"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-100 text-base">
                ${isKo ? "폴더 정밀 검사 결과" : "Folder Analysis Results"}
              </h3>
              <p class="text-xs text-slate-400 mt-0.5">
                ${isKo
                  ? `검사 완료: 총 ${this.scanResult.scannedFileCount}개 파일 분석 · 정리 가능한 용량: ${this.formatBytes(this.scanResult.totalUnusedBytes)}`
                  : `Analyzed ${this.scanResult.scannedFileCount} files · Reclaimable: ${this.formatBytes(this.scanResult.totalUnusedBytes)}`}
              </p>
            </div>
          </div>
        </div>

        <!-- Sub-Tab Navigation Bar -->
        <div class="flex items-center gap-2 p-3 bg-slate-950/90 border-b border-slate-800 px-5">
          <button
            @click="${() => (this.activeSubTab = "unused")}"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${this
              .activeSubTab === "unused"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}"
          >
            <i class="fa-solid fa-trash-can"></i>
            <span>${isKo ? "사용하지 않는 파일" : "Unused Files"}</span>
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
            >
              ${this.unusedItems.length}
            </span>
          </button>

          <button
            @click="${() => (this.activeSubTab = "broken")}"
            class="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${this
              .activeSubTab === "broken"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"}"
          >
            <i class="fa-solid fa-link-slash"></i>
            <span>${isKo ? "잘못 연결된 링크" : "Broken Links"}</span>
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] ${this.brokenItems.length > 0
                ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 font-extrabold"
                : "bg-slate-800 text-slate-400"}"
            >
              ${this.brokenItems.length}
            </span>
          </button>
        </div>

        <!-- Tab Body Content -->
        <div class="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          ${this.activeSubTab === "unused"
            ? html`
                <!-- Unused Physical Files Tab -->
                <div class="space-y-4">
                  <div
                    class="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800"
                  >
                    <label
                      class="flex items-center space-x-2.5 cursor-pointer select-none text-xs font-bold text-slate-200"
                    >
                      <input
                        type="checkbox"
                        .checked="${this.unusedItems.length > 0 &&
                        this.unusedItems.every((i) => i.selected)}"
                        @change="${(e: Event) =>
                          this.toggleSelectAllUnused((e.target as HTMLInputElement).checked)}"
                        class="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                      />
                      <span>${isKo ? "전체 선택 / 해제" : "Select All / Deselect All"}</span>
                    </label>
                    <span class="text-xs font-medium text-slate-400">
                      ${isKo
                        ? `선택됨: ${selectedUnusedCount}개 / ${this.formatBytes(selectedUnusedBytes)}`
                        : `Selected: ${selectedUnusedCount} files / ${this.formatBytes(selectedUnusedBytes)}`}
                    </span>
                  </div>

                  ${this.unusedItems.length === 0
                    ? html`
                        <div class="text-center py-12 text-slate-400">
                          <i class="fa-solid fa-circle-check text-4xl text-emerald-400 mb-3"></i>
                          <p class="text-sm font-bold text-slate-200">
                            ${isKo
                              ? "사용하지 않는 방치된 파일이 없습니다!"
                              : "No unused files found!"}
                          </p>
                          <p class="text-xs text-slate-500 mt-1">
                            ${isKo
                              ? "선택한 폴더가 깨끗하게 관리되고 있습니다."
                              : "Your folder is clean."}
                          </p>
                        </div>
                      `
                    : html`
                        <div
                          class="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60 shadow-inner"
                        >
                          <table class="w-full text-left text-xs">
                            <thead
                              class="bg-slate-950 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-800"
                            >
                              <tr>
                                <th class="p-3.5 w-12 text-center">선택</th>
                                <th class="p-3.5">${isKo ? "파일 위치 (경로)" : "File Path"}</th>
                                <th class="p-3.5 w-24">${isKo ? "종류" : "Type"}</th>
                                <th class="p-3.5 w-32 text-right">${isKo ? "용량" : "Size"}</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/50 text-slate-300">
                              ${this.unusedItems.map(
                                (item) => html`
                                  <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td class="p-3.5 text-center">
                                      <input
                                        type="checkbox"
                                        .checked="${item.selected}"
                                        @change="${() => this.toggleUnusedItem(item.id)}"
                                        class="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                                      />
                                    </td>
                                    <td
                                      class="p-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 break-all select-all"
                                    >
                                      ${item.relativePath}
                                    </td>
                                    <td class="p-3.5 uppercase font-bold text-slate-400">
                                      ${item.extension}
                                    </td>
                                    <td class="p-3.5 text-right font-mono font-bold text-slate-300">
                                      ${this.formatBytes(item.sizeBytes)}
                                    </td>
                                  </tr>
                                `,
                              )}
                            </tbody>
                          </table>
                        </div>
                      `}
                </div>
              `
            : html`
                <!-- Broken Links Code Tab -->
                <div class="space-y-4">
                  <div
                    class="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800"
                  >
                    <label
                      class="flex items-center space-x-2.5 cursor-pointer select-none text-xs font-bold text-slate-200"
                    >
                      <input
                        type="checkbox"
                        .checked="${this.brokenItems.length > 0 &&
                        this.brokenItems.every((i) => i.selected)}"
                        @change="${(e: Event) =>
                          this.toggleSelectAllBroken((e.target as HTMLInputElement).checked)}"
                        class="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                      />
                      <span>${isKo ? "전체 선택 / 해제" : "Select All / Deselect All"}</span>
                    </label>
                    <span class="text-xs font-medium text-slate-400">
                      ${isKo
                        ? `선택됨: ${selectedBrokenCount}개`
                        : `Selected: ${selectedBrokenCount}`}
                    </span>
                  </div>

                  ${this.brokenItems.length === 0
                    ? html`
                        <div class="text-center py-12 text-slate-400">
                          <i class="fa-solid fa-link text-4xl text-emerald-400 mb-3"></i>
                          <p class="text-sm font-bold text-slate-200">
                            ${isKo
                              ? "잘못 연결된 링크나 파일 경로가 없습니다!"
                              : "No broken links found!"}
                          </p>
                        </div>
                      `
                    : html`
                        <div
                          class="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60 shadow-inner"
                        >
                          <table class="w-full text-left text-xs">
                            <thead
                              class="bg-slate-950 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-800"
                            >
                              <tr>
                                <th class="p-3.5 w-12 text-center">선택</th>
                                <th class="p-3.5">
                                  ${isKo ? "문서 위치 (파일명)" : "Document File"}
                                </th>
                                <th class="p-3.5 w-20 text-center">${isKo ? "줄" : "Line"}</th>
                                <th class="p-3.5">
                                  ${isKo ? "연결 문구 (스니펫)" : "Link Snippet"}
                                </th>
                                <th class="p-3.5">
                                  ${isKo ? "연결 실패한 파일 경로" : "Missing Target File"}
                                </th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800/50 text-slate-300">
                              ${this.brokenItems.map(
                                (item) => html`
                                  <tr class="hover:bg-slate-800/40 transition-colors">
                                    <td class="p-3.5 text-center">
                                      <input
                                        type="checkbox"
                                        .checked="${item.selected ?? true}"
                                        @change="${() => this.toggleBrokenItem(item.id)}"
                                        class="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                                      />
                                    </td>
                                    <!-- Separated Column 1: Source File Path ONLY -->
                                    <td
                                      class="p-3.5 font-mono font-bold text-amber-700 dark:text-amber-400 break-all select-all"
                                    >
                                      ${item.sourcePath}
                                    </td>
                                    <!-- Separated Column 2: Line Number Badge ONLY -->
                                    <td class="p-3.5 text-center">
                                      <span
                                        class="inline-block px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40 shadow-xs"
                                      >
                                        L${item.lineNumber}
                                      </span>
                                    </td>
                                    <!-- Column 3: Code Snippet -->
                                    <td
                                      class="p-3.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-slate-950/60 dark:bg-slate-950 rounded-lg border border-slate-800/90 break-all select-all"
                                    >
                                      ${item.snippet}
                                    </td>
                                    <!-- Column 4: Missing Target Path -->
                                    <td
                                      class="p-3.5 font-mono font-semibold text-rose-700 dark:text-rose-400 break-all select-all"
                                    >
                                      ${item.targetPath}
                                    </td>
                                  </tr>
                                `,
                              )}
                            </tbody>
                          </table>
                        </div>
                      `}
                </div>
              `}
        </div>

        <!-- Footer Action -->
        <div
          class="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between"
        >
          <div class="text-xs font-semibold text-slate-400">
            ${isKo
              ? `선택된 정리 항목: 사용하지 않는 파일 ${selectedUnusedCount}개 (${this.formatBytes(selectedUnusedBytes)}), 잘못된 링크 ${selectedBrokenCount}개`
              : `Targets selected: ${selectedUnusedCount} files (${this.formatBytes(selectedUnusedBytes)}), ${selectedBrokenCount} link entries`}
          </div>

          <button
            ?disabled="${this.isExecuting ||
            (selectedUnusedCount === 0 && selectedBrokenCount === 0)}"
            @click="${this.handleExecute}"
            class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <i class="fa-solid ${this.isExecuting ? "fa-spinner fa-spin" : "fa-broom"}"></i>
            <span>
              ${this.isExecuting
                ? isKo
                  ? "정리 진행 중..."
                  : "Cleaning..."
                : isKo
                  ? "선택한 항목 정리하기"
                  : "Execute Cleanup"}
            </span>
          </button>
        </div>
      </div>
    `;
  }
}

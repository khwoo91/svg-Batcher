import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BatchFile } from "../types";
import { scanDirectoryTreeFast, type FastFolderNode } from "../utils/fs-utils";

export type FolderNode = FastFolderNode;

@customElement("folder-tree-view")
export class FolderTreeView extends LitElement {
  @property({ type: Array }) files: BatchFile[] = [];
  @property({ type: Object }) dirHandle: FileSystemDirectoryHandle | null = null;
  @property({ type: String }) rootName = "";
  @property({ type: String }) selectedPath = "";
  @property({ type: String }) lang: "ko" | "en" = "ko";

  @state() private asyncTreeRoot: FolderNode | null = null;
  @state() private expandedPaths = new Set<string>();
  @state() private isLoadingTree = false;

  protected override createRenderRoot() {
    return this;
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has("files") ||
      changedProperties.has("dirHandle") ||
      changedProperties.has("rootName")
    ) {
      this.refreshTree();
    }
  }

  private async refreshTree() {
    // 1. Fast Directory-Only Tree Traversal (Sub-100ms instant tree loading without reading 90k files)
    if (this.dirHandle) {
      this.isLoadingTree = true;
      try {
        const tree = await scanDirectoryTreeFast(this.dirHandle);
        this.asyncTreeRoot = tree;
        if (tree) this.autoExpand(tree);
      } catch (err) {
        console.warn("Failed to scan directory tree fast:", err);
      } finally {
        this.isLoadingTree = false;
      }
      return;
    }

    // 2. Fallback: Build tree synchronously from file paths if files array is provided
    if (this.files && this.files.length > 0) {
      const tree = this.buildTreeFromFiles();
      this.asyncTreeRoot = tree;
      if (tree) this.autoExpand(tree);
    }
  }

  private autoExpand(root: FolderNode) {
    this.expandedPaths.clear();
    if (root) {
      this.expandedPaths.add(root.path);
    }
  }

  private buildTreeFromFiles(): FolderNode | null {
    if (!this.files || this.files.length === 0) return null;

    const rootPath = this.rootName || (this.dirHandle ? this.dirHandle.name : "Project");
    const rootNode: FolderNode = {
      name: rootPath,
      path: "",
      fileCount: this.files.length,
      children: [],
    };

    const nodeMap = new Map<string, FolderNode>();
    nodeMap.set("", rootNode);

    for (const f of this.files) {
      const parts = f.relativePath.split("/").filter(Boolean);
      parts.pop(); // Remove file name

      let currentPath = "";
      for (const part of parts) {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodeMap.has(currentPath)) {
          const newNode: FolderNode = {
            name: part,
            path: currentPath,
            fileCount: 0,
            children: [],
          };
          nodeMap.set(currentPath, newNode);

          const parentNode = nodeMap.get(parentPath);
          if (parentNode) {
            parentNode.children.push(newNode);
          }
        }
        nodeMap.get(currentPath)!.fileCount++;
      }
    }

    return rootNode;
  }

  private handleNodeClick(node: FolderNode, e: Event) {
    e.stopPropagation();

    // Toggle open/close subfolders on click
    if (node.children && node.children.length > 0) {
      if (this.expandedPaths.has(node.path)) {
        this.expandedPaths.delete(node.path);
      } else {
        this.expandedPaths.add(node.path);
      }
    }

    // Set target scope without triggering scan
    this.dispatchEvent(
      new CustomEvent("select-folder-scope", {
        detail: { path: node.path },
        bubbles: true,
        composed: true,
      }),
    );
    this.requestUpdate();
  }

  private renderNode(node: FolderNode, level = 0): any {
    const hasChildren = node.children.length > 0;
    const isExpanded = this.expandedPaths.has(node.path);
    const isSelected = this.selectedPath === node.path || (node.path === "" && !this.selectedPath);

    return html`
      <div class="select-none font-sans">
        <div
          @click="${(e: Event) => this.handleNodeClick(node, e)}"
          class="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs transition-colors cursor-pointer hover:bg-slate-800/50 dark:hover:bg-slate-800/60 ${isSelected
            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs"
            : "text-slate-200 dark:text-slate-200"}"
          style="padding-left: ${Math.max(8, level * 18 + 8)}px;"
        >
          <div class="flex items-center space-x-2 truncate min-w-0 flex-1 mr-2">
            ${hasChildren
              ? html`
                  <button
                    @click="${(e: Event) => this.handleNodeClick(node, e)}"
                    class="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-transform ${isExpanded
                      ? "rotate-90 text-amber-500 dark:text-amber-400"
                      : ""}"
                  >
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                `
              : html`<span class="w-4"></span>`}

            <i
              class="fa-solid ${isSelected
                ? "fa-crosshairs text-emerald-600 dark:text-emerald-400"
                : isExpanded
                  ? "fa-folder-open text-amber-500 dark:text-amber-400"
                  : "fa-folder text-amber-500/80 dark:text-amber-400/80"} text-xs shrink-0"
            ></i>
            <span class="truncate text-xs">${node.name}</span>
          </div>

          <div class="flex items-center space-x-1.5 shrink-0 ml-auto">
            <span
              class="text-[10px] px-2 py-0.5 rounded-full ${isSelected
                ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30"
                : "bg-slate-800/90 text-slate-400"} font-mono"
            >
              ${node.fileCount}${this.lang === "ko" ? "개" : " files"}
            </span>
          </div>
        </div>

        ${hasChildren && isExpanded
          ? html`
              <div class="border-l border-slate-800/60 dark:border-slate-800/80 ml-3.5 my-0.5">
                ${node.children.map((child) => this.renderNode(child, level + 1))}
              </div>
            `
          : ""}
      </div>
    `;
  }

  override render() {
    if (this.isLoadingTree) {
      return html`
        <div class="w-full p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400 font-sans">
          <i class="fa-solid fa-spinner fa-spin text-emerald-400 mr-2"></i>
          <span>${this.lang === "ko" ? "하위 폴더 구조 탐색 중..." : "Exploring subfolder structure..."}</span>
        </div>
      `;
    }

    const tree = this.asyncTreeRoot;
    if (!tree) return html``;

    return html`
      <div
        class="w-full p-4 bg-slate-950/60 dark:bg-slate-950/80 border border-slate-800/80 rounded-xl text-left font-sans shadow-inner"
      >
        <div
          class="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between pb-2.5 border-b border-slate-800/80"
        >
          <span class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <i class="fa-solid fa-folder-tree text-xs"></i>
            <span class="font-bold text-sm">${this.lang === "ko" ? "폴더 구조 탐색기" : "Folder Structure Explorer"}</span>
          </span>
          <span class="text-[11px] text-slate-400 font-normal">
            ${this.lang === "ko" ? "클릭하여 정리 대상 폴더 선택" : "Click to select target folder"}
          </span>
        </div>

        <div class="max-h-95 overflow-y-auto space-y-0.5 custom-scrollbar pr-1.5">
          ${this.renderNode(tree)}
        </div>

        <div
          class="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-amber-600 dark:text-amber-300/90 flex items-center space-x-2"
        >
          <i class="fa-solid fa-lightbulb text-amber-500 dark:text-amber-400 shrink-0 text-xs"></i>
          <span>
            ${this.lang === "ko"
              ? html`목록에서 정리를 원하는 하위 폴더를 클릭한 뒤, 하단의 <strong>[검사 시작]</strong> 버튼을 누르면 해당 영역만 검사합니다.`
              : html`Click a subfolder in the tree and press <strong>[Start Scan]</strong> to target that subfolder.`}
          </span>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "folder-tree-view": FolderTreeView;
  }
}

import type { scanner } from "../../wailsjs/go/models";
import { formatSize } from "./formatters";

/**
 * Export scan results to JSON
 */
export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

/**
 * Export dev scan results to CSV
 */
export function exportDevResultsToCSV(
  categories: scanner.Category[],
  filename: string
): void {
  const rows: string[][] = [
    ["Category", "Size (Bytes)", "Size (Human)", "Item Count", "Has Children"],
  ];

  function flattenCategories(cats: scanner.Category[], prefix = ""): void {
    for (const cat of cats) {
      const name = prefix ? `${prefix} > ${cat.name}` : cat.name;
      rows.push([
        name,
        cat.size.toString(),
        formatSize(cat.size),
        cat.itemCount.toString(),
        cat.children && cat.children.length > 0 ? "Yes" : "No",
      ]);
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, name);
      }
    }
  }

  flattenCategories(categories);
  downloadCSV(rows, filename);
}

/**
 * Export file tree results to CSV
 */
export function exportFileTreeToCSV(
  nodes: scanner.FileNode[],
  currentPath: string,
  filename: string
): void {
  const rows: string[][] = [
    ["Name", "Type", "Size (Bytes)", "Size (Human)", "Path"],
  ];

  for (const node of nodes) {
    rows.push([
      node.name,
      node.isDir ? "Folder" : "File",
      node.size.toString(),
      formatSize(node.size),
      node.path,
    ]);
  }

  downloadCSV(rows, filename);
}

/**
 * Export large files to CSV
 */
export function exportLargeFilesToCSV(
  files: scanner.LargeFile[],
  filename: string
): void {
  const rows: string[][] = [
    ["Name", "Size (Bytes)", "Size (Human)", "Path", "Modified"],
  ];

  for (const file of files) {
    rows.push([
      file.name,
      file.size.toString(),
      formatSize(file.size),
      file.path,
      file.modTime || "",
    ]);
  }

  downloadCSV(rows, filename);
}

/**
 * Export duplicates to CSV
 */
export function exportDuplicatesToCSV(
  groups: scanner.DuplicateGroup[],
  filename: string
): void {
  const rows: string[][] = [
    ["Group Hash", "File Count", "File Size", "Wasted Space", "Paths"],
  ];

  for (const group of groups) {
    rows.push([
      group.hash,
      group.files.length.toString(),
      formatSize(group.size),
      formatSize(group.wastedSize),
      group.files.map((f) => f.path).join("; "),
    ]);
  }

  downloadCSV(rows, filename);
}

/**
 * Convert rows to CSV and download
 */
function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");

  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/**
 * Trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

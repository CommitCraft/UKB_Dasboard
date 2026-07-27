import React, { useState, useEffect, useCallback, useMemo } from "react";
import ExcelJS from "exceljs";
import Layout from "../../components/Layout/Layout";

// ===== CONFIGURATION =====
const API_BASE_URL = "http://192.168.1.34:1880";
const ROWS_PER_PAGE_OPTIONS = [100, 200, 500, 1000, 2000, 5000, 10000];

const DEFAULT_ROWS_PER_PAGE = 100;

// ===== UTILITY FUNCTIONS =====
// const debounce = (func, wait) => {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

const formatValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "✓" : "✗";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleString();
  }
  return value;
};
// Utility function ADD karo (upar utilities ke niche)
const formatColumnName = (key = "") => {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// ===== MAIN COMPONENT =====
export default function RunOut() {
  // ===== STATE MANAGEMENT =====
  const [fullData, setFullData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // table | cards
  const [filterPresets, setFilterPresets] = useState([]);
  const [showFilterPresets, setShowFilterPresets] = useState(false);

  const totalPages = Math.ceil(totalRecords / rowsPerPage);

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const offset = (currentPage - 1) * rowsPerPage;
    let url = `${API_BASE_URL}/runout_log?limit=${rowsPerPage}&offset=${offset}`;

    if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&to=${encodeURIComponent(toDate)}`;
    if (searchText.trim())
      url += `&search=${encodeURIComponent(searchText.trim())}`;
    if (sortConfig.key) {
      url += `&sortBy=${sortConfig.key}&sortDir=${sortConfig.direction}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const result = await res.json();
      const data = Array.isArray(result) ? result : result.data || [];
      const total = Array.isArray(result) ? result.length : result.total || 0;

      setFullData(data);
      setTotalRecords(total);

      if (data.length > 0) {
        const cols = Object.keys(data[0]);
        setColumns(cols);
        if (visibleColumns.length === 0) {
          setVisibleColumns(cols);
        }
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setError(
        "Failed to load data. Please check your connection and try again.",
      );
      setFullData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, fromDate, toDate, searchText, sortConfig]);

  // ===== CLIENT-SIDE SORTING =====
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return fullData;

    return [...fullData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [fullData, sortConfig]);

  // ===== SORTING HANDLER =====
  const handleSort = (columnKey) => {
    let direction = "asc";
    if (sortConfig.key === columnKey && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: columnKey, direction });
  };

  // ===== EXPORT TO EXCEL =====
  const exportToExcel = async (exportAll = true) => {
    setExporting(true);
    try {
      const dataToExport = exportAll
        ? await fetchAllData()
        : selectedRows.size > 0
          ? fullData.filter((_, idx) => selectedRows.has(idx))
          : fullData;

      if (!dataToExport || dataToExport.length === 0) {
        alert("No data to export");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("RunOut_Logbook");

      workbook.creator = "EpackCFF System";
      workbook.created = new Date();

      // 🔑 BACKEND KEYS (DO NOT FORMAT)
      const keys = Object.keys(dataToExport[0]);

      // 👀 DISPLAY HEADERS (FORMATTED)
      const headers = keys.map(formatColumnName);

      // Header row
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 25;

      // ✅ DATA ROWS (BACKEND KEYS ONLY)
      // Add Data Rows
      dataToExport.forEach((record, idx) => {
        const row = worksheet.addRow(
          keys.map((k) => {
            const value = record[k];
            if (
              typeof value === "string" &&
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
            ) {
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) {
                return parsed;
              }
            }

            return value;
          }),
        );

        if (idx % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F4F6" },
          };
        }
      });

      // Apply Date Format Once
      worksheet.columns.forEach((column) => {
        column.eachCell((cell) => {
          if (cell.value instanceof Date) {
            cell.numFmt = "dd-mmm-yyyy hh:mm:ss";
          }
        });
      });

      // Auto width
      worksheet.columns.forEach((column) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const v = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, v.length);
        });
        column.width = Math.min(maxLength + 3, 60);
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };

      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `EpackCFF_Logbook_${
        new Date().toISOString().split("T")[0]
      }_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);

      setSelectedRows(new Set());
    } catch (e) {
      console.error("Export error:", e);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const fetchAllData = async () => {
    let url = `${API_BASE_URL}/runout_log/export`;
    const params = [];

    if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`);
    if (toDate) params.push(`to=${encodeURIComponent(toDate)}`);
    if (searchText.trim())
      params.push(`search=${encodeURIComponent(searchText.trim())}`);

    if (params.length) url += "?" + params.join("&");

    const res = await fetch(url);
    if (!res.ok) throw new Error("Export failed");
    return await res.json();
  };

  // ===== SEARCH & FILTER HANDLERS =====
  const handleSearch = () => {
    if (searchInput.length > 0 && searchInput.length < 3) {
      alert("Enter at least 3 characters to search");
      return;
    }

    setSearchText(searchInput);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSearchText("");
    setSearchInput("");
    setSortConfig({ key: null, direction: null });
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  // ===== COLUMN VISIBILITY =====
  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  const toggleAllColumns = () => {
    setVisibleColumns(visibleColumns.length === columns.length ? [] : columns);
  };

  // ===== ROW SELECTION =====
  const toggleRowSelection = (idx) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(idx)) {
      newSelection.delete(idx);
    } else {
      newSelection.add(idx);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === fullData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(fullData.map((_, idx) => idx)));
    }
  };

  // ===== FILTER PRESETS =====
  const saveFilterPreset = () => {
    const presetName = prompt("Enter preset name:");
    if (!presetName) return;

    const preset = {
      name: presetName,
      fromDate,
      toDate,
      searchText,
      timestamp: new Date().toISOString(),
    };

    const newPresets = [...filterPresets, preset];
    setFilterPresets(newPresets);
    localStorage.setItem("logbookFilterPresets", JSON.stringify(newPresets));
  };

  const loadFilterPreset = (preset) => {
    setFromDate(preset.fromDate);
    setToDate(preset.toDate);
    setSearchText(preset.searchText);
    setSearchInput(preset.searchText || "");
    setShowFilterPresets(false);
  };

  const deleteFilterPreset = (index) => {
    const newPresets = filterPresets.filter((_, i) => i !== index);
    setFilterPresets(newPresets);
    localStorage.setItem("logbookFilterPresets", JSON.stringify(newPresets));
  };

  // ===== EFFECTS =====
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const saved = localStorage.getItem("logbookFilterPresets");
    if (saved) {
      setFilterPresets(JSON.parse(saved));
    }
  }, []);

  // ===== RENDER: STATS BAR =====
  const StatsBar = () => (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-400">
          {totalRecords.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">Total Records</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400">
          {fullData.length}
        </div>
        <div className="text-sm text-gray-400">Current Page</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-400">
          {selectedRows.size}
        </div>
        <div className="text-sm text-gray-400">Selected</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-yellow-400">
          {visibleColumns.length}/{columns.length}
        </div>
        <div className="text-sm text-gray-400">Visible Columns</div>
      </div>
    </div>
  );

  // ===== RENDER: TOOLBAR =====
  const Toolbar = () => (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          {viewMode === "table" ? "📊" : "📋"}{" "}
          {viewMode === "table" ? "Card View" : "Table View"}
        </button>

        <button
          onClick={() => setShowColumnSelector(!showColumnSelector)}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          👁️ Columns ({visibleColumns.length})
        </button>

        <button
          onClick={() => setShowFilterPresets(!showFilterPresets)}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          ⭐ Presets ({filterPresets.length})
        </button>

        <button
          onClick={saveFilterPreset}
          disabled={!fromDate && !toDate && !searchInput}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 px-4 py-2 rounded transition-colors flex items-center gap-2"
        >
          💾 Save Filter
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => exportToExcel(false)}
            disabled={
              exporting || (selectedRows.size === 0 && fullData.length === 0)
            }
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            {selectedRows.size > 0
              ? `📤 Export Selected (${selectedRows.size})`
              : "📤 Export Page"}
          </button>
          <button
            onClick={() => exportToExcel(true)}
            disabled={exporting || totalRecords === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            {exporting ? "⏳ Exporting..." : "📥 Export All"}
          </button>
        </div>
      </div>

      {/* Column Selector */}
      {showColumnSelector && (
        <div className="bg-gray-700 rounded p-4 max-h-64 overflow-y-auto">
          <div className="flex justify-between mb-3">
            <h3 className="font-semibold">Select Columns</h3>
            <button
              onClick={toggleAllColumns}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              {visibleColumns.length === columns.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {columns.map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col)}
                  onChange={() => toggleColumnVisibility(col)}
                  className="w-4 h-4"
                />
                <span className="text-sm truncate">
                  {formatColumnName(col)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter Presets */}
      {showFilterPresets && (
        <div className="bg-gray-700 rounded p-4">
          <h3 className="font-semibold mb-3">Saved Filter Presets</h3>
          {filterPresets.length === 0 ? (
            <p className="text-gray-400 text-sm">No saved presets</p>
          ) : (
            <div className="space-y-2">
              {filterPresets.map((preset, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-600 p-3 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-400">
                      {preset.fromDate && `From: ${preset.fromDate}`}
                      {preset.toDate && ` To: ${preset.toDate}`}
                      {preset.searchText && ` | Search: "${preset.searchText}"`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadFilterPreset(preset)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteFilterPreset(idx)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===== RENDER: FILTERS =====
  const Filters = () => (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {/* From Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">📅 From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* To Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">📅 To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search */}
        <div className="flex flex-col flex-1 min-w-[250px]">
          <label className="text-sm font-medium mb-1">🔎 Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search across all fields..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Apply */}
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium transition-colors"
        >
          {loading ? "⏳ Loading..." : "Apply"}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded transition-colors"
        >
          Reset
        </button>

        {/* Rows per page */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-400">Rows:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // ===== RENDER: TABLE VIEW =====
  const TableView = () => (
    <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 border border-gray-600">
              <input
                type="checkbox"
                checked={
                  selectedRows.size === fullData.length && fullData.length > 0
                }
                onChange={toggleAllRows}
                className="w-4 h-4 cursor-pointer"
              />
            </th>
            {visibleColumns.map((col) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="px-4 py-3 border border-gray-600 text-left cursor-pointer hover:bg-gray-600 transition-colors select-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{formatColumnName(col)}</span>
                  <span className="text-xs">
                    {sortConfig.key === col ? (
                      sortConfig.direction === "asc" ? (
                        "▲"
                      ) : (
                        "▼"
                      )
                    ) : (
                      <span className="opacity-30">⇅</span>
                    )}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="text-center p-12"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-gray-400">Loading data...</p>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="text-center p-12"
              >
                <div className="text-gray-400">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-lg">No records found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={idx}
                className={`hover:bg-gray-700/50 transition-colors ${
                  selectedRows.has(idx) ? "bg-blue-900/30" : ""
                }`}
              >
                <td className="px-4 py-2 border border-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(idx)}
                    onChange={() => toggleRowSelection(idx)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                {visibleColumns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 border border-gray-700 max-w-xs truncate"
                    title={row[col]}
                  >
                    {formatValue(row[col])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // ===== RENDER: CARD VIEW =====
  const CardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading ? (
        <div className="col-span-full text-center p-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-400 mt-4">Loading data...</p>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="col-span-full text-center p-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-lg">No records found</p>
        </div>
      ) : (
        sortedData.map((row, idx) => (
          <div
            key={idx}
            className={`bg-gray-800 rounded-lg p-4 border-2 transition-all hover:shadow-lg ${
              selectedRows.has(idx) ? "border-blue-500" : "border-gray-700"
            }`}
            onClick={() => toggleRowSelection(idx)}
          >
            <div className="flex items-center justify-between mb-3">
              <input
                type="checkbox"
                checked={selectedRows.has(idx)}
                onChange={() => toggleRowSelection(idx)}
                className="w-5 h-5 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-gray-500">Record #{idx + 1}</span>
            </div>
            <div className="space-y-2">
              {visibleColumns.map((col) => (
                <div key={col} className="flex flex-col">
                  <span className="text-xs text-gray-400 font-medium">
                    {formatColumnName(col)}
                  </span>

                  <span className="text-sm break-words">
                    {formatValue(row[col])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ===== RENDER: PAGINATION =====
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const showPages = 5;
      let start = Math.max(1, currentPage - Math.floor(showPages / 2));
      let end = Math.min(totalPages, start + showPages - 1);

      if (end - start + 1 < showPages) {
        start = Math.max(1, end - showPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    };

    return (
      <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
          title="First page"
        >
          ⏮️
        </button>
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
          title="Previous page"
        >
          ◀️
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-2 rounded transition-colors ${
              currentPage === page
                ? "bg-blue-600 text-white font-bold"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
          title="Next page"
        >
          ▶️
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded transition-colors"
          title="Last page"
        >
          ⏭️
        </button>

        <span className="px-4 py-2 bg-gray-800 rounded ml-2">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>
      </div>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <Layout>
      <div className="bg-gray-900 text-gray-100 min-h-screen p-4 md:p-6">
        <div className="max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              EpackCFF Sri City – RunOut Logbook
            </h1>
            {/* <p className="text-gray-400 text-sm">Advanced Data Management & Export System</p> */}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border-2 border-red-700 text-red-200 px-6 py-4 rounded-lg mb-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-2xl hover:text-red-400"
              >
                ✕
              </button>
            </div>
          )}

          {/* {StatsBar()} */}
          {Toolbar()}
          {Filters()}

          {viewMode === "table" ? TableView() : CardView()}
          {Pagination()}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Last updated: {new Date().toLocaleString()}</p>
            <p className="mt-1">
              Powered by EpackCFF Logbook System |{" "}
              {totalRecords.toLocaleString()} total records
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

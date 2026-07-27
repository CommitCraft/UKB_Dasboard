import React, { useCallback, useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import Layout from "../components/Layout/Layout";

const API_BASE_URL = "http://192.168.1.34:1880";
const API_ENDPOINT = "/reliability_spec_master";
const EXPORT_ENDPOINT = "/reliability_spec_master/export";

const DEFAULT_ROWS_PER_PAGE = 100;

const EMPTY_FORM = {
  part_mes_code: "",
  part_description: "",
  sap_code: "",
  customer_part_code: "",
  customer: "",
  rm_grade: "",
  part_weight: "",

  tensile_spec: "",
  tensile_frequency: "Daily",

  torque_spec: "",
  torque_frequency: "Daily",

  horizontal_drop_spec: "",
  horizontal_drop_frequency: "Daily",

  vertical_drop_end_bush_spec: "",
  vertical_drop_end_bush_frequency: "Daily",

  vertical_drop_shaft_side_spec: "",
  vertical_drop_shaft_side_frequency: "Daily",

  hrpm_spec: "",
  hrpm_frequency: "Monthly",

  after_hrpm_balancing_spec: "",
  after_hrpm_balancing_frequency: "Monthly",

  cold_test_spec: "",
  cold_test_frequency: "Monthly",

  hot_test_spec: "",
  hot_test_frequency: "Monthly",
};

const FIELD_GROUPS = [
  {
    title: "Part Details",
    fields: [
      ["part_mes_code", "Part MES Code"],
      ["part_description", "Part Description"],
      ["sap_code", "SAP Code"],
      ["customer_part_code", "Customer Part Code"],
      ["customer", "Customer"],
      ["rm_grade", "RM Grade"],
      ["part_weight", "Part Weight"],
    ],
  },
  {
    title: "Daily Reliability Tests",
    fields: [
      ["tensile_spec", "Tensile Spec."],
      ["tensile_frequency", "Tensile Frequency"],
      ["torque_spec", "Torque Spec."],
      ["torque_frequency", "Torque Frequency"],
      ["horizontal_drop_spec", "Horizontal Drop Test Spec."],
      ["horizontal_drop_frequency", "Horizontal Drop Frequency"],
      ["vertical_drop_end_bush_spec", "Vertical Drop End Bush Side Spec."],
      ["vertical_drop_end_bush_frequency", "Vertical Drop End Bush Frequency"],
      ["vertical_drop_shaft_side_spec", "Vertical Drop Shaft Side Spec."],
      ["vertical_drop_shaft_side_frequency", "Vertical Drop Shaft Frequency"],
    ],
  },
  {
    title: "Monthly Reliability Tests",
    fields: [
      ["hrpm_spec", "HRPM Spec. ON/OFF 15 sec"],
      ["hrpm_frequency", "HRPM Frequency"],
      ["after_hrpm_balancing_spec", "After HRPM Balancing Spec."],
      ["after_hrpm_balancing_frequency", "After HRPM Balancing Frequency"],
      ["cold_test_spec", "COLD Test Spec. 168 Hr."],
      ["cold_test_frequency", "COLD Test Frequency"],
      ["hot_test_spec", "HOT Test Spec. 168 Hr."],
      ["hot_test_frequency", "HOT Test Frequency"],
    ],
  },
];

const TABLE_COLUMNS = [
  ["serial_number", "Sr. No."],
  ["part_mes_code", "Part MES Code"],
  ["part_description", "Part Description"],
  ["sap_code", "SAP Code"],
  ["customer_part_code", "Customer Part Code"],
  ["customer", "Customer"],
  ["rm_grade", "RM Grade"],
  ["part_weight", "Part Weight"],
  ["tensile_spec", "Tensile Spec."],
  ["torque_spec", "Torque Spec."],
  ["horizontal_drop_spec", "Horizontal Drop Spec."],
  ["vertical_drop_end_bush_spec", "Vertical Drop End Bush Spec."],
  ["vertical_drop_shaft_side_spec", "Vertical Drop Shaft Side Spec."],
  ["hrpm_spec", "HRPM Spec."],
  ["after_hrpm_balancing_spec", "After HRPM Balancing Spec."],
  ["cold_test_spec", "COLD Test Spec."],
  ["hot_test_spec", "HOT Test Spec."],
];

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

export default function ReliabilitySpecMaster() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);

  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const offset = (currentPage - 1) * rowsPerPage;

    let url = `${API_BASE_URL}${API_ENDPOINT}?limit=${rowsPerPage}&offset=${offset}`;

    if (searchText.trim()) {
      url += `&search=${encodeURIComponent(searchText.trim())}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reliability spec master");

      const data = await res.json();

      const rows = Array.isArray(data) ? data : data.data || [];

      setRecords(rows);
      setHasNextPage(rows.length === rowsPerPage);
    } catch (err) {
      console.error(err);
      alert("Failed to load data. Please check Node-RED API.");
      setRecords([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = () => {
    if (searchInput.length > 0 && searchInput.length < 2) {
      alert("Enter at least 2 characters to search");
      return;
    }

    setSearchText(searchInput);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleEdit = (row) => {
    const updatedForm = { ...EMPTY_FORM };

    Object.keys(updatedForm).forEach((key) => {
      updatedForm[key] = row[key] || "";
    });

    setForm(updatedForm);
    setEditingId(row.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.part_mes_code.trim()) {
      alert("Part MES Code is required");
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API_BASE_URL}${API_ENDPOINT}/${editingId}`
        : `${API_BASE_URL}${API_ENDPOINT}`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Save failed");

      alert(
        editingId ? "Record updated successfully" : "Record added successfully",
      );

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete Part MES Code "${row.part_mes_code}"?`);

    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINT}/${row.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      alert("Record deleted successfully");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete record");
    }
  };

  const exportToExcel = async () => {
    try {
      let url = `${API_BASE_URL}${EXPORT_ENDPOINT}`;

      if (searchText.trim()) {
        url += `?search=${encodeURIComponent(searchText.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const data = await res.json();
      const rows = Array.isArray(data) ? data : data.data || [];

      if (!rows.length) {
        alert("No data to export");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reliability_Spec_Master");

      const headers = TABLE_COLUMNS.map(([, label]) => label);
      const keys = TABLE_COLUMNS.map(([key]) => key);

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      rows.forEach((row, index) => {
        const excelRow = worksheet.addRow(
          keys.map((key) => {
            if (key === "serial_number") return index + 1;
            return row[key] || "";
          }),
        );

        if (index % 2 === 0) {
          excelRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF3F4F6" },
          };
        }
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 12;

        column.eachCell({ includeEmpty: true }, (cell) => {
          const value = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, value.length);
        });

        column.width = Math.min(maxLength + 3, 50);
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Reliability_Spec_Master_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    }
  };

  const canGoNext = hasNextPage;

  const renderedRows = useMemo(() => records, [records]);

  return (
    <Layout>
      <div className="bg-gray-900 text-gray-100 min-h-screen p-4 md:p-6">
        <div className="max-w-[1700px] mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Reliability Test Spec Master
            </h1>
            <p className="text-gray-400">
              Part-wise reliability specification system
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col flex-1 min-w-[260px]">
              <label className="text-sm font-medium mb-1">Search</label>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search Part MES Code, Customer, SAP Code..."
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded"
            >
              Search
            </button>

            <button
              onClick={() => {
                setSearchInput("");
                setSearchText("");
                setCurrentPage(1);
              }}
              className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded"
            >
              Reset
            </button>

            <button
              onClick={() => {
                resetForm();
                setShowForm((prev) => !prev);
              }}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded"
            >
              {showForm ? "Close Form" : "Add New"}
            </button>

            <button
              onClick={exportToExcel}
              className="bg-orange-600 hover:bg-orange-700 px-5 py-2 rounded"
            >
              Export Excel
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-400">Rows:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                {[100, 200, 500, 1000].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-gray-800 rounded-lg p-5 mb-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingId ? "Edit Reliability Spec" : "Add Reliability Spec"}
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">
                    {group.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.fields.map(([key, label]) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-sm font-medium mb-1">
                          {label}
                          {key === "part_mes_code" && (
                            <span className="text-red-400"> *</span>
                          )}
                        </label>

                        <input
                          value={form[key] || ""}
                          onChange={(e) =>
                            handleInputChange(key, e.target.value)
                          }
                          placeholder={label}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Record"
                      : "Save Record"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-700 sticky top-0 z-10">
                <tr>
                  {TABLE_COLUMNS.map(([key, label]) => (
                    <th
                      key={key}
                      className="px-4 py-3 border border-gray-600 text-left whitespace-nowrap"
                    >
                      {label}
                    </th>
                  ))}

                  <th className="px-4 py-3 border border-gray-600 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length + 1}
                      className="text-center p-12"
                    >
                      Loading data...
                    </td>
                  </tr>
                ) : renderedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMNS.length + 1}
                      className="text-center p-12 text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  renderedRows.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      {TABLE_COLUMNS.map(([key]) => (
                        <td
                          key={key}
                          className="px-4 py-2 border border-gray-700 max-w-xs truncate"
                          title={String(row[key] ?? "")}
                        >
                          {formatValue(row[key])}
                        </td>
                      ))}

                      <td className="px-4 py-2 border border-gray-700">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(row)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(row)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center gap-3 mt-6">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              First
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              Prev
            </button>

            <span className="px-4 py-2 bg-gray-800 rounded">
              Page <strong>{currentPage}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              Next
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Reliability Test Spec Master | CRUD + Search + Excel Export
          </div>
        </div>
      </div>
    </Layout>
  );
}

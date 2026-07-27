import React, { useCallback, useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import Layout from "../components/Layout/Layout";

const API_BASE_URL = "http://192.168.1.34:1880";

const LOG_API = "/reliability_lab_test_log";
const LOG_EXPORT_API = "/reliability_lab_test_log/export";
const MASTER_API = "/reliability_spec_master";

const DEFAULT_ROWS_PER_PAGE = 100;

const today = new Date().toISOString().split("T")[0];

const currentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

const EMPTY_FORM = {
  log_date: today,
  log_time: currentTime(),

  reliability_lab_supervisor: "",
  part_qr_number: "",

  part_description: "",
  sap_code: "",
  customer_part_code: "",
  customer: "",
  rm_grade: "",
  part_weight: "",

  tensile_spec: "",
  tensile_actual: "",

  torque_spec: "",
  torque_actual: "",

  horizontal_drop_spec: "",
  horizontal_drop_result: "",

  vertical_drop_end_bush_spec: "",
  vertical_drop_end_bush_result: "",

  vertical_drop_shaft_side_spec: "",
  vertical_drop_shaft_side_result: "",

  final_drop_test_result: "",

  hrpm_spec: "",
  after_hrpm_balancing_spec: "",
  after_hrpm_left_balancing_value: "",
  after_hrpm_right_balancing_value: "",
  hrpm_result: "",

  cold_test_spec: "",
  cold_test_result: "",

  hot_test_spec: "",
  hot_test_result: "",

  final_result: "",
};

const RESULT_OPTIONS = ["", "Pass", "Fail", "NA"];

const TABLE_COLUMNS = [
  ["serial_number", "Sr. No."],
  ["log_date", "Date"],
  ["log_time", "Time"],
  ["reliability_lab_supervisor", "Reliability Lab Supervisor"],
  ["part_qr_number", "Part QR Number"],
  ["part_description", "Part Description"],
  ["sap_code", "SAP Code"],
  ["customer_part_code", "Customer Part Code"],
  ["customer", "Customer"],
  ["rm_grade", "RM Grade"],
  ["part_weight", "Part Weight"],
  ["tensile_spec", "Tensile Spec."],
  ["tensile_actual", "Tensile Actual Daily"],
  ["torque_spec", "Torque Spec."],
  ["torque_actual", "Torque Actual Daily"],
  ["horizontal_drop_spec", "Horizontal Drop Test Spec."],
  ["horizontal_drop_result", "Horizontal Drop Test Result"],
  ["vertical_drop_end_bush_spec", "Vertical Drop End Bush Side Spec."],
  ["vertical_drop_end_bush_result", "Vertical Drop End Bush Side Result"],
  ["vertical_drop_shaft_side_spec", "Vertical Drop Shaft Side Spec."],
  ["vertical_drop_shaft_side_result", "Vertical Drop Shaft Side Result"],
  ["final_drop_test_result", "Final Drop Test Result Daily"],
  ["hrpm_spec", "HRPM Spec."],
  ["after_hrpm_balancing_spec", "After HRPM Balancing Spec."],
  ["after_hrpm_left_balancing_value", "After HRPM Left Side Balancing Value"],
  ["after_hrpm_right_balancing_value", "After HRPM Right Side Balancing Value"],
  ["hrpm_result", "HRPM Result Daily"],
  ["cold_test_spec", "COLD Test Spec. 168 Hr."],
  ["cold_test_result", "COLD Test Result Monthly"],
  ["hot_test_spec", "HOT Test Spec. 168 Hr."],
  ["hot_test_result", "HOT Test Result Monthly"],
  ["final_result", "Final Result"],
];

const FIELD_GROUPS = [
  {
    title: "Basic Details",
    fields: [
      ["log_date", "Date", "date"],
      ["log_time", "Time", "time"],
      ["reliability_lab_supervisor", "Reliability Lab Supervisor", "text"],
      ["part_qr_number", "Part QR Number", "text"],
      ["sap_code", "SAP Code", "text"],
    ],
  },
  {
    title: "Part Details",
    fields: [
      ["part_description", "Part Description", "text"],
      ["customer_part_code", "Customer Part Code", "text"],
      ["customer", "Customer", "text"],
      ["rm_grade", "RM Grade", "text"],
      ["part_weight", "Part Weight", "text"],
    ],
  },
  {
    title: "Daily Test Details",
    fields: [
      ["tensile_spec", "Tensile Spec.", "text"],
      ["tensile_actual", "Tensile Actual Daily", "text"],
      ["torque_spec", "Torque Spec.", "text"],
      ["torque_actual", "Torque Actual Daily", "text"],
      ["horizontal_drop_spec", "Horizontal Drop Test Spec.", "text"],
      ["horizontal_drop_result", "Horizontal Drop Test Result", "select"],
      [
        "vertical_drop_end_bush_spec",
        "Vertical Drop End Bush Side Spec.",
        "text",
      ],
      [
        "vertical_drop_end_bush_result",
        "Vertical Drop End Bush Side Result",
        "select",
      ],
      [
        "vertical_drop_shaft_side_spec",
        "Vertical Drop Shaft Side Spec.",
        "text",
      ],
      [
        "vertical_drop_shaft_side_result",
        "Vertical Drop Shaft Side Result",
        "select",
      ],
      ["final_drop_test_result", "Final Drop Test Result Daily", "select"],
    ],
  },
  {
    title: "HRPM Details",
    fields: [
      ["hrpm_spec", "HRPM Spec. ON/OFF 15 Sec", "text"],
      ["after_hrpm_balancing_spec", "After HRPM Balancing Spec.", "text"],
      [
        "after_hrpm_left_balancing_value",
        "After HRPM Left Side Balancing Value",
        "text",
      ],
      [
        "after_hrpm_right_balancing_value",
        "After HRPM Right Side Balancing Value",
        "text",
      ],
      ["hrpm_result", "HRPM Result Daily", "select"],
    ],
  },
  {
    title: "Monthly Test Details",
    fields: [
      ["cold_test_spec", "COLD Test Spec. 168 Hr.", "text"],
      ["cold_test_result", "COLD Test Result Monthly", "select"],
      ["hot_test_spec", "HOT Test Spec. 168 Hr.", "text"],
      ["hot_test_result", "HOT Test Result Monthly", "select"],
      ["final_result", "Final Result", "select"],
    ],
  },
];

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

export default function ReliabilityLabTestLog() {
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
  const [fetchingMaster, setFetchingMaster] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const offset = (currentPage - 1) * rowsPerPage;

    let url = `${API_BASE_URL}${LOG_API}?limit=${rowsPerPage}&offset=${offset}`;

    if (searchText.trim()) {
      url += `&search=${encodeURIComponent(searchText.trim())}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reliability lab log");

      const result = await res.json();
      const rows = Array.isArray(result) ? result : result.data || [];

      setRecords(rows);
      setHasNextPage(rows.length === rowsPerPage);
    } catch (err) {
      console.error(err);
      alert("Failed to load log data. Please check Node-RED API.");
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
    setForm((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };

      return autoCalculateResults(updated);
    });
  };

  const autoCalculateResults = (data) => {
    const dropResults = [
      data.horizontal_drop_result,
      data.vertical_drop_end_bush_result,
      data.vertical_drop_shaft_side_result,
    ].filter(Boolean);

    if (dropResults.includes("Fail")) {
      data.final_drop_test_result = "Fail";
    } else if (
      dropResults.length === 3 &&
      dropResults.every((result) => result === "Pass" || result === "NA")
    ) {
      data.final_drop_test_result = "Pass";
    }

    const finalChecks = [
      data.final_drop_test_result,
      data.hrpm_result,
      data.cold_test_result,
      data.hot_test_result,
    ].filter((result) => result && result !== "NA");

    if (finalChecks.includes("Fail")) {
      data.final_result = "Fail";
    } else if (
      finalChecks.length > 0 &&
      finalChecks.every((result) => result === "Pass")
    ) {
      data.final_result = "Pass";
    }

    return data;
  };

  const fetchMasterBySap = async () => {
    if (!form.sap_code.trim()) {
      alert("Please enter SAP Code first");
      return;
    }

    setFetchingMaster(true);

    try {
      const url = `${API_BASE_URL}${MASTER_API}?search=${encodeURIComponent(
        form.sap_code.trim(),
      )}&limit=50&offset=0`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch master data");

      const result = await res.json();
      const rows = Array.isArray(result) ? result : result.data || [];

      const exact = rows.find(
        (row) => String(row.sap_code || "").trim() === form.sap_code.trim(),
      );

      const master = exact || rows[0];

      if (!master) {
        alert("No master spec found for this SAP Code");
        return;
      }

      setForm((prev) =>
        autoCalculateResults({
          ...prev,

          part_description: master.part_description || "",
          sap_code: master.sap_code || prev.sap_code,
          customer_part_code: master.customer_part_code || "",
          customer: master.customer || "",
          rm_grade: master.rm_grade || "",
          part_weight: master.part_weight || "",

          tensile_spec: master.tensile_spec || "",
          torque_spec: master.torque_spec || "",
          horizontal_drop_spec: master.horizontal_drop_spec || "",
          vertical_drop_end_bush_spec: master.vertical_drop_end_bush_spec || "",
          vertical_drop_shaft_side_spec:
            master.vertical_drop_shaft_side_spec || "",
          hrpm_spec: master.hrpm_spec || "",
          after_hrpm_balancing_spec: master.after_hrpm_balancing_spec || "",
          cold_test_spec: master.cold_test_spec || "",
          hot_test_spec: master.hot_test_spec || "",
        }),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to fetch master spec");
    } finally {
      setFetchingMaster(false);
    }
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
    setForm({
      ...EMPTY_FORM,
      log_date: today,
      log_time: currentTime(),
    });
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

    if (!form.sap_code.trim()) {
      alert("SAP Code is required");
      return;
    }

    if (!form.reliability_lab_supervisor.trim()) {
      alert("Reliability Lab Supervisor is required");
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API_BASE_URL}${LOG_API}/${editingId}`
        : `${API_BASE_URL}${LOG_API}`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(autoCalculateResults({ ...form })),
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
    const ok = window.confirm(
      `Delete this log?\nSAP Code: ${row.sap_code || "-"}`,
    );

    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE_URL}${LOG_API}/${row.id}`, {
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
      let url = `${API_BASE_URL}${LOG_EXPORT_API}`;

      if (searchText.trim()) {
        url += `?search=${encodeURIComponent(searchText.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const result = await res.json();
      const rows = Array.isArray(result) ? result : result.data || [];

      if (!rows.length) {
        alert("No data to export");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reliability_Lab_Log");

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

        column.width = Math.min(maxLength + 3, 55);
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Reliability_Lab_Test_Log_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    }
  };

  const renderedRows = useMemo(() => records, [records]);

  const getResultBadgeClass = (value) => {
    if (value === "Pass")
      return "bg-green-900/50 text-green-300 border-green-700";
    if (value === "Fail") return "bg-red-900/50 text-red-300 border-red-700";
    if (value === "NA") return "bg-gray-700 text-gray-300 border-gray-600";
    return "";
  };

  return (
    <Layout>
      <div className="bg-gray-900 text-gray-100 min-h-screen p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Reliability Lab Test Log
            </h1>
            <p className="text-gray-400">
              Daily and monthly reliability testing entry system
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col flex-1 min-w-[260px]">
              <label className="text-sm font-medium mb-1">Search</label>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search QR, SAP Code, Customer, Result..."
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
              {showForm ? "Close Form" : "Add New Log"}
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
                  {editingId
                    ? "Edit Reliability Lab Log"
                    : "Add Reliability Lab Log"}
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

              <div className="bg-gray-700/60 rounded p-4 flex flex-wrap gap-3 items-end">
                <div className="flex flex-col min-w-[240px]">
                  <label className="text-sm font-medium mb-1">
                    SAP Code For Auto-Fill
                  </label>
                  <input
                    value={form.sap_code}
                    onChange={(e) =>
                      handleInputChange("sap_code", e.target.value)
                    }
                    placeholder="Example: 1200008569"
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchMasterBySap}
                  disabled={fetchingMaster}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-5 py-2 rounded"
                >
                  {fetchingMaster ? "Fetching..." : "Fetch Specs From Master"}
                </button>

                <p className="text-sm text-gray-400">
                  SAP Code डालकर master specs auto-fill कर सकते हो.
                </p>
              </div>

              {FIELD_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">
                    {group.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.fields.map(([key, label, type]) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-sm font-medium mb-1">
                          {label}
                          {(key === "sap_code" ||
                            key === "reliability_lab_supervisor") && (
                            <span className="text-red-400"> *</span>
                          )}
                        </label>

                        {type === "select" ? (
                          <select
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value)
                            }
                            className={`px-3 py-2 bg-gray-700 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              getResultBadgeClass(form[key]) ||
                              "border-gray-600"
                            }`}
                          >
                            {RESULT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option || "Select Result"}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={type}
                            value={form[key] || ""}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value)
                            }
                            placeholder={label}
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
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
                  {saving ? "Saving..." : editingId ? "Update Log" : "Save Log"}
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
                          {key.includes("result") || key === "final_result" ? (
                            <span
                              className={`px-2 py-1 rounded border text-xs ${
                                getResultBadgeClass(row[key]) ||
                                "border-gray-700"
                              }`}
                            >
                              {formatValue(row[key])}
                            </span>
                          ) : (
                            formatValue(row[key])
                          )}
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
              disabled={!hasNextPage}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded"
            >
              Next
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Reliability Lab Test Log | Daily + Monthly Test Entry
          </div>
        </div>
      </div>
    </Layout>
  );
}

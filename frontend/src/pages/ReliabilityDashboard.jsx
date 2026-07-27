import React, { useCallback, useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import Layout from "../components/Layout/Layout";

const API_BASE_URL = "http://192.168.1.34:1880";
const EXPORT_API = "/reliability_lab_test_log/export";

const today = new Date().toISOString().split("T")[0];

const resultFields = [
  "horizontal_drop_result",
  "vertical_drop_end_bush_result",
  "vertical_drop_shaft_side_result",
  "final_drop_test_result",
  "hrpm_result",
  "cold_test_result",
  "hot_test_result",
  "final_result",
];

const failureFields = [
  ["horizontal_drop_result", "Horizontal Drop Test"],
  ["vertical_drop_end_bush_result", "Vertical Drop End Bush"],
  ["vertical_drop_shaft_side_result", "Vertical Drop Shaft Side"],
  ["final_drop_test_result", "Final Drop Test"],
  ["hrpm_result", "HRPM Test"],
  ["cold_test_result", "Cold Test"],
  ["hot_test_result", "Hot Test"],
  ["final_result", "Final Result"],
];

const exportColumns = [
  ["log_date", "Date"],
  ["log_time", "Time"],
  ["reliability_lab_supervisor", "Supervisor"],
  ["part_qr_number", "QR Number"],
  ["part_description", "Part Description"],
  ["sap_code", "SAP Code"],
  ["customer_part_code", "Customer Part Code"],
  ["customer", "Customer"],
  ["rm_grade", "RM Grade"],
  ["part_weight", "Part Weight"],
  ["tensile_spec", "Tensile Spec."],
  ["tensile_actual", "Tensile Actual"],
  ["torque_spec", "Torque Spec."],
  ["torque_actual", "Torque Actual"],
  ["horizontal_drop_spec", "Horizontal Drop Spec."],
  ["horizontal_drop_result", "Horizontal Drop Result"],
  ["vertical_drop_end_bush_spec", "Vertical Drop End Bush Spec."],
  ["vertical_drop_end_bush_result", "Vertical Drop End Bush Result"],
  ["vertical_drop_shaft_side_spec", "Vertical Drop Shaft Side Spec."],
  ["vertical_drop_shaft_side_result", "Vertical Drop Shaft Side Result"],
  ["final_drop_test_result", "Final Drop Result"],
  ["hrpm_spec", "HRPM Spec."],
  ["after_hrpm_balancing_spec", "After HRPM Balancing Spec."],
  ["after_hrpm_left_balancing_value", "After HRPM Left Value"],
  ["after_hrpm_right_balancing_value", "After HRPM Right Value"],
  ["hrpm_result", "HRPM Result"],
  ["cold_test_spec", "Cold Test Spec."],
  ["cold_test_result", "Cold Test Result"],
  ["hot_test_spec", "Hot Test Spec."],
  ["hot_test_result", "Hot Test Result"],
  ["final_result", "Final Result"],
];

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isPass = (value) => normalize(value) === "pass";
const isFail = (value) => normalize(value) === "fail";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

const formatDate = (value) => {
  if (!value) return "-";
  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const getPassRate = (pass, total) => {
  if (!total) return "0.0";
  return ((pass / total) * 100).toFixed(1);
};

const getStatusClass = (value) => {
  if (isPass(value)) {
    return "bg-green-600/90 text-white border-green-400";
  }

  if (isFail(value)) {
    return "bg-red-600/90 text-white border-red-400";
  }

  return "bg-gray-600/80 text-gray-200 border-gray-500";
};

const getStatusLabel = (value) => {
  if (!value) return "NA";
  return value;
};

function KpiCard({ title, value, subtitle, tone = "blue", icon }) {
  const toneMap = {
    blue: "from-blue-500/20 via-blue-900/50 to-slate-900 border-blue-700 text-blue-300",
    green:
      "from-green-500/20 via-green-900/50 to-slate-900 border-green-700 text-green-300",
    red: "from-red-500/20 via-red-900/50 to-slate-900 border-red-700 text-red-300",
    yellow:
      "from-yellow-500/20 via-yellow-900/40 to-slate-900 border-yellow-700 text-yellow-300",
    purple:
      "from-purple-500/20 via-purple-900/50 to-slate-900 border-purple-700 text-purple-300",
    cyan: "from-cyan-500/20 via-cyan-900/50 to-slate-900 border-cyan-700 text-cyan-300",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${toneMap[tone]} p-5 shadow-lg`}
    >
      <div className="absolute right-4 top-4 text-4xl opacity-35">{icon}</div>

      <div className="uppercase tracking-wide text-xs font-semibold opacity-90">
        {title}
      </div>

      <div className="text-4xl font-bold text-white mt-3">{value}</div>

      {subtitle && <div className="text-xs text-gray-300 mt-2">{subtitle}</div>}
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-700 bg-slate-900/80 shadow-lg ${className}`}
    >
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white">
          {title}
        </h2>
      </div>

      <div className="p-4">{children}</div>
    </div>
  );
}

function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex min-w-[48px] justify-center rounded border px-2 py-1 text-xs font-semibold ${getStatusClass(
        value,
      )}`}
    >
      {getStatusLabel(value)}
    </span>
  );
}

function DonutChart({ pass, fail, pending, total }) {
  const passDeg = total ? (pass / total) * 360 : 0;
  const failDeg = total ? (fail / total) * 360 : 0;
  const pendingDeg = total ? (pending / total) * 360 : 0;

  const background = total
    ? `conic-gradient(
        #22c55e 0deg ${passDeg}deg,
        #ef4444 ${passDeg}deg ${passDeg + failDeg}deg,
        #94a3b8 ${passDeg + failDeg}deg ${passDeg + failDeg + pendingDeg}deg
      )`
    : "#334155";

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div
        className="relative h-44 w-44 rounded-full shadow-xl"
        style={{ background }}
      >
        <div className="absolute inset-10 rounded-full bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full space-y-3">
        <LegendRow
          color="bg-green-500"
          label="Pass"
          value={`${pass} (${getPassRate(pass, total)}%)`}
        />
        <LegendRow
          color="bg-red-500"
          label="Fail"
          value={`${fail} (${getPassRate(fail, total)}%)`}
        />
        <LegendRow
          color="bg-slate-400"
          label="Pending / NA"
          value={`${pending} (${getPassRate(pending, total)}%)`}
        />

        <div className="border-t border-slate-700 pt-3 text-right text-sm text-gray-300">
          Total: <span className="font-bold text-white">{total}</span>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-sm ${color}`} />
        <span className="text-gray-200">{label}</span>
      </div>

      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function BarRow({ label, value, maxValue }) {
  const width = maxValue ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-[170px_1fr_32px] items-center gap-3 text-sm">
      <div className="truncate text-right text-gray-300" title={label}>
        {label}
      </div>

      <div className="h-5 rounded bg-slate-800 border border-slate-700 overflow-hidden">
        <div
          className="h-full rounded bg-gradient-to-r from-red-500 to-red-400"
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}

export default function ReliabilityDashboard() {
  const [records, setRecords] = useState([]);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      let url = `${API_BASE_URL}${EXPORT_API}`;
      const params = [];

      if (fromDate) params.push(`from=${encodeURIComponent(fromDate)}`);
      if (toDate) params.push(`to=${encodeURIComponent(toDate)}`);
      if (searchText.trim()) {
        params.push(`search=${encodeURIComponent(searchText.trim())}`);
      }

      if (params.length) url += "?" + params.join("&");

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const result = await res.json();
      const rows = Array.isArray(result) ? result : result.data || [];

      setRecords(rows);
    } catch (err) {
      console.error(err);
      alert("Dashboard data load failed. Please check Node-RED API.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, searchText]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const dashboard = useMemo(() => {
    const total = records.length;

    const passCount = records.filter((row) => isPass(row.final_result)).length;
    const failCount = records.filter((row) => isFail(row.final_result)).length;
    const pendingCount = total - passCount - failCount;

    const todayCount = records.filter((row) => row.log_date === today).length;

    const failedRows = records.filter((row) =>
      resultFields.some((field) => isFail(row[field])),
    );

    const failureBreakdown = failureFields.map(([key, label]) => ({
      key,
      label,
      count: records.filter((row) => isFail(row[key])).length,
    }));

    const maxFailure = Math.max(
      1,
      ...failureBreakdown.map((item) => item.count),
    );

    const customerMap = {};

    records.forEach((row) => {
      const customer = row.customer || "Unknown";

      if (!customerMap[customer]) {
        customerMap[customer] = {
          customer,
          total: 0,
          pass: 0,
          fail: 0,
          pending: 0,
        };
      }

      customerMap[customer].total += 1;

      if (isPass(row.final_result)) customerMap[customer].pass += 1;
      else if (isFail(row.final_result)) customerMap[customer].fail += 1;
      else customerMap[customer].pending += 1;
    });

    const customerSummary = Object.values(customerMap)
      .map((item) => ({
        ...item,
        passRate: getPassRate(item.pass, item.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    const sapMap = {};

    records.forEach((row) => {
      const sap = row.sap_code || "Unknown";

      if (!sapMap[sap]) {
        sapMap[sap] = {
          sap_code: sap,
          part_description: row.part_description || "-",
          customer: row.customer || "-",
          total: 0,
          pass: 0,
          fail: 0,
        };
      }

      sapMap[sap].total += 1;

      if (isPass(row.final_result)) sapMap[sap].pass += 1;
      if (isFail(row.final_result)) sapMap[sap].fail += 1;
    });

    const sapSummary = Object.values(sapMap)
      .map((item) => ({
        ...item,
        passRate: getPassRate(item.pass, item.total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const recentFailures = [...failedRows]
      .sort((a, b) => {
        const aDate = `${a.log_date || ""} ${a.log_time || ""}`;
        const bDate = `${b.log_date || ""} ${b.log_time || ""}`;
        return bDate.localeCompare(aDate);
      })
      .slice(0, 5);

    const recentRecords = [...records]
      .sort((a, b) => {
        const aDate = `${a.log_date || ""} ${a.log_time || ""}`;
        const bDate = `${b.log_date || ""} ${b.log_time || ""}`;
        return bDate.localeCompare(aDate);
      })
      .slice(0, 8);

    return {
      total,
      passCount,
      failCount,
      pendingCount,
      todayCount,
      passRate: getPassRate(passCount, total),
      failRate: getPassRate(failCount, total),
      pendingRate: getPassRate(pendingCount, total),
      failureBreakdown,
      maxFailure,
      customerSummary,
      sapSummary,
      recentFailures,
      recentRecords,
    };
  }, [records]);

  const handleSearch = () => {
    setSearchText(searchInput);
  };

  const handleReset = () => {
    setFromDate(today);
    setToDate(today);
    setSearchInput("");
    setSearchText("");
  };

  const exportToExcel = async () => {
    if (!records.length) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reliability_Dashboard_Data");

    const headers = exportColumns.map(([, label]) => label);
    const keys = exportColumns.map(([key]) => key);

    const headerRow = worksheet.addRow(headers);
    headerRow.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
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

    records.forEach((row, index) => {
      const excelRow = worksheet.addRow(keys.map((key) => row[key] || ""));

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
    link.download = `Reliability_Dashboard_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#07111f] text-gray-100 p-4 md:p-6">
        <div className="max-w-[1900px] mx-auto">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Reliability Lab Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Daily and monthly reliability test performance overview
              </p>
            </div>

            <div className="text-sm text-slate-400">
              Last Updated:{" "}
              <span className="text-white">{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm text-slate-300">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded border border-slate-600 bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm text-slate-300">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded border border-slate-600 bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col flex-1 min-w-[280px]">
                <label className="mb-1 text-sm text-slate-300">Search</label>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search SAP Code / Customer / QR No. / Supervisor..."
                  className="h-10 rounded border border-slate-600 bg-slate-800 px-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSearch}
                className="h-10 rounded bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700"
              >
                Apply
              </button>

              <button
                onClick={handleReset}
                className="h-10 rounded bg-slate-700 px-6 font-semibold text-white hover:bg-slate-600"
              >
                Reset
              </button>

              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="h-10 rounded bg-cyan-700 px-6 font-semibold text-white hover:bg-cyan-800 disabled:bg-slate-600"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                onClick={exportToExcel}
                className="h-10 rounded bg-green-700 px-6 font-semibold text-white hover:bg-green-800"
              >
                📥 Export Excel
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <KpiCard
              title="Total Tests"
              value={dashboard.total}
              subtitle="Selected period"
              tone="blue"
              icon="📋"
            />

            <KpiCard
              title="Pass"
              value={dashboard.passCount}
              subtitle={`${dashboard.passRate}%`}
              tone="green"
              icon="✓"
            />

            <KpiCard
              title="Fail"
              value={dashboard.failCount}
              subtitle={`${dashboard.failRate}%`}
              tone="red"
              icon="✕"
            />

            <KpiCard
              title="Pending / NA"
              value={dashboard.pendingCount}
              subtitle={`${dashboard.pendingRate}%`}
              tone="yellow"
              icon="⏱"
            />

            <KpiCard
              title="Pass Rate"
              value={`${dashboard.passRate}%`}
              subtitle="Based on final result"
              tone="purple"
              icon="📈"
            />

            <KpiCard
              title="Today Tests"
              value={dashboard.todayCount}
              subtitle={formatDate(today)}
              tone="cyan"
              icon="📅"
            />
          </div>

          {/* Charts + Customer Table */}
          <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
            <Panel title="Result Summary">
              <DonutChart
                pass={dashboard.passCount}
                fail={dashboard.failCount}
                pending={dashboard.pendingCount}
                total={dashboard.total}
              />
            </Panel>

            <Panel title="Failure Breakdown By Test Type">
              <div className="space-y-3">
                {dashboard.failureBreakdown.map((item) => (
                  <BarRow
                    key={item.key}
                    label={item.label}
                    value={item.count}
                    maxValue={dashboard.maxFailure}
                  />
                ))}
              </div>
            </Panel>

            <Panel title="Customer Wise Summary">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Customer
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Total
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Pass
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Fail
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Pass %
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.customerSummary.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="border border-slate-700 p-5 text-center text-slate-400"
                        >
                          No data found
                        </td>
                      </tr>
                    ) : (
                      dashboard.customerSummary.map((row) => (
                        <tr
                          key={row.customer}
                          className="hover:bg-slate-800/70"
                        >
                          <td className="border border-slate-700 px-3 py-2">
                            {row.customer}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right">
                            {row.total}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right text-green-300">
                            {row.pass}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right text-red-300">
                            {row.fail}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right">
                            <span
                              className={`rounded px-2 py-1 text-xs font-bold ${
                                Number(row.passRate) >= 80
                                  ? "bg-green-600 text-white"
                                  : Number(row.passRate) >= 50
                                    ? "bg-yellow-600 text-white"
                                    : "bg-red-600 text-white"
                              }`}
                            >
                              {row.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* SAP Summary + Failed Records */}
          <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel title="Top SAP Code Summary">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        SAP Code
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Part Description
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Customer
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Total
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Fail
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-right">
                        Pass %
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.sapSummary.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="border border-slate-700 p-5 text-center text-slate-400"
                        >
                          No data found
                        </td>
                      </tr>
                    ) : (
                      dashboard.sapSummary.map((row) => (
                        <tr
                          key={row.sap_code}
                          className="hover:bg-slate-800/70"
                        >
                          <td className="border border-slate-700 px-3 py-2">
                            {row.sap_code}
                          </td>
                          <td
                            className="border border-slate-700 px-3 py-2 max-w-[260px] truncate"
                            title={row.part_description}
                          >
                            {row.part_description}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {row.customer}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right">
                            {row.total}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right text-red-300">
                            {row.fail}
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-right">
                            <span
                              className={`rounded px-2 py-1 text-xs font-bold ${
                                Number(row.passRate) >= 80
                                  ? "bg-green-600 text-white"
                                  : Number(row.passRate) >= 50
                                    ? "bg-yellow-600 text-white"
                                    : "bg-red-600 text-white"
                              }`}
                            >
                              {row.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="Recent Failed Records">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Date
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Time
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        SAP Code
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Customer
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        QR Number
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-left">
                        Supervisor
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-center">
                        Drop
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-center">
                        HRPM
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-center">
                        Cold
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-center">
                        Hot
                      </th>
                      <th className="border border-slate-700 px-3 py-2 text-center">
                        Final
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dashboard.recentFailures.length === 0 ? (
                      <tr>
                        <td
                          colSpan="11"
                          className="border border-slate-700 p-5 text-center text-slate-400"
                        >
                          No failed records found
                        </td>
                      </tr>
                    ) : (
                      dashboard.recentFailures.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className="hover:bg-slate-800/70"
                        >
                          <td className="border border-slate-700 px-3 py-2">
                            {formatDate(row.log_date)}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {formatValue(row.log_time)}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {formatValue(row.sap_code)}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {formatValue(row.customer)}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {formatValue(row.part_qr_number)}
                          </td>
                          <td className="border border-slate-700 px-3 py-2">
                            {formatValue(row.reliability_lab_supervisor)}
                          </td>

                          <td className="border border-slate-700 px-3 py-2 text-center">
                            <StatusBadge value={row.final_drop_test_result} />
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-center">
                            <StatusBadge value={row.hrpm_result} />
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-center">
                            <StatusBadge value={row.cold_test_result} />
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-center">
                            <StatusBadge value={row.hot_test_result} />
                          </td>
                          <td className="border border-slate-700 px-3 py-2 text-center">
                            <StatusBadge value={row.final_result} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* Recent Records */}
          <Panel title="Recent Test Records">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      Sr.no
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Date
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Time
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      QR Number
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Part Description
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      SAP Code
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Customer
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Tensile
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-left">
                      Torque
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      Drop
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      HRPM
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      Cold
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      Hot
                    </th>
                    <th className="border border-slate-700 px-3 py-2 text-center">
                      Final
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="14"
                        className="border border-slate-700 p-8 text-center text-slate-400"
                      >
                        Loading dashboard data...
                      </td>
                    </tr>
                  ) : dashboard.recentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="14"
                        className="border border-slate-700 p-8 text-center text-slate-400"
                      >
                        No records found
                      </td>
                    </tr>
                  ) : (
                    dashboard.recentRecords.map((row, index) => (
                      <tr
                        key={row.id || index}
                        className="hover:bg-slate-800/70"
                      >
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatDate(row.log_date)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.log_time)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.part_qr_number)}
                        </td>
                        <td
                          className="border border-slate-700 px-3 py-2 max-w-[260px] truncate"
                          title={row.part_description}
                        >
                          {formatValue(row.part_description)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.sap_code)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.customer)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.tensile_actual)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2">
                          {formatValue(row.torque_actual)}
                        </td>
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          <StatusBadge value={row.final_drop_test_result} />
                        </td>
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          <StatusBadge value={row.hrpm_result} />
                        </td>
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          <StatusBadge value={row.cold_test_result} />
                        </td>
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          <StatusBadge value={row.hot_test_result} />
                        </td>
                        <td className="border border-slate-700 px-3 py-2 text-center">
                          <StatusBadge value={row.final_result} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="mt-6 text-center text-xs text-slate-500">
            Reliability Lab Dashboard | Total Records: {records.length}
          </div>
        </div>
      </div>
    </Layout>
  );
}

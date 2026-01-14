// script.js - COMPLETE UPDATED VERSION WITH ALL FEATURES

// Global table mapping
const TABLE_MAP = {
  movement: "movTable",
  pol: "polTable",
  "repair-rep": "repTable",
  "repair-tyre": "tyreTable",
  "repair-bat": "batTable",
};

const COLUMN_COUNTS = {
  movement: 11, // Vehicle No + Driver Name + 9 columns + delete
  pol: 16, // S.No + Vehicle No + Month + Year + 12 columns + delete
  "repair-rep": 8, // Vehicle No + 7 columns + delete
  "repair-tyre": 7, // Vehicle No + 6 columns + delete
  "repair-bat": 7, // Vehicle No + 6 columns + delete
};

let directoryHandle = null;
let autoExportInterval;
let currentPages = {
  movement: 1,
  pol: 1,
  repair: 1,
};
const pageSize = 50;

// Settings configuration
let settings = {
  downloadFolder: "./exports",
  autoDownloadTime: "17:00",
  timezone: "PKT",
  separateSheets: true,
  includeHeaders: true,
  overwriteFiles: true,
  exportMovement: true,
  exportPol: true,
  exportRepair: true,
  lastExport: null,
};

// ==================== INITIALIZATION FUNCTIONS ====================

// Initialize mobile menu
function initMobileMenu() {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      navMenu.classList.toggle("active");
      const icon = navToggle.querySelector("i");
      if (navMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-times");
      } else {
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      }
    });

    // Close menu when clicking outside on mobile
    document.addEventListener("click", function (event) {
      if (window.innerWidth <= 992) {
        if (
          !navToggle.contains(event.target) &&
          !navMenu.contains(event.target)
        ) {
          navMenu.classList.remove("active");
          const icon = navToggle.querySelector("i");
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      }
    });
  }
}

// Initialize settings from localStorage
function initializeSettings() {
  const savedSettings = localStorage.getItem("vms_settings");
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings);
    settings = { ...settings, ...parsedSettings };
  }

  // Initialize last export from localStorage
  settings.lastExport = localStorage.getItem("lastExport");

  // Apply settings to UI
  applySettings();

  // Update settings UI
  updateSettingsUI();

  // Start auto-export monitor
  startAutoExportMonitor();
}

// Apply settings to UI elements
function applySettings() {
  if (document.getElementById("downloadFolder")) {
    document.getElementById("downloadFolder").value = settings.downloadFolder;
    document.getElementById("autoDownloadTime").value =
      settings.autoDownloadTime;
    document.getElementById("timezone").value = settings.timezone;
    document.getElementById("separateSheets").checked = settings.separateSheets;
    document.getElementById("includeHeaders").checked = settings.includeHeaders;
    document.getElementById("overwriteFiles").checked = settings.overwriteFiles;
    document.getElementById("exportMovement").checked = settings.exportMovement;
    document.getElementById("exportPol").checked = settings.exportPol;
    document.getElementById("exportRepair").checked = settings.exportRepair;
  }
}

// ==================== LOGIN FUNCTIONS ====================

// ✅ PROFESSIONAL LOGIN FUNCTION
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const loginBtn = document.querySelector(".login-btn");
  const btnText = document.querySelector(".btn-text");
  const btnLoader = document.getElementById("loginLoader");
  const errorMsg = document.getElementById("loginError");

  if (username === "admin" && password === "admin") {
    loginBtn.disabled = true;
    btnText.style.opacity = "0";
    btnLoader.style.display = "inline-block";

    setTimeout(() => {
      localStorage.setItem("loggedIn", "true");
      document
        .getElementById("loginContainer")
        .classList.add("dashboard-hidden");
      document.getElementById("dashboardMain").style.display = "block";

      setTimeout(() => {
        loadAllData();
        showSection("dashboard");
        startAutoDownload();
        loadFolderHandle();
        initializeSettings();
        loginBtn.disabled = false;
        btnText.style.opacity = "1";
        btnLoader.style.display = "none";
      }, 500);
    }, 1200);
  } else {
    errorMsg.style.display = "block";
    loginBtn.disabled = false;
    btnText.style.opacity = "1";
    btnLoader.style.display = "none";
  }
}

// Form submission handler
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      login();
    });
  }

  // Initialize mobile menu
  initMobileMenu();

  // Close menu on window resize
  window.addEventListener("resize", function () {
    const navMenu = document.getElementById("navMenu");
    const navToggle = document.getElementById("navToggle");

    if (
      window.innerWidth > 992 &&
      navMenu &&
      navMenu.classList.contains("active")
    ) {
      navMenu.classList.remove("active");
      const icon = navToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  // Check if already logged in
  if (localStorage.getItem("loggedIn") === "true") {
    document.getElementById("loginContainer").classList.add("dashboard-hidden");
    document.getElementById("dashboardMain").style.display = "block";
    loadAllData();
    showSection("dashboard");
    startAutoDownload();
    loadFolderHandle();
    initializeSettings();
  }
});

function logout() {
  localStorage.removeItem("loggedIn");
  document
    .getElementById("loginContainer")
    .classList.remove("dashboard-hidden");
  document.getElementById("dashboardMain").style.display = "none";
  document.getElementById("loginError").style.display = "none";
  document.getElementById("username").value = "admin";
  document.getElementById("password").value = "admin";
}

// ==================== FILE SYSTEM ACCESS FUNCTIONS ====================

async function selectFolder() {
  try {
    if ("showDirectoryPicker" in window) {
      directoryHandle = await window.showDirectoryPicker();
      settings.downloadFolder = directoryHandle.name;
      document.getElementById("downloadFolder").value = directoryHandle.name;

      localStorage.setItem(
        "directoryHandle",
        JSON.stringify(await getHandleSerializable(directoryHandle))
      );
      document.getElementById(
        "folderStatus"
      ).textContent = `✅ ${directoryHandle.name}`;
      document.getElementById("folderStatus").style.color = "#28a745";

      // Save settings
      saveSettings();
    } else {
      document.getElementById("folderStatus").textContent =
        "⚠️ Browser download";
      document.getElementById("folderStatus").style.color = "#ffc107";
    }
  } catch (err) {
    document.getElementById("folderStatus").textContent = "❌ Cancelled";
    document.getElementById("folderStatus").style.color = "#dc3545";
  }
}

async function loadFolderHandle() {
  try {
    const savedHandle = localStorage.getItem("directoryHandle");
    if (savedHandle) {
      document.getElementById("folderStatus").textContent = "✅ Folder ready";
      document.getElementById("folderStatus").style.color = "#28a745";
    }
  } catch (err) {
    console.error("Folder load error:", err);
  }
}

async function getHandleSerializable(handle) {
  return { name: handle.name, kind: handle.kind };
}

// ==================== SETTINGS MANAGEMENT ====================

function saveSettings() {
  // Get values from UI
  settings.downloadFolder = document.getElementById("downloadFolder").value;
  settings.autoDownloadTime = document.getElementById("autoDownloadTime").value;
  settings.timezone = document.getElementById("timezone").value;
  settings.separateSheets = document.getElementById("separateSheets").checked;
  settings.includeHeaders = document.getElementById("includeHeaders").checked;
  settings.overwriteFiles = document.getElementById("overwriteFiles").checked;
  settings.exportMovement = document.getElementById("exportMovement").checked;
  settings.exportPol = document.getElementById("exportPol").checked;
  settings.exportRepair = document.getElementById("exportRepair").checked;

  localStorage.setItem("vms_settings", JSON.stringify(settings));
  showStatus("✅ Settings saved successfully!", "success");

  // Restart auto-export monitor with new settings
  startAutoExportMonitor();
  updateNextExportTime();
  updateSettingsUI();
}

function updateSettingsUI() {
  const totalEntries = calculateTotalEntries();

  if (document.getElementById("lastExport")) {
    document.getElementById("lastExport").textContent =
      settings.lastExport || "Never";
    document.getElementById("totalEntriesCount").textContent = totalEntries;
    document.getElementById("folderStatus").textContent =
      settings.downloadFolder || "Not selected";
    document.getElementById("folderStatus").style.color =
      settings.downloadFolder ? "#28a745" : "#dc3545";
  }

  updateNextExportTime();
}

function calculateTotalEntries() {
  let total = 0;
  Object.keys(TABLE_MAP).forEach((type) => {
    const data = JSON.parse(localStorage.getItem(`data_${type}`) || "[]");
    total += data.length;
  });
  return total;
}

// ==================== AUTO EXPORT FUNCTIONS ====================

function startAutoExportMonitor() {
  if (autoExportInterval) {
    clearInterval(autoExportInterval);
  }

  autoExportInterval = setInterval(() => {
    const now = new Date();
    const targetTime = settings.autoDownloadTime.split(":");
    const targetHours = parseInt(targetTime[0]);
    const targetMinutes = parseInt(targetTime[1]);

    // Convert to local time based on selected timezone
    let localHours = targetHours;
    if (settings.timezone === "UTC") {
      localHours = targetHours + 5; // PKT is UTC+5
    } else if (settings.timezone === "IST") {
      localHours = targetHours - 0.5; // IST is PKT - 0.5
    }

    if (now.getHours() === localHours && now.getMinutes() === targetMinutes) {
      autoExportAll();
    }
  }, 60000); // Check every minute
}

async function autoExportAll() {
  try {
    showStatus("🔄 Starting auto-export...", "success");
    const files = await generateExcelFiles();
    let successCount = 0;

    for (const [filename, workbook] of Object.entries(files)) {
      if (await saveExcelFile(workbook, filename)) {
        successCount++;
      }
    }

    const timestamp = new Date().toLocaleString("pk-PK");
    settings.lastExport = timestamp;
    localStorage.setItem("lastExport", timestamp);
    updateSettingsUI();

    showStatus(
      `✅ Auto-export completed: ${successCount} file(s) saved`,
      "success"
    );
  } catch (error) {
    console.error("Auto-export error:", error);
    showStatus("❌ Auto-export failed", "error");
  }
}

function updateNextExportTime() {
  if (!document.getElementById("nextExport")) return;

  const now = new Date();
  const targetTime = settings.autoDownloadTime.split(":");
  const targetHours = parseInt(targetTime[0]);
  const targetMinutes = parseInt(targetTime[1]);

  // Calculate next export time
  let nextExport = new Date(now);
  nextExport.setHours(targetHours, targetMinutes, 0, 0);

  // Adjust for timezone
  if (settings.timezone === "UTC") {
    nextExport.setHours(nextExport.getHours() - 5);
  } else if (settings.timezone === "IST") {
    nextExport.setHours(nextExport.getHours() + 0.5);
  }

  if (now > nextExport) {
    nextExport.setDate(nextExport.getDate() + 1);
  }

  const timezone =
    settings.timezone === "PKT"
      ? "PKT"
      : settings.timezone === "UTC"
      ? "UTC"
      : "IST";

  document.getElementById(
    "nextExport"
  ).textContent = `${nextExport.toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  })} ${timezone}`;
}

// ==================== EXCEL EXPORT FUNCTIONS ====================

async function generateExcelFiles() {
  const files = {};
  const dateStr = new Date().toISOString().slice(0, 10);

  // Movement Register Excel
  if (settings.exportMovement) {
    const movementWorkbook = XLSX.utils.book_new();
    const movementData = JSON.parse(
      localStorage.getItem("data_movement") || "[]"
    );

    if (settings.separateSheets) {
      // Group by vehicle
      const vehiclesData = {};
      movementData.forEach((row, index) => {
        const vehicleNo = row[0] || "Unknown";
        if (!vehiclesData[vehicleNo]) {
          vehiclesData[vehicleNo] = [];
        }
        // Remove vehicle number from row data for sheet (since it's in sheet name)
        const rowData = [index + 1, ...row.slice(1)];
        vehiclesData[vehicleNo].push(rowData);
      });

      // Create sheet for each vehicle
      Object.entries(vehiclesData).forEach(([vehicle, data]) => {
        const headers = [
          "S.No",
          "Driver Name",
          "Date",
          "Time (From-To)",
          "Staff Name",
          "Place (From-To)",
          "Purpose",
          "Meter Reading (From-To)",
          "K. Meter Covered",
          "Staff Signature",
          "Driver Signature",
        ];
        const sheetData = settings.includeHeaders ? [headers, ...data] : data;
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Set column widths
        const wscols = [
          { wch: 5 }, // S.No
          { wch: 15 }, // Driver Name
          { wch: 10 }, // Date
          { wch: 15 }, // Time
          { wch: 20 }, // Staff Name
          { wch: 20 }, // Place
          { wch: 20 }, // Purpose
          { wch: 20 }, // Meter Reading
          { wch: 12 }, // KM Covered
          { wch: 15 }, // Staff Signature
          { wch: 15 }, // Driver Signature
        ];
        worksheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(
          movementWorkbook,
          worksheet,
          vehicle.substring(0, 31) || "Movement"
        );
      });
    } else {
      // Single sheet with vehicle number in data
      const headers = [
        "S.No",
        "Vehicle No",
        "Driver Name",
        "Date",
        "Time (From-To)",
        "Staff Name",
        "Place (From-To)",
        "Purpose",
        "Meter Reading (From-To)",
        "K. Meter Covered",
        "Staff Signature",
        "Driver Signature",
      ];

      const sheetData = movementData.map((row, index) => [index + 1, ...row]);
      const fullData = settings.includeHeaders
        ? [headers, ...sheetData]
        : sheetData;
      const worksheet = XLSX.utils.aoa_to_sheet(fullData);

      const wscols = [
        { wch: 5 }, // S.No
        { wch: 12 }, // Vehicle No
        { wch: 15 }, // Driver Name
        { wch: 10 }, // Date
        { wch: 15 }, // Time
        { wch: 20 }, // Staff Name
        { wch: 20 }, // Place
        { wch: 20 }, // Purpose
        { wch: 20 }, // Meter Reading
        { wch: 12 }, // KM Covered
        { wch: 15 }, // Staff Signature
        { wch: 15 }, // Driver Signature
      ];
      worksheet["!cols"] = wscols;

      XLSX.utils.book_append_sheet(
        movementWorkbook,
        worksheet,
        "Movement Register"
      );
    }

    files[`Movement_Register_${dateStr}.xlsx`] = movementWorkbook;
  }

  // POL Register Excel
  if (settings.exportPol) {
    const polWorkbook = XLSX.utils.book_new();
    const polData = JSON.parse(localStorage.getItem("data_pol") || "[]");

    if (settings.separateSheets) {
      // Group by vehicle
      const vehiclesData = {};
      polData.forEach((row, index) => {
        const vehicleNo = row[1] || "Unknown"; // Vehicle No is at index 1
        if (!vehiclesData[vehicleNo]) {
          vehiclesData[vehicleNo] = [];
        }
        // Remove vehicle number from row data for sheet
        const rowData = [
          row[0],
          row[2],
          row[3],
          row[4],
          row[5],
          row[6],
          row[7],
          row[8],
          row[9],
          row[10],
          row[11],
          row[12],
          row[13],
          row[14],
          row[15],
        ];
        vehiclesData[vehicleNo].push(rowData);
      });

      // Create sheet for each vehicle
      Object.entries(vehiclesData).forEach(([vehicle, data]) => {
        const headers = [
          "S.No",
          "Month",
          "Year",
          "Date",
          "Fuel Type",
          "Coupon/Voucher No",
          "Quantity (L)",
          "Rate (Rs.)",
          "Pump/Bill Details",
          "Oil Change MR",
          "Oil Filter MR",
          "Fuel Filter MR",
          "Air Filter MR",
          "Transport Sig",
          "Registrar Sig",
        ];

        const sheetData = settings.includeHeaders ? [headers, ...data] : data;
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        const wscols = [
          { wch: 5 }, // S.No
          { wch: 8 }, // Month
          { wch: 8 }, // Year
          { wch: 10 }, // Date
          { wch: 10 }, // Fuel Type
          { wch: 15 }, // Coupon No
          { wch: 10 }, // Quantity
          { wch: 10 }, // Rate
          { wch: 20 }, // Pump/Bill
          { wch: 12 }, // Oil Change MR
          { wch: 12 }, // Oil Filter MR
          { wch: 12 }, // Fuel Filter MR
          { wch: 12 }, // Air Filter MR
          { wch: 15 }, // Transport Sig
          { wch: 15 }, // Registrar Sig
        ];
        worksheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(
          polWorkbook,
          worksheet,
          vehicle.substring(0, 31) || "POL"
        );
      });
    } else {
      const headers = [
        "S.No",
        "Vehicle No",
        "Month",
        "Year",
        "Date",
        "Fuel Type",
        "Coupon/Voucher No",
        "Quantity (L)",
        "Rate (Rs.)",
        "Pump/Bill Details",
        "Oil Change MR",
        "Oil Filter MR",
        "Fuel Filter MR",
        "Air Filter MR",
        "Transport Sig",
        "Registrar Sig",
      ];

      const sheetData = polData.map((row) => row);
      const fullData = settings.includeHeaders
        ? [headers, ...sheetData]
        : sheetData;
      const worksheet = XLSX.utils.aoa_to_sheet(fullData);

      const wscols = [
        { wch: 5 }, // S.No
        { wch: 12 }, // Vehicle No
        { wch: 8 }, // Month
        { wch: 8 }, // Year
        { wch: 10 }, // Date
        { wch: 10 }, // Fuel Type
        { wch: 15 }, // Coupon No
        { wch: 10 }, // Quantity
        { wch: 10 }, // Rate
        { wch: 20 }, // Pump/Bill
        { wch: 12 }, // Oil Change MR
        { wch: 12 }, // Oil Filter MR
        { wch: 12 }, // Fuel Filter MR
        { wch: 12 }, // Air Filter MR
        { wch: 15 }, // Transport Sig
        { wch: 15 }, // Registrar Sig
      ];
      worksheet["!cols"] = wscols;

      XLSX.utils.book_append_sheet(polWorkbook, worksheet, "POL Register");
    }

    files[`POL_Register_${dateStr}.xlsx`] = polWorkbook;
  }

  // Repair Register Excel
  if (settings.exportRepair) {
    const repairWorkbook = XLSX.utils.book_new();

    // General Repairs Sheet
    const repData = JSON.parse(localStorage.getItem("data_repair-rep") || "[]");
    if (repData.length > 0) {
      if (settings.separateSheets) {
        // Group by vehicle
        const vehiclesData = {};
        repData.forEach((row, index) => {
          const vehicleNo = row[0] || "Unknown";
          if (!vehiclesData[vehicleNo]) {
            vehiclesData[vehicleNo] = [];
          }
          // Remove vehicle number from row data
          const rowData = [index + 1, ...row.slice(1)];
          vehiclesData[vehicleNo].push(rowData);
        });

        Object.entries(vehiclesData).forEach(([vehicle, data]) => {
          const repHeaders = [
            "S.No",
            "Date In",
            "Date Out",
            "Repair Details",
            "Cost (Rs.)",
            "Voucher No",
            "Transport Sig",
            "Registrar Sig",
          ];

          const fullData = settings.includeHeaders
            ? [repHeaders, ...data]
            : data;
          const repWorksheet = XLSX.utils.aoa_to_sheet(fullData);

          const wscols = [
            { wch: 5 }, // S.No
            { wch: 12 }, // Date In
            { wch: 12 }, // Date Out
            { wch: 30 }, // Repair Details
            { wch: 12 }, // Cost
            { wch: 15 }, // Voucher No
            { wch: 15 }, // Transport Sig
            { wch: 15 }, // Registrar Sig
          ];
          repWorksheet["!cols"] = wscols;

          XLSX.utils.book_append_sheet(
            repairWorkbook,
            repWorksheet,
            `${vehicle.substring(0, 15)}_Repairs`
          );
        });
      } else {
        const repHeaders = [
          "S.No",
          "Vehicle No",
          "Date In",
          "Date Out",
          "Repair Details",
          "Cost (Rs.)",
          "Voucher No",
          "Transport Sig",
          "Registrar Sig",
        ];

        const sheetData = repData.map((row, index) => [index + 1, ...row]);
        const fullData = settings.includeHeaders
          ? [repHeaders, ...sheetData]
          : sheetData;
        const repWorksheet = XLSX.utils.aoa_to_sheet(fullData);

        const wscols = [
          { wch: 5 }, // S.No
          { wch: 12 }, // Vehicle No
          { wch: 12 }, // Date In
          { wch: 12 }, // Date Out
          { wch: 30 }, // Repair Details
          { wch: 12 }, // Cost
          { wch: 15 }, // Voucher No
          { wch: 15 }, // Transport Sig
          { wch: 15 }, // Registrar Sig
        ];
        repWorksheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(
          repairWorkbook,
          repWorksheet,
          "General Repairs"
        );
      }
    }

    // Tyre Management Sheet
    const tyreData = JSON.parse(
      localStorage.getItem("data_repair-tyre") || "[]"
    );
    if (tyreData.length > 0) {
      if (settings.separateSheets) {
        const vehiclesData = {};
        tyreData.forEach((row, index) => {
          const vehicleNo = row[0] || "Unknown";
          if (!vehiclesData[vehicleNo]) {
            vehiclesData[vehicleNo] = [];
          }
          const rowData = [index + 1, ...row.slice(1)];
          vehiclesData[vehicleNo].push(rowData);
        });

        Object.entries(vehiclesData).forEach(([vehicle, data]) => {
          const tyreHeaders = [
            "S.No",
            "Tyre Details",
            "Current MR",
            "Last MR",
            "Total KM Due",
            "Purchase Date",
            "Tyre No",
          ];

          const fullData = settings.includeHeaders
            ? [tyreHeaders, ...data]
            : data;
          const tyreWorksheet = XLSX.utils.aoa_to_sheet(fullData);

          const wscols = [
            { wch: 5 }, // S.No
            { wch: 25 }, // Tyre Details
            { wch: 12 }, // Current MR
            { wch: 12 }, // Last MR
            { wch: 12 }, // Total KM Due
            { wch: 12 }, // Purchase Date
            { wch: 10 }, // Tyre No
          ];
          tyreWorksheet["!cols"] = wscols;

          XLSX.utils.book_append_sheet(
            repairWorkbook,
            tyreWorksheet,
            `${vehicle.substring(0, 15)}_Tyres`
          );
        });
      } else {
        const tyreHeaders = [
          "S.No",
          "Vehicle No",
          "Tyre Details",
          "Current MR",
          "Last MR",
          "Total KM Due",
          "Purchase Date",
          "Tyre No",
        ];

        const sheetData = tyreData.map((row, index) => [index + 1, ...row]);
        const fullData = settings.includeHeaders
          ? [tyreHeaders, ...sheetData]
          : sheetData;
        const tyreWorksheet = XLSX.utils.aoa_to_sheet(fullData);

        const wscols = [
          { wch: 5 }, // S.No
          { wch: 12 }, // Vehicle No
          { wch: 25 }, // Tyre Details
          { wch: 12 }, // Current MR
          { wch: 12 }, // Last MR
          { wch: 12 }, // Total KM Due
          { wch: 12 }, // Purchase Date
          { wch: 10 }, // Tyre No
        ];
        tyreWorksheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(
          repairWorkbook,
          tyreWorksheet,
          "Tyre Management"
        );
      }
    }

    // Battery Replacement Sheet
    const batData = JSON.parse(localStorage.getItem("data_repair-bat") || "[]");
    if (batData.length > 0) {
      if (settings.separateSheets) {
        const vehiclesData = {};
        batData.forEach((row, index) => {
          const vehicleNo = row[0] || "Unknown";
          if (!vehiclesData[vehicleNo]) {
            vehiclesData[vehicleNo] = [];
          }
          const rowData = [index + 1, ...row.slice(1)];
          vehiclesData[vehicleNo].push(rowData);
        });

        Object.entries(vehiclesData).forEach(([vehicle, data]) => {
          const batHeaders = [
            "S.No",
            "Current Battery",
            "Last Replacement",
            "New Battery",
            "Purchase Date",
            "Transport Sig",
            "Registrar Sig",
          ];

          const fullData = settings.includeHeaders
            ? [batHeaders, ...data]
            : data;
          const batWorksheet = XLSX.utils.aoa_to_sheet(fullData);

          const wscols = [
            { wch: 5 }, // S.No
            { wch: 20 }, // Current Battery
            { wch: 15 }, // Last Replacement
            { wch: 20 }, // New Battery
            { wch: 12 }, // Purchase Date
            { wch: 15 }, // Transport Sig
            { wch: 15 }, // Registrar Sig
          ];
          batWorksheet["!cols"] = wscols;

          XLSX.utils.book_append_sheet(
            repairWorkbook,
            batWorksheet,
            `${vehicle.substring(0, 15)}_Battery`
          );
        });
      } else {
        const batHeaders = [
          "S.No",
          "Vehicle No",
          "Current Battery",
          "Last Replacement",
          "New Battery",
          "Purchase Date",
          "Transport Sig",
          "Registrar Sig",
        ];

        const sheetData = batData.map((row, index) => [index + 1, ...row]);
        const fullData = settings.includeHeaders
          ? [batHeaders, ...sheetData]
          : sheetData;
        const batWorksheet = XLSX.utils.aoa_to_sheet(fullData);

        const wscols = [
          { wch: 5 }, // S.No
          { wch: 12 }, // Vehicle No
          { wch: 20 }, // Current Battery
          { wch: 15 }, // Last Replacement
          { wch: 20 }, // New Battery
          { wch: 12 }, // Purchase Date
          { wch: 15 }, // Transport Sig
          { wch: 15 }, // Registrar Sig
        ];
        batWorksheet["!cols"] = wscols;

        XLSX.utils.book_append_sheet(
          repairWorkbook,
          batWorksheet,
          "Battery Replacement"
        );
      }
    }

    files[`Repair_Register_${dateStr}.xlsx`] = repairWorkbook;
  }

  return files;
}

async function saveExcelFile(workbook, filename) {
  try {
    // Convert workbook to binary
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });

    // Convert to blob
    const buffer = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < wbout.length; i++) {
      view[i] = wbout.charCodeAt(i) & 0xff;
    }
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Save using File System Access API if available
    if ("showSaveFilePicker" in window && directoryHandle) {
      try {
        const fileHandle = await directoryHandle.getFileHandle(filename, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return true;
      } catch (err) {
        console.log("File System Access error, falling back to download:", err);
        downloadBlob(blob, filename);
        return true;
      }
    } else {
      // Fallback for browsers without File System Access API
      downloadBlob(blob, filename);
      return true;
    }
  } catch (error) {
    console.error("Save Excel error:", error);
    return false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Test Auto Export
async function testAutoExport() {
  showStatus("🔄 Testing auto-export...", "success");
  await autoExportAll();
}

// ==================== DASHBOARD FUNCTIONS ====================

function loadDashboard() {
  updateDashboardView();
  updateDashboardData();
  createCharts();
  loadRecentActivity();
}

function updateDashboardView() {
  const view = document.getElementById("dashboardView").value;
  const vehicleFilter = document.querySelector(".vehicle-filter");
  const driverFilter = document.querySelector(".driver-filter");

  if (view === "vehicle") {
    vehicleFilter.style.display = "flex";
    driverFilter.style.display = "none";
    populateVehicleFilter();
  } else if (view === "driver") {
    vehicleFilter.style.display = "none";
    driverFilter.style.display = "flex";
    populateDriverFilter();
  } else {
    vehicleFilter.style.display = "none";
    driverFilter.style.display = "none";
  }
}

function populateVehicleFilter() {
  const select = document.getElementById("vehicleSelect");
  select.innerHTML = '<option value="all">All Vehicles</option>';

  const vehicles = new Set();

  // Get vehicles from data
  const movementData = JSON.parse(
    localStorage.getItem("data_movement") || "[]"
  );
  movementData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  const polData = JSON.parse(localStorage.getItem("data_pol") || "[]");
  polData.forEach((row) => {
    if (row[1]) vehicles.add(row[1]); // Vehicle No is at index 1
  });

  const repairData = JSON.parse(
    localStorage.getItem("data_repair-rep") || "[]"
  );
  repairData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  const tyreData = JSON.parse(localStorage.getItem("data_repair-tyre") || "[]");
  tyreData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  const batteryData = JSON.parse(
    localStorage.getItem("data_repair-bat") || "[]"
  );
  batteryData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  vehicles.forEach((vehicle) => {
    if (vehicle && vehicle.trim()) {
      const option = document.createElement("option");
      option.value = vehicle;
      option.textContent = vehicle;
      select.appendChild(option);
    }
  });
}

function populateDriverFilter() {
  const select = document.getElementById("driverSelect");
  select.innerHTML = '<option value="all">All Drivers</option>';

  const drivers = new Set();

  // Get drivers from movement register
  const movementData = JSON.parse(
    localStorage.getItem("data_movement") || "[]"
  );
  movementData.forEach((row) => {
    if (row[1]) drivers.add(row[1]); // Driver Name is at index 1
  });

  drivers.forEach((driver) => {
    if (driver && driver.trim()) {
      const option = document.createElement("option");
      option.value = driver;
      option.textContent = driver;
      select.appendChild(option);
    }
  });
}

function updateDashboardData() {
  const view = document.getElementById("dashboardView").value;
  const selectedVehicle = document.getElementById("vehicleSelect")?.value;
  const selectedDriver = document.getElementById("driverSelect")?.value;
  const dateRange = document.getElementById("dateRange").value;

  if (view === "vehicle" && selectedVehicle !== "all") {
    loadVehicleDashboard(selectedVehicle, dateRange);
  } else if (view === "driver" && selectedDriver !== "all") {
    loadDriverDashboard(selectedDriver, dateRange);
  } else if (view === "register") {
    loadRegisterDashboard(dateRange);
  } else {
    loadOverviewDashboard(dateRange);
  }
}

function loadVehicleDashboard(vehicleNo, dateRange) {
  const filteredData = filterDataByVehicle(vehicleNo, dateRange);

  // Update KPI cards
  document.getElementById("totalEntries").textContent =
    filteredData.totalEntries;
  document.getElementById(
    "totalEntriesDetail"
  ).textContent = `Vehicle: ${vehicleNo}`;

  document.getElementById(
    "totalFuel"
  ).textContent = `${filteredData.totalFuel.toFixed(1)}L`;
  document.getElementById(
    "totalFuelDetail"
  ).textContent = `Avg: ${filteredData.avgFuelRate.toFixed(2)}/L`;

  document.getElementById(
    "totalRepair"
  ).textContent = `₨${filteredData.totalRepair.toLocaleString()}`;
  document.getElementById(
    "totalRepairDetail"
  ).textContent = `${filteredData.repairCount} repairs`;

  document.getElementById("activeVehicles").textContent = "1";
  document.getElementById("activeVehiclesDetail").textContent = vehicleNo;

  // Update register breakdown
  updateRegisterBreakdown(filteredData);

  // Update top stats
  updateTopStats(filteredData);

  // Update charts
  updateCharts(filteredData);

  // Update recent activity
  updateRecentActivity(filteredData.recentActivity);
}

function loadDriverDashboard(driverName, dateRange) {
  const filteredData = filterDataByDriver(driverName, dateRange);

  document.getElementById("totalEntries").textContent =
    filteredData.totalEntries;
  document.getElementById(
    "totalEntriesDetail"
  ).textContent = `Driver: ${driverName}`;

  document.getElementById(
    "totalFuel"
  ).textContent = `${filteredData.totalFuel.toFixed(1)}L`;
  document.getElementById("totalFuelDetail").textContent =
    filteredData.fuelEntries > 0
      ? `${filteredData.fuelEntries} entries`
      : "No fuel entries";

  document.getElementById(
    "totalRepair"
  ).textContent = `₨${filteredData.totalRepair.toLocaleString()}`;
  document.getElementById(
    "totalRepairDetail"
  ).textContent = `${filteredData.repairCount} repairs`;

  const vehicleCount = new Set(filteredData.vehiclesUsed).size;
  document.getElementById("activeVehicles").textContent = vehicleCount;
  document.getElementById("activeVehiclesDetail").textContent =
    vehicleCount > 1 ? `${vehicleCount} vehicles` : "1 vehicle";

  updateRegisterBreakdown(filteredData);
  updateTopStats(filteredData);
  updateCharts(filteredData);
  updateRecentActivity(filteredData.recentActivity);
}

function loadRegisterDashboard(dateRange) {
  const movementData = filterDataByDate("movement", dateRange);
  const polData = filterDataByDate("pol", dateRange);
  const repairData = filterDataByDate("repair-rep", dateRange);
  const tyreData = filterDataByDate("repair-tyre", dateRange);
  const batteryData = filterDataByDate("repair-bat", dateRange);

  const totalEntries =
    movementData.length +
    polData.length +
    repairData.length +
    tyreData.length +
    batteryData.length;
  const totalFuel = polData.reduce(
    (sum, row) => sum + (parseFloat(row[7]) || 0),
    0
  ); // Quantity at index 7
  const totalRepair = repairData.reduce(
    (sum, row) => sum + (parseFloat(row[4]) || 0),
    0
  ); // Cost at index 4

  // Count unique vehicles
  const vehicles = new Set();
  movementData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });
  polData.forEach((row) => {
    if (row[1]) vehicles.add(row[1]); // Vehicle No at index 1
  });
  repairData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  document.getElementById("totalEntries").textContent = totalEntries;
  document.getElementById("totalEntriesDetail").textContent = `M:${
    movementData.length
  } | P:${polData.length} | R:${
    repairData.length + tyreData.length + batteryData.length
  }`;

  document.getElementById("totalFuel").textContent = `${totalFuel.toFixed(1)}L`;
  document.getElementById(
    "totalFuelDetail"
  ).textContent = `${polData.length} POL entries`;

  document.getElementById(
    "totalRepair"
  ).textContent = `₨${totalRepair.toLocaleString()}`;
  document.getElementById(
    "totalRepairDetail"
  ).textContent = `${repairData.length} repairs`;

  document.getElementById("activeVehicles").textContent = vehicles.size;
  document.getElementById(
    "activeVehiclesDetail"
  ).textContent = `${vehicles.size} vehicles`;

  // Update register specific stats
  document.getElementById("movementEntries").textContent = movementData.length;
  document.getElementById("movementVehicles").textContent = vehicles.size;
  document.getElementById("movementKM").textContent = movementData
    .reduce((sum, row) => sum + (parseFloat(row[8]) || 0), 0)
    .toFixed(1); // KM Covered at index 8

  document.getElementById("polEntries").textContent = polData.length;
  document.getElementById("polFuelQty").textContent = `${totalFuel.toFixed(
    1
  )}L`;
  document.getElementById("polCost").textContent = `₨${polData
    .reduce(
      (sum, row) => sum + (parseFloat(row[7]) * parseFloat(row[8]) || 0),
      0
    )
    .toLocaleString()}`;

  document.getElementById("repairEntries").textContent =
    repairData.length + tyreData.length + batteryData.length;
  document.getElementById(
    "repairCost"
  ).textContent = `₨${totalRepair.toLocaleString()}`;
  document.getElementById("repairVehicles").textContent = new Set([
    ...repairData.map((row) => row[0] || ""),
    ...tyreData.map((row) => row[0] || ""),
    ...batteryData.map((row) => row[0] || ""),
  ]).size;

  updateTopStats({
    movementData,
    polData,
    repairData,
    tyreData,
    batteryData,
  });
}

function loadOverviewDashboard(dateRange) {
  const filteredData = filterAllDataByDate(dateRange);
  updateKPICards(filteredData);
  updateRegisterBreakdown(filteredData);
  updateTopStats(filteredData);
  updateCharts(filteredData);
  updateRecentActivity(filteredData.recentActivity);
}

function filterDataByVehicle(vehicleNo, dateRange) {
  // Filter movement data
  const movementData = filterDataByDate("movement", dateRange).filter(
    (row) => row[0] === vehicleNo
  );

  // Filter POL data
  const polData = filterDataByDate("pol", dateRange).filter(
    (row) => row[1] === vehicleNo // Vehicle No at index 1
  );

  // Filter repair data
  const repairData = filterDataByDate("repair-rep", dateRange).filter(
    (row) => row[0] === vehicleNo
  );

  const totalFuel = polData.reduce(
    (sum, row) => sum + (parseFloat(row[7]) || 0),
    0
  ); // Quantity at index 7
  const avgFuelRate =
    polData.length > 0
      ? polData.reduce((sum, row) => sum + (parseFloat(row[8]) || 0), 0) /
        polData.length
      : 0; // Rate at index 8
  const totalRepair = repairData.reduce(
    (sum, row) => sum + (parseFloat(row[4]) || 0),
    0
  ); // Cost at index 4

  return {
    movementData,
    polData,
    repairData,
    totalEntries: movementData.length + polData.length + repairData.length,
    totalFuel,
    avgFuelRate,
    totalRepair,
    repairCount: repairData.length,
    recentActivity: getRecentActivity([
      ...movementData.slice(0, 5),
      ...polData.slice(0, 3),
      ...repairData.slice(0, 2),
    ]),
  };
}

function filterDataByDriver(driverName, dateRange) {
  const movementData = filterDataByDate("movement", dateRange).filter(
    (row) => row[1] === driverName // Driver Name at index 1
  );
  const polData = filterDataByDate("pol", dateRange);
  const repairData = filterDataByDate("repair-rep", dateRange);

  const vehiclesUsed = movementData.map((row) => row[0] || "");
  const totalFuel = polData.reduce(
    (sum, row) => sum + (parseFloat(row[7]) || 0),
    0
  ); // Quantity at index 7
  const totalRepair = repairData.reduce(
    (sum, row) => sum + (parseFloat(row[4]) || 0),
    0
  ); // Cost at index 4

  return {
    movementData,
    polData,
    repairData,
    totalEntries: movementData.length + polData.length + repairData.length,
    totalFuel,
    totalRepair,
    repairCount: repairData.length,
    fuelEntries: polData.length,
    vehiclesUsed,
    recentActivity: getRecentActivity([...movementData.slice(0, 5)]),
  };
}

function filterDataByDate(register, dateRange) {
  const data = JSON.parse(localStorage.getItem(`data_${register}`) || "[]");
  if (dateRange === "all" || !dateRange) return data;

  const now = new Date();
  let startDate = new Date();

  switch (dateRange) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return data;
  }

  return data.filter((row) => {
    try {
      // Find date in row based on register type
      let rowDateStr = "";
      if (register === "movement") {
        rowDateStr = row[2] || ""; // Date at index 2
      } else if (register === "pol") {
        rowDateStr = row[4] || ""; // Date at index 4
      } else if (register === "repair-rep") {
        rowDateStr = row[1] || ""; // Date In at index 1
      } else if (register === "repair-tyre") {
        rowDateStr = row[5] || ""; // Purchase Date at index 5
      } else if (register === "repair-bat") {
        rowDateStr = row[4] || ""; // Purchase Date at index 4
      }

      if (!rowDateStr) return true;

      const rowDate = new Date(rowDateStr);
      return !isNaN(rowDate.getTime()) && rowDate >= startDate;
    } catch (e) {
      return true;
    }
  });
}

function filterAllDataByDate(dateRange) {
  const movementData = filterDataByDate("movement", dateRange);
  const polData = filterDataByDate("pol", dateRange);
  const repairData = filterDataByDate("repair-rep", dateRange);
  const tyreData = filterDataByDate("repair-tyre", dateRange);
  const batteryData = filterDataByDate("repair-bat", dateRange);

  const totalFuel = polData.reduce(
    (sum, row) => sum + (parseFloat(row[7]) || 0),
    0
  ); // Quantity at index 7
  const totalRepair = repairData.reduce(
    (sum, row) => sum + (parseFloat(row[4]) || 0),
    0
  ); // Cost at index 4

  // Count unique vehicles from data
  const vehicles = new Set();
  movementData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });
  polData.forEach((row) => {
    if (row[1]) vehicles.add(row[1]); // Vehicle No at index 1
  });
  repairData.forEach((row) => {
    if (row[0]) vehicles.add(row[0]);
  });

  return {
    movementData,
    polData,
    repairData,
    tyreData,
    batteryData,
    totalEntries:
      movementData.length +
      polData.length +
      repairData.length +
      tyreData.length +
      batteryData.length,
    totalFuel,
    totalRepair,
    activeVehicles: vehicles.size,
    recentActivity: getRecentActivity([
      ...movementData.slice(0, 3),
      ...polData.slice(0, 2),
      ...repairData.slice(0, 1),
    ]),
  };
}

function updateKPICards(data) {
  document.getElementById("totalEntries").textContent = data.totalEntries || 0;
  document.getElementById("totalEntriesDetail").textContent =
    data.totalEntries > 0 ? `${data.totalEntries} total entries` : "No entries";

  document.getElementById("totalFuel").textContent = `${(
    data.totalFuel || 0
  ).toFixed(1)}L`;
  document.getElementById("totalFuelDetail").textContent =
    data.polData?.length > 0
      ? `${data.polData.length} fuel entries`
      : "No fuel data";

  document.getElementById("totalRepair").textContent = `₨${(
    data.totalRepair || 0
  ).toLocaleString()}`;
  document.getElementById("totalRepairDetail").textContent =
    data.repairData?.length > 0
      ? `${data.repairData.length} repairs`
      : "No repairs";

  document.getElementById("activeVehicles").textContent =
    data.activeVehicles || 0;
  document.getElementById("activeVehiclesDetail").textContent =
    data.activeVehicles > 0 ? `${data.activeVehicles} vehicles` : "No vehicles";
}

function updateRegisterBreakdown(data) {
  const movementCount = data.movementData?.length || 0;
  const polCount = data.polData?.length || 0;
  const repairCount =
    (data.repairData?.length || 0) +
    (data.tyreData?.length || 0) +
    (data.batteryData?.length || 0);

  document.getElementById("movementEntries").textContent = movementCount;
  document.getElementById("polEntries").textContent = polCount;
  document.getElementById("repairEntries").textContent = repairCount;

  // Calculate movement KM
  const movementKM =
    data.movementData?.reduce(
      (sum, row) => sum + (parseFloat(row[8]) || 0),
      0
    ) || 0; // KM Covered at index 8
  document.getElementById("movementKM").textContent = movementKM.toFixed(1);

  // Calculate POL cost
  const polCost =
    data.polData?.reduce((sum, row) => {
      const qty = parseFloat(row[7]) || 0; // Quantity at index 7
      const rate = parseFloat(row[8]) || 0; // Rate at index 8
      return sum + qty * rate;
    }, 0) || 0;
  document.getElementById(
    "polCost"
  ).textContent = `₨${polCost.toLocaleString()}`;
  document.getElementById("polFuelQty").textContent = `${(
    data.totalFuel || 0
  ).toFixed(1)}L`;

  // Repair cost
  document.getElementById("repairCost").textContent = `₨${(
    data.totalRepair || 0
  ).toLocaleString()}`;

  // Vehicle counts
  const movementVehicles =
    new Set(data.movementData?.map((row) => row[0] || "")).size || 0;
  const repairVehicles =
    new Set([
      ...(data.repairData?.map((row) => row[0] || "") || []),
      ...(data.tyreData?.map((row) => row[0] || "") || []),
      ...(data.batteryData?.map((row) => row[0] || "") || []),
    ]).size || 0;

  document.getElementById("movementVehicles").textContent = movementVehicles;
  document.getElementById("repairVehicles").textContent = repairVehicles;
}

function updateTopStats(data) {
  // Top Vehicles by Movement
  const vehicleStats = {};
  (data.movementData || []).forEach((row) => {
    const vehicle = row[0] || "Unknown";
    vehicleStats[vehicle] = (vehicleStats[vehicle] || 0) + 1;
  });

  const topVehicles = Object.entries(vehicleStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topVehiclesHTML =
    topVehicles
      .map(
        ([vehicle, count]) => `
    <div class="stats-item">
      <span>${vehicle}</span>
      <span class="stat-badge">${count} trips</span>
    </div>
  `
      )
      .join("") || '<div class="no-data">No vehicle data</div>';

  if (document.getElementById("topVehicles")) {
    document.getElementById("topVehicles").innerHTML = topVehiclesHTML;
  }

  // Top Drivers
  const driverStats = {};
  (data.movementData || []).forEach((row) => {
    const driver = row[1] || "Unknown"; // Driver Name at index 1
    driverStats[driver] = (driverStats[driver] || 0) + 1;
  });

  const topDrivers = Object.entries(driverStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topDriversHTML =
    topDrivers
      .map(
        ([driver, count]) => `
    <div class="stats-item">
      <span>${driver}</span>
      <span class="stat-badge">${count} trips</span>
    </div>
  `
      )
      .join("") || '<div class="no-data">No driver data</div>';

  if (document.getElementById("topDrivers")) {
    document.getElementById("topDrivers").innerHTML = topDriversHTML;
  }

  // Fuel Consumption by Vehicle
  const fuelStats = {};
  (data.polData || []).forEach((row) => {
    const vehicle = row[1] || "Unknown"; // Vehicle No at index 1
    const qty = parseFloat(row[7]) || 0; // Quantity at index 7
    fuelStats[vehicle] = (fuelStats[vehicle] || 0) + qty;
  });

  const fuelByVehicle = Object.entries(fuelStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const fuelHTML =
    fuelByVehicle
      .map(
        ([vehicle, qty]) => `
    <div class="stats-item">
      <span>${vehicle}</span>
      <span class="stat-badge">${qty.toFixed(1)}L</span>
    </div>
  `
      )
      .join("") || '<div class="no-data">No fuel data</div>';

  if (document.getElementById("fuelByVehicle")) {
    document.getElementById("fuelByVehicle").innerHTML = fuelHTML;
  }

  // Repair Costs by Vehicle
  const repairStats = {};
  (data.repairData || []).forEach((row) => {
    const vehicle = row[0] || "Unknown";
    const cost = parseFloat(row[4]) || 0; // Cost at index 4
    repairStats[vehicle] = (repairStats[vehicle] || 0) + cost;
  });

  const repairByVehicle = Object.entries(repairStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const repairHTML =
    repairByVehicle
      .map(
        ([vehicle, cost]) => `
    <div class="stats-item">
      <span>${vehicle}</span>
      <span class="stat-badge">₨${cost.toLocaleString()}</span>
    </div>
  `
      )
      .join("") || '<div class="no-data">No repair data</div>';

  if (document.getElementById("repairByVehicle")) {
    document.getElementById("repairByVehicle").innerHTML = repairHTML;
  }
}

function refreshDashboard() {
  updateDashboardData();
  showStatus("🔄 Dashboard refreshed", "success");
}

// ==================== TABLE MANAGEMENT FUNCTIONS ====================

function loadAllData() {
  Object.keys(TABLE_MAP).forEach((type) => loadTable(type));
  initializeSampleData();
}

function loadTable(type) {
  const tableId = TABLE_MAP[type];
  if (!tableId) return;
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  try {
    const data = JSON.parse(localStorage.getItem(`data_${type}`) || "[]");

    // Load only current page for large tables
    const pageData = data.slice(
      (currentPages[type] - 1) * pageSize,
      currentPages[type] * pageSize
    );

    tbody.innerHTML = "";
    pageData.forEach((row, index) => {
      const tr = tbody.insertRow();
      row.forEach((value) => {
        const td = tr.insertCell();
        td.contentEditable = true;
        td.textContent = value || "";
        td.addEventListener("blur", () => saveTable(type));
      });
      const delCell = tr.insertCell();
      const actualIndex = (currentPages[type] - 1) * pageSize + index;
      delCell.innerHTML = `<button class="delete" onclick="deleteRow('${type}', ${actualIndex})">Delete</button>`;
    });

    if (type === "pol") updatePolSummary();

    // Update pagination info
    updatePaginationInfo(type, data.length);
  } catch (e) {
    console.error("Load table error:", e);
  }
}

function updatePaginationInfo(type, totalRows) {
  const totalPages = Math.ceil(totalRows / pageSize);
  const pageInfo = document.getElementById(`${type}PageInfo`);
  const stats = document.getElementById(`${type}Stats`);

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPages[type]} of ${totalPages}`;
  }

  if (stats) {
    const start = (currentPages[type] - 1) * pageSize + 1;
    const end = Math.min(currentPages[type] * pageSize, totalRows);
    stats.textContent = `Showing ${start}-${end} of ${totalRows} entries`;
  }
}

function addRow(type) {
  const tableId = TABLE_MAP[type];
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  const tr = tbody.insertRow();
  const cols = COLUMN_COUNTS[type] || 5;

  for (let i = 0; i < cols; i++) {
    const td = tr.insertCell();
    td.contentEditable = true;

    // Set default values based on type
    if (type === "movement") {
      if (i === 0) td.textContent = "Vehicle No";
      else if (i === 1) td.textContent = "Driver Name";
      else if (i === 2) td.textContent = new Date().toISOString().split("T")[0];
      else if (i === 3) td.textContent = "09:00 | 17:00";
      else if (i === 6) td.textContent = "Purpose";
      else if (i === 7) td.textContent = "0 | 0";
      else td.textContent = "";
    } else if (type === "pol") {
      if (i === 0) td.textContent = tbody.rows.length.toString();
      else if (i === 1) td.textContent = "Vehicle No";
      else if (i === 2) td.textContent = "Month";
      else if (i === 3) td.textContent = "Year";
      else if (i === 4) td.textContent = new Date().toISOString().split("T")[0];
      else if (i === 5) td.textContent = "Diesel";
      else if (i === 7) td.textContent = "0";
      else if (i === 8) td.textContent = "0";
      else td.textContent = "";
    } else if (type === "repair-rep") {
      if (i === 0) td.textContent = "Vehicle No";
      else if (i === 1) td.textContent = new Date().toISOString().split("T")[0];
      else if (i === 2) td.textContent = new Date().toISOString().split("T")[0];
      else td.textContent = "";
    } else if (type === "repair-tyre") {
      if (i === 0) td.textContent = "Vehicle No";
      else td.textContent = "";
    } else if (type === "repair-bat") {
      if (i === 0) td.textContent = "Vehicle No";
      else td.textContent = "";
    } else {
      td.textContent = "";
    }

    td.addEventListener("blur", () => saveTable(type));
  }

  const delCell = tr.insertCell();
  const rowIndex = tbody.rows.length - 1;
  delCell.innerHTML = `<button class="delete" onclick="deleteRow('${type}', ${rowIndex})">Delete</button>`;

  saveTable(type);

  // Scroll to new row
  tr.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteRow(type, index) {
  if (!confirm("Are you sure you want to delete this entry?")) return;

  try {
    let data = JSON.parse(localStorage.getItem(`data_${type}`) || "[]");
    data.splice(index, 1);
    localStorage.setItem(`data_${type}`, JSON.stringify(data));
    loadTable(type);
    showStatus("✅ Entry deleted", "success");
  } catch (e) {
    showStatus("❌ Error deleting entry", "error");
  }
}

function saveTable(type) {
  const tableId = TABLE_MAP[type];
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;

  const data = [];
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const rowData = [];
    for (let j = 0; j < row.cells.length - 1; j++) {
      rowData.push(row.cells[j].textContent.trim());
    }
    data.push(rowData);
  }

  // Get all data to update the correct slice
  const allData = JSON.parse(localStorage.getItem(`data_${type}`) || "[]");
  const startIndex = (currentPages[type] - 1) * pageSize;

  // Update only the current page's data
  data.forEach((row, index) => {
    allData[startIndex + index] = row;
  });

  localStorage.setItem(`data_${type}`, JSON.stringify(allData));

  if (type === "pol") updatePolSummary();
}

function updatePolSummary() {
  try {
    const data = JSON.parse(localStorage.getItem("data_pol") || "[]");
    let totalQty = 0;
    let totalCost = 0;

    data.forEach((row) => {
      const qty = parseFloat(row[7] || 0); // Quantity at index 7
      const rate = parseFloat(row[8] || 0); // Rate at index 8
      totalQty += qty;
      totalCost += qty * rate;
    });

    const summaryDiv = document.getElementById("polSummary");
    if (summaryDiv) {
      summaryDiv.innerHTML = `
        <h3>Monthly Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Fuel:</span>
            <span class="summary-value">${totalQty.toFixed(2)}L</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total Cost:</span>
            <span class="summary-value">₨${totalCost.toFixed(2)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Entries:</span>
            <span class="summary-value">${data.length}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Avg Rate:</span>
            <span class="summary-value">₨${(totalQty > 0
              ? totalCost / totalQty
              : 0
            ).toFixed(2)}/L</span>
          </div>
        </div>
      `;
    }
  } catch (e) {
    console.error("POL summary error:", e);
  }
}

// ==================== MOVEMENT REGISTER FUNCTIONS ====================

function addNewMovementEntry() {
  // Get form values
  const vehicleNo = document.getElementById("addVehicleNo").value.trim();
  const driverName = document.getElementById("addDriverName").value.trim();
  const date = document.getElementById("addDate").value;
  const time = document.getElementById("addTime").value.trim();
  const staff = document.getElementById("addStaff").value.trim();
  const place = document.getElementById("addPlace").value.trim();
  const purpose = document.getElementById("addPurpose").value.trim();
  const meter = document.getElementById("addMeter").value.trim();
  const staffSig = document.getElementById("addStaffSig").value.trim();
  const driverSig = document.getElementById("addDriverSig").value.trim();

  // Validation
  if (!vehicleNo || !driverName || !date || !staff || !purpose) {
    showStatus("❌ Please fill all required fields", "error");
    return;
  }

  // Calculate kilometers
  let km = "0";
  if (meter) {
    const parts = meter.split("|").map((p) => parseFloat(p.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[1] >= parts[0]
    ) {
      km = (parts[1] - parts[0]).toFixed(1);
    }
  }

  // Get current data
  const currentData = JSON.parse(localStorage.getItem("data_movement") || "[]");

  // Create new entry with vehicle number and driver name included
  const newEntry = [
    vehicleNo,
    driverName,
    date,
    time,
    staff,
    place,
    purpose,
    meter,
    km,
    staffSig,
    driverSig,
  ];

  // Add to beginning of array
  currentData.unshift(newEntry);
  localStorage.setItem("data_movement", JSON.stringify(currentData));

  // Reload table
  loadTable("movement");

  // Clear form
  clearMovementForm();

  // Show success message
  showStatus("✅ Movement entry added successfully!", "success");

  // Refresh dashboard if on dashboard
  if (document.getElementById("dashboard").classList.contains("active")) {
    updateDashboardData();
  }
}

function clearMovementForm() {
  document.getElementById("addVehicleNo").value = "";
  document.getElementById("addDriverName").value = "";
  document.getElementById("addDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addTime").value = "";
  document.getElementById("addStaff").value = "";
  document.getElementById("addPlace").value = "";
  document.getElementById("addPurpose").value = "";
  document.getElementById("addMeter").value = "";
  document.getElementById("addStaffSig").value = "";
  document.getElementById("addDriverSig").value = "";
}

// ==================== POL REGISTER FUNCTIONS ====================

function addNewPolEntry() {
  // Get form values
  const vehicleNo = document.getElementById("addPolVehicleNo").value.trim();
  const month = document.getElementById("addMonth").value.trim();
  const year = document.getElementById("addYear").value.trim();
  const date = document.getElementById("addPolDate").value;
  const fuelType = document.getElementById("addFuelType").value;
  const coupon = document.getElementById("addCoupon").value.trim();
  const qty = document.getElementById("addQty").value;
  const rate = document.getElementById("addRate").value;
  const pump = document.getElementById("addPump").value.trim();
  const oilMR = document.getElementById("addOilMR").value;
  const oilFilterMR = document.getElementById("addOilFilterMR").value;
  const fuelFilterMR = document.getElementById("addFuelFilterMR").value;
  const airFilterMR = document.getElementById("addAirFilterMR").value;
  const transportSig = document.getElementById("addTransportSig").value.trim();
  const registrarSig = document.getElementById("addRegistrarSig").value.trim();

  // Validation
  if (!vehicleNo || !date || !qty || !rate) {
    showStatus("❌ Please fill all required fields", "error");
    return;
  }

  const qtyNum = parseFloat(qty);
  const rateNum = parseFloat(rate);

  if (isNaN(qtyNum) || isNaN(rateNum) || qtyNum <= 0 || rateNum <= 0) {
    showStatus("❌ Please enter valid quantity and rate", "error");
    return;
  }

  // Get current data and calculate serial number
  const currentData = JSON.parse(localStorage.getItem("data_pol") || "[]");
  const serialNo = currentData.length + 1;

  // Create new entry
  const newEntry = [
    serialNo.toString(),
    vehicleNo,
    month,
    year,
    date,
    fuelType,
    coupon ||
      `CV-${new Date().getFullYear()}-${String(serialNo).padStart(3, "0")}`,
    qtyNum.toFixed(2),
    rateNum.toFixed(2),
    pump,
    oilMR || "",
    oilFilterMR || "",
    fuelFilterMR || "",
    airFilterMR || "",
    transportSig || "TIC",
    registrarSig || "REG",
  ];

  // Add to beginning
  currentData.unshift(newEntry);
  localStorage.setItem("data_pol", JSON.stringify(currentData));

  // Reload table and update summary
  loadTable("pol");
  updatePolSummary();

  // Clear form
  clearPolForm();

  showStatus("✅ Fuel entry added successfully!", "success");

  // Refresh dashboard
  if (document.getElementById("dashboard").classList.contains("active")) {
    updateDashboardData();
  }
}

function clearPolForm() {
  document.getElementById("addPolVehicleNo").value = "";
  document.getElementById("addMonth").value = "";
  document.getElementById("addYear").value = "";
  document.getElementById("addPolDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addFuelType").value = "Diesel";
  document.getElementById("addCoupon").value = "";
  document.getElementById("addQty").value = "";
  document.getElementById("addRate").value = "";
  document.getElementById("addPump").value = "";
  document.getElementById("addOilMR").value = "";
  document.getElementById("addOilFilterMR").value = "";
  document.getElementById("addFuelFilterMR").value = "";
  document.getElementById("addAirFilterMR").value = "";
  document.getElementById("addTransportSig").value = "";
  document.getElementById("addRegistrarSig").value = "";
}

// ==================== REPAIR REGISTER FUNCTIONS ====================

function addNewRepairEntry() {
  const vehicleNo = document.getElementById("addRepVehicleNo").value.trim();
  const dateIn = document.getElementById("addDateIn").value;
  const dateOut = document.getElementById("addDateOut").value;
  const repairDetails = document
    .getElementById("addRepairDetails")
    .value.trim();
  const cost = document.getElementById("addRepairCost").value;
  const voucherNo = document.getElementById("addVoucherNo").value.trim();
  const transportSig = document
    .getElementById("addRepTransportSig")
    .value.trim();
  const registrarSig = document
    .getElementById("addRepRegistrarSig")
    .value.trim();

  if (!vehicleNo || !dateIn || !repairDetails) {
    showStatus("❌ Please fill all required fields", "error");
    return;
  }

  const costNum = parseFloat(cost) || 0;

  const currentData = JSON.parse(
    localStorage.getItem("data_repair-rep") || "[]"
  );
  const newEntry = [
    vehicleNo,
    dateIn,
    dateOut || dateIn,
    repairDetails,
    costNum.toFixed(2),
    voucherNo ||
      `CV-REP-${new Date().getFullYear()}-${String(
        currentData.length + 1
      ).padStart(3, "0")}`,
    transportSig || "TIC",
    registrarSig || "REG",
  ];

  currentData.unshift(newEntry);
  localStorage.setItem("data_repair-rep", JSON.stringify(currentData));

  loadTable("repair-rep");
  clearRepairForm();
  showStatus("✅ Repair entry added successfully!", "success");

  if (document.getElementById("dashboard").classList.contains("active")) {
    updateDashboardData();
  }
}

function addNewTyreEntry() {
  const vehicleNo = document.getElementById("addTyreVehicleNo").value.trim();
  const tyreMake = document.getElementById("addTyreMake").value.trim();
  const currentMR = document.getElementById("addCurrentMR").value;
  const lastMR = document.getElementById("addLastMR").value;
  const totalKMDue = document.getElementById("addTotalKMDue").value;
  const tyreDate = document.getElementById("addTyreDate").value;
  const tyreNo = document.getElementById("addTyreNo").value.trim();

  if (!vehicleNo || !tyreMake) {
    showStatus("❌ Please fill all required fields", "error");
    return;
  }

  const currentData = JSON.parse(
    localStorage.getItem("data_repair-tyre") || "[]"
  );
  const newEntry = [
    vehicleNo,
    tyreMake,
    currentMR || "0",
    lastMR || "0",
    totalKMDue || "0",
    tyreDate || new Date().toISOString().split("T")[0],
    tyreNo || `TYR-${String(currentData.length + 1).padStart(3, "0")}`,
  ];

  currentData.unshift(newEntry);
  localStorage.setItem("data_repair-tyre", JSON.stringify(currentData));

  loadTable("repair-tyre");
  clearTyreForm();
  showStatus("✅ Tyre entry added successfully!", "success");
}

function addNewBatteryEntry() {
  const vehicleNo = document.getElementById("addBatVehicleNo").value.trim();
  const currentBattery = document
    .getElementById("addCurrentBattery")
    .value.trim();
  const lastReplacement = document.getElementById("addLastReplacement").value;
  const newBattery = document.getElementById("addNewBattery").value.trim();
  const newBatteryDate = document.getElementById("addNewBatteryDate").value;
  const transportSig = document
    .getElementById("addBatTransportSig")
    .value.trim();
  const registrarSig = document
    .getElementById("addBatRegistrarSig")
    .value.trim();

  if (!vehicleNo || !newBattery) {
    showStatus("❌ Please fill all required fields", "error");
    return;
  }

  const currentData = JSON.parse(
    localStorage.getItem("data_repair-bat") || "[]"
  );
  const newEntry = [
    vehicleNo,
    currentBattery || "Not specified",
    lastReplacement || "",
    newBattery,
    newBatteryDate || new Date().toISOString().split("T")[0],
    transportSig || "TIC",
    registrarSig || "REG",
  ];

  currentData.unshift(newEntry);
  localStorage.setItem("data_repair-bat", JSON.stringify(currentData));

  loadTable("repair-bat");
  clearBatteryForm();
  showStatus("✅ Battery entry added successfully!", "success");
}

function clearRepairForm() {
  document.getElementById("addRepVehicleNo").value = "";
  document.getElementById("addDateIn").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addDateOut").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addRepairDetails").value = "";
  document.getElementById("addRepairCost").value = "";
  document.getElementById("addVoucherNo").value = "";
  document.getElementById("addRepTransportSig").value = "";
  document.getElementById("addRepRegistrarSig").value = "";
}

function clearTyreForm() {
  document.getElementById("addTyreVehicleNo").value = "";
  document.getElementById("addTyreMake").value = "";
  document.getElementById("addCurrentMR").value = "";
  document.getElementById("addLastMR").value = "";
  document.getElementById("addTotalKMDue").value = "";
  document.getElementById("addTyreDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addTyreNo").value = "";
}

function clearBatteryForm() {
  document.getElementById("addBatVehicleNo").value = "";
  document.getElementById("addCurrentBattery").value = "";
  document.getElementById("addLastReplacement").value = "";
  document.getElementById("addNewBattery").value = "";
  document.getElementById("addNewBatteryDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("addBatTransportSig").value = "";
  document.getElementById("addBatRegistrarSig").value = "";
}

// ==================== SCROLL FUNCTIONS ====================

function scrollToForm() {
  const form = document.querySelector("#movement .full-add-form");
  if (form) {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToPolForm() {
  const form = document.querySelector("#pol .full-add-form");
  if (form) {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToRepairForm() {
  const activeSection = document.querySelector(".repair-section.active");
  if (activeSection) {
    const form = activeSection.querySelector(".full-add-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

// ==================== REPAIR SECTION NAVIGATION ====================

function showRepairSection(section) {
  // Hide all sections
  document.querySelectorAll(".repair-section").forEach((el) => {
    el.classList.remove("active");
    el.style.display = "none";
  });

  // Remove active class from all buttons
  document.querySelectorAll(".section-nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Show selected section
  const targetSection = document.getElementById(`${section}Repair`);
  if (targetSection) {
    targetSection.classList.add("active");
    targetSection.style.display = "block";
  }

  // Activate selected button
  const activeBtn = document.querySelector(
    `.section-nav-btn[onclick="showRepairSection('${section}')"]`
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Reset pagination for repair
  currentPages.repair = 1;

  // Load the table for the selected section
  if (section === "general") {
    loadTable("repair-rep");
  } else if (section === "tyre") {
    loadTable("repair-tyre");
  } else if (section === "battery") {
    loadTable("repair-bat");
  }
}

function loadRepairSection() {
  showRepairSection("general");
  loadTable("repair-rep");
  loadTable("repair-tyre");
  loadTable("repair-bat");
}

// ==================== QUICK ADD FUNCTIONS (KEPT FOR COMPATIBILITY) ====================

function addQuickMovementEntry() {
  const date = document.getElementById("quickDate").value;
  const time = document.getElementById("quickTime").value;
  const staff = document.getElementById("quickStaff").value;
  const place = document.getElementById("quickPlace").value;
  const purpose = document.getElementById("quickPurpose").value;
  const meter = document.getElementById("quickMeter").value;
  const staffSig = document.getElementById("quickStaffSig").value;
  const driverSig = document.getElementById("quickDriverSig").value;

  if (!date || !staff || !purpose) {
    showStatus(
      "❌ Please fill required fields (Date, Staff, Purpose)",
      "error"
    );
    return;
  }

  // Get vehicle and driver from header or default
  const vehicleNo = "Vehicle";
  const driverName = "Driver";

  // Calculate kilometers
  let km = "0";
  if (meter) {
    const parts = meter.split("|").map((p) => parseFloat(p.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[1] >= parts[0]
    ) {
      km = (parts[1] - parts[0]).toFixed(1);
    }
  }

  // Get current data
  const currentData = JSON.parse(localStorage.getItem("data_movement") || "[]");
  const newEntry = [
    vehicleNo,
    driverName,
    date,
    time,
    staff,
    place,
    purpose,
    meter,
    km,
    staffSig,
    driverSig,
  ];

  // Add to beginning of array
  currentData.unshift(newEntry);
  localStorage.setItem("data_movement", JSON.stringify(currentData));

  // Reload table
  loadTable("movement");

  // Clear form
  clearQuickMovementForm();

  // Show success message
  showStatus("✅ Movement entry added successfully!", "success");

  // Refresh dashboard if on dashboard
  if (document.getElementById("dashboard").classList.contains("active")) {
    updateDashboardData();
  }
}

function addQuickPolEntry() {
  const date = document.getElementById("quickPolDate").value;
  const fuelType = document.getElementById("quickFuelType").value;
  const qty = document.getElementById("quickQty").value;
  const rate = document.getElementById("quickRate").value;
  const coupon = document.getElementById("quickCoupon").value;

  if (!date || !qty || !rate) {
    showStatus(
      "❌ Please fill required fields (Date, Quantity, Rate)",
      "error"
    );
    return;
  }

  const qtyNum = parseFloat(qty);
  const rateNum = parseFloat(rate);

  if (isNaN(qtyNum) || isNaN(rateNum) || qtyNum <= 0 || rateNum <= 0) {
    showStatus("❌ Please enter valid quantity and rate", "error");
    return;
  }

  // Get current data
  const currentData = JSON.parse(localStorage.getItem("data_pol") || "[]");
  const serialNo = currentData.length + 1;
  const newEntry = [
    serialNo.toString(),
    "Vehicle",
    "Month",
    "Year",
    date,
    fuelType,
    coupon ||
      `CV-${new Date().getFullYear()}-${String(serialNo).padStart(3, "0")}`,
    qtyNum.toFixed(2),
    rateNum.toFixed(2),
    "",
    "",
    "",
    "",
    "", // Filter readings
    "TIC", // Transport In-Charge Sig
    "REG", // Registrar Sig
  ];

  // Add to beginning
  currentData.unshift(newEntry);
  localStorage.setItem("data_pol", JSON.stringify(currentData));

  // Reload table and update summary
  loadTable("pol");
  updatePolSummary();

  // Clear form
  clearQuickPolForm();

  showStatus("✅ Fuel entry added successfully!", "success");

  // Refresh dashboard
  if (document.getElementById("dashboard").classList.contains("active")) {
    updateDashboardData();
  }
}

function clearQuickMovementForm() {
  document.getElementById("quickDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("quickTime").value = "";
  document.getElementById("quickStaff").value = "";
  document.getElementById("quickPlace").value = "";
  document.getElementById("quickPurpose").value = "";
  document.getElementById("quickMeter").value = "";
  document.getElementById("quickStaffSig").value = "";
  document.getElementById("quickDriverSig").value = "";
}

function clearQuickPolForm() {
  document.getElementById("quickPolDate").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("quickQty").value = "";
  document.getElementById("quickRate").value = "";
  document.getElementById("quickCoupon").value = "";
}

// ==================== TABLE NAVIGATION FUNCTIONS ====================

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function nextPage(type) {
  const data = JSON.parse(localStorage.getItem(`data_${type}`) || "[]");
  const totalPages = Math.ceil(data.length / pageSize);

  if (currentPages[type] < totalPages) {
    currentPages[type]++;
    loadTable(type);
    scrollToTop();
  }
}

function previousPage(type) {
  if (currentPages[type] > 1) {
    currentPages[type]--;
    loadTable(type);
    scrollToTop();
  }
}

function filterMovementTable() {
  const searchTerm = document
    .getElementById("movementSearch")
    .value.toLowerCase();
  const rows = document.querySelectorAll("#movTable tbody tr");
  let visibleCount = 0;

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
    if (text.includes(searchTerm)) visibleCount++;
  });

  const stats = document.getElementById("movementStats");
  if (stats) {
    const totalData = JSON.parse(localStorage.getItem("data_movement") || "[]");
    stats.textContent = `Showing ${visibleCount} of ${totalData.length} entries`;
  }
}

function filterPolTable() {
  const searchTerm = document.getElementById("polSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#polTable tbody tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
}

function filterRepairTable() {
  const searchTerm = document
    .getElementById("repairSearch")
    .value.toLowerCase();
  const tables = ["#repTable", "#tyreTable", "#batTable"];

  tables.forEach((selector) => {
    const rows = document.querySelectorAll(`${selector} tbody tr`);
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });
}

// ==================== SAMPLE DATA INITIALIZATION ====================

// function initializeSampleData() {
//   // Only initialize if no data exists
//   if (localStorage.getItem("data_movement") === null) {
//     const sampleMovement = [
//       [
//         "VH-1234",
//         "John Smith",
//         "2024-01-15",
//         "09:00 | 17:30",
//         "Sarah Ahmed",
//         "Office | Client Site",
//         "Client Meeting",
//         "15000 | 15045",
//         "45.0",
//         "J. Smith",
//         "D. Johnson",
//       ],
//       [
//         "VH-5678",
//         "David Johnson",
//         "2024-01-16",
//         "08:30 | 16:45",
//         "Michael Brown",
//         "Main Office | Airport",
//         "Airport Pickup",
//         "15045 | 15080",
//         "35.0",
//         "S. Ahmed",
//         "D. Johnson",
//       ],
//     ];
//     localStorage.setItem("data_movement", JSON.stringify(sampleMovement));
//   }

//   if (localStorage.getItem("data_pol") === null) {
//     const samplePol = [
//       [
//         "1",
//         "VH-1234",
//         "January",
//         "2024",
//         "2024-01-15",
//         "Diesel",
//         "CV-2024-001",
//         "50.00",
//         "275.50",
//         "Shell Station - BILL#12345",
//         "15000",
//         "14500",
//         "14800",
//         "14900",
//         "TIC",
//         "REG",
//       ],
//     ];
//     localStorage.setItem("data_pol", JSON.stringify(samplePol));
//   }

//   if (localStorage.getItem("data_repair-rep") === null) {
//     const sampleRepair = [
//       [
//         "VH-1234",
//         "2024-01-10",
//         "2024-01-12",
//         "Brake pad replacement and oil change",
//         "12500.00",
//         "CV-REP-2024-001",
//         "TIC",
//         "REG",
//       ],
//     ];
//     localStorage.setItem("data_repair-rep", JSON.stringify(sampleRepair));
//   }

//   if (localStorage.getItem("data_repair-tyre") === null) {
//     const sampleTyre = [
//       [
//         "VH-1234",
//         "Michelin 205/55 R16",
//         "15200",
//         "10000",
//         "40000",
//         "2024-01-05",
//         "TYR-001",
//       ],
//     ];
//     localStorage.setItem("data_repair-tyre", JSON.stringify(sampleTyre));
//   }

//   if (localStorage.getItem("data_repair-bat") === null) {
//     const sampleBattery = [
//       [
//         "VH-1234",
//         "EXIDE 12V 60Ah",
//         "2022-06-15",
//         "AMARON 12V 65Ah",
//         "2024-01-20",
//         "TIC",
//         "REG",
//       ],
//     ];
//     localStorage.setItem("data_repair-bat", JSON.stringify(sampleBattery));
//   }
// }

// ==================== UTILITY FUNCTIONS ====================

function showSection(sectionId) {
  // Close mobile menu if open
  if (window.innerWidth <= 992) {
    const navMenu = document.getElementById("navMenu");
    const navToggle = document.getElementById("navToggle");
    if (navMenu && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      const icon = navToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  }

  // Update nav buttons active states
  document.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Find and activate the correct button
  const activeBtn = Array.from(document.querySelectorAll(".nav-link")).find(
    (btn) =>
      btn.getAttribute("onclick") &&
      btn.getAttribute("onclick").includes(sectionId)
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // Show section
  document
    .querySelectorAll(".section")
    .forEach((section) => section.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");

  // Reset pagination for the section
  if (sectionId === "movement") currentPages.movement = 1;
  if (sectionId === "pol") currentPages.pol = 1;
  if (sectionId === "repair") {
    currentPages.repair = 1;
    loadRepairSection();
  }

  // Load section specific data
  if (sectionId === "settings") {
    loadSettings();
  } else if (sectionId === "dashboard") {
    loadDashboard();
  } else if (sectionId === "movement") {
    loadTable("movement");
  } else if (sectionId === "pol") {
    loadTable("pol");
  }
}

function loadSettings() {
  updateSettingsUI();
}

function startAutoDownload() {
  // This is now handled by startAutoExportMonitor()
  startAutoExportMonitor();
}

// Status notification
function showStatus(message, type) {
  let status = document.querySelector(".status-msg");
  if (status) status.remove();

  status = document.createElement("div");
  status.className = `status-msg ${type}`;
  status.textContent = message;
  status.style.cssText = `
    position: fixed; top: 2rem; right: 2rem; padding: 1.25rem 2rem; 
    border-radius: 16px; color: white; font-weight: 600; z-index: 1001;
    ${
      type === "success"
        ? "background: linear-gradient(135deg, #10b981, #059669);"
        : "background: linear-gradient(135deg, #ef4444, #dc2626);"
    }
    animation: slideInRight 0.4s ease; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(status);
  setTimeout(() => status.remove(), 4000);
}

// ==================== CHART FUNCTIONS ====================

function createCharts() {
  // Simplified chart creation - you can enhance this with Chart.js if needed
  const movementData = JSON.parse(
    localStorage.getItem("data_movement") || "[]"
  );
  const polData = JSON.parse(localStorage.getItem("data_pol") || "[]");
  const repairData = JSON.parse(
    localStorage.getItem("data_repair-rep") || "[]"
  );

  // Create simple bar charts using canvas
  drawSimpleChart(
    "movementChart",
    movementData.length,
    "Movement Entries",
    "#3b82f6"
  );
  drawSimpleChart("fuelChart", polData.length, "Fuel Entries", "#10b981");
  drawSimpleChart(
    "repairChart",
    repairData.length,
    "Repair Entries",
    "#f59e0b"
  );
}

function drawSimpleChart(canvasId, value, label, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Draw bar
  const barWidth = 40;
  const barHeight = (value / Math.max(value, 10)) * (height - 60);
  const x = (width - barWidth) / 2;
  const y = height - barHeight - 30;

  // Gradient for bar
  const gradient = ctx.createLinearGradient(0, y, 0, height - 30);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + "80");

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, barWidth, barHeight);

  // Draw label
  ctx.fillStyle = "#374151";
  ctx.font = "bold 14px Inter";
  ctx.textAlign = "center";
  ctx.fillText(label, width / 2, height - 10);

  // Draw value
  ctx.fillStyle = color;
  ctx.font = "bold 24px Inter";
  ctx.fillText(value, width / 2, y - 10);
}

// ==================== RECENT ACTIVITY FUNCTIONS ====================

function getRecentActivity(data) {
  const activities = [];

  // Get recent movement entries
  const movementData = JSON.parse(
    localStorage.getItem("data_movement") || "[]"
  ).slice(0, 3);
  movementData.forEach((row) => {
    activities.push({
      type: "movement",
      icon: "🚗",
      title: `${row[0] || "Vehicle"} - ${row[1] || "Driver"}`,
      details: `${row[6] || "No purpose"} | ${row[8] || "0"} km`,
      time: row[2] || "Unknown date",
    });
  });

  // Get recent POL entries
  const polData = JSON.parse(localStorage.getItem("data_pol") || "[]").slice(
    0,
    2
  );
  polData.forEach((row) => {
    activities.push({
      type: "pol",
      icon: "⛽",
      title: `${row[1] || "Vehicle"} - ${row[5] || "Fuel"}`,
      details: `${row[7] || "0"}L @ ₨${row[8] || "0"}`,
      time: row[4] || "Unknown date",
    });
  });

  // Get recent repair entries
  const repairData = JSON.parse(
    localStorage.getItem("data_repair-rep") || "[]"
  ).slice(0, 1);
  repairData.forEach((row) => {
    activities.push({
      type: "repair",
      icon: "🔧",
      title: `${row[0] || "Vehicle"} - Repair`,
      details: `${row[3]?.substring(0, 30) || "No details"}...`,
      time: row[1] || "Unknown date",
    });
  });

  // Sort by date (simplified)
  return activities
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 5);
}

function updateRecentActivity(activities) {
  const container = document.getElementById("recentActivity");
  if (!container) return;

  if (!activities || activities.length === 0) {
    container.innerHTML = '<div class="no-activity">No recent activity</div>';
    return;
  }

  const html = activities
    .map(
      (activity) => `
    <div class="activity-item">
      <div class="activity-icon" style="background: ${getActivityColor(
        activity.type
      )}">
        ${activity.icon}
      </div>
      <div class="activity-content">
        <div class="activity-title">${activity.title}</div>
        <div class="activity-details">${activity.details}</div>
        <div class="activity-time">${formatTime(activity.time)}</div>
      </div>
    </div>
  `
    )
    .join("");

  container.innerHTML = html;
}

function getActivityColor(type) {
  switch (type) {
    case "movement":
      return "linear-gradient(135deg, #3b82f6, #1d4ed8)";
    case "pol":
      return "linear-gradient(135deg, #10b981, #059669)";
    case "repair":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    default:
      return "linear-gradient(135deg, #6b7280, #4b5563)";
  }
}

function formatTime(dateString) {
  if (!dateString) return "Unknown time";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  } catch (e) {
    return dateString;
  }
}

// ==================== ADDITIONAL SETTINGS FUNCTIONS ====================

function clearAllData() {
  if (
    !confirm(
      "⚠️ This will delete ALL data from all registers. This action cannot be undone. Are you sure?"
    )
  ) {
    return;
  }

  // Clear all data
  Object.keys(TABLE_MAP).forEach((type) => {
    localStorage.removeItem(`data_${type}`);
  });

  // Clear table contents
  Object.values(TABLE_MAP).forEach((tableId) => {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (tbody) tbody.innerHTML = "";
  });

  // Update summaries
  updatePolSummary();

  // Initialize sample data again
  initializeSampleData();
  loadAllData();

  showStatus("🗑️ All data cleared. Sample data reinitialized.", "success");
}

function backupData() {
  const backup = {};

  // Backup all data
  Object.keys(TABLE_MAP).forEach((type) => {
    backup[`data_${type}`] = JSON.parse(
      localStorage.getItem(`data_${type}`) || "[]"
    );
  });

  // Backup settings
  backup.settings = settings;

  // Create download
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const dateStr = new Date().toISOString().slice(0, 10);

  const a = document.createElement("a");
  a.href = url;
  a.download = `vms_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showStatus("💾 Backup created successfully", "success");
}

function exportSettings() {
  const settingsStr = JSON.stringify(settings, null, 2);
  const dataBlob = new Blob([settingsStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "vms_settings.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showStatus("⚙️ Settings exported", "success");
}

function importSettings() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      try {
        const importedSettings = JSON.parse(event.target.result);

        // Merge with current settings
        settings = { ...settings, ...importedSettings };
        localStorage.setItem("vms_settings", JSON.stringify(settings));

        // Apply to UI
        applySettings();
        updateSettingsUI();

        showStatus("⚙️ Settings imported successfully", "success");
      } catch (error) {
        showStatus("❌ Error importing settings", "error");
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// ==================== KEYBOARD SUPPORT ====================

document.addEventListener("keypress", function (e) {
  if (
    e.key === "Enter" &&
    document.getElementById("loginContainer") &&
    !document
      .getElementById("loginContainer")
      .classList.contains("dashboard-hidden")
  ) {
    login();
  }
});

// Export for manual download (compatibility)
async function downloadAllCSVs() {
  await autoExportAll();
}

// ==================== HELPER FUNCTIONS ====================

function showQuickAddForm() {
  const form = document.querySelector("#movement .quick-add-form");
  if (form) {
    form.style.display = form.style.display === "none" ? "block" : "none";
  }
}

function showQuickPolForm() {
  const form = document.querySelector("#pol .quick-add-form");
  if (form) {
    form.style.display = form.style.display === "none" ? "block" : "none";
  }
}

function showQuickRepairForm() {
  // Show general repair section
  showRepairSection("general");

  // Scroll to add button
  const addBtn = document.querySelector("#generalRepair .add-row");
  if (addBtn) {
    addBtn.scrollIntoView({ behavior: "smooth" });
  }
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSettings);
} else {
  initializeSettings();
}

// Set default repair section on load
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    if (document.getElementById("repair").classList.contains("active")) {
      showRepairSection("general");
    }
  }, 100);
});

// Trạng thái trung tâm đồng bộ 11 trường JSON từ Arduino
const appState = {
  t: null, h: null, l: null,
  s1: null, s2: null,
  r1: 0, r2: 0, r3: 0,
  m: "AUTO",
  e: 0,
  estop: 0,
  lastPacketAt: 0
};

// Ánh xạ phần tử DOM
const ui = {
  mqttBadge:       document.getElementById("mqttBadge"),
  gatewayBadge:    document.getElementById("gatewayBadge"),
  estopBanner:     document.getElementById("estopBanner"),
  sensorErrBanner: document.getElementById("sensorErrBanner"),
  valTemp:         document.getElementById("valTemp"),
  valHum:          document.getElementById("valHum"),
  valLux:          document.getElementById("valLux"),
  valSoil1:        document.getElementById("valSoil1"),
  valSoil2:        document.getElementById("valSoil2"),
  btnEstop:        document.getElementById("btnEstop"),
  btnMode:         document.getElementById("btnMode"),
  btnR1:           document.getElementById("btnR1"),
  btnR2:           document.getElementById("btnR2"),
  btnR3:           document.getElementById("btnR3"),
  lastUpdate:      document.getElementById("lastUpdate")
};

// Cập nhật toàn bộ giao diện theo appState
function renderUI() {
  if (appState.t !== null) {
    ui.valTemp.textContent  = `${Number(appState.t).toFixed(1)} °C`;
    ui.valHum.textContent   = `${Number(appState.h).toFixed(1)} %`;
    ui.valLux.textContent   = `${appState.l} lx`;
    ui.valSoil1.textContent = `${appState.s1} %`;
    ui.valSoil2.textContent = `${appState.s2} %`;
  }

  // Banner cảnh báo an toàn
  ui.estopBanner.classList.toggle("hidden", appState.estop !== 1);
  ui.sensorErrBanner.classList.toggle("hidden", appState.e !== 1);

  // Nút E-STOP
  const isEstop = appState.estop === 1;
  ui.btnEstop.textContent = isEstop ? "ĐANG KHÓA E-STOP" : "E-STOP: OFF";
  ui.btnEstop.className   = `btn ${isEstop ? "btn-estop-on" : "btn-estop-off"}`;

  // Nút chế độ AUTO / MANUAL
  const isAuto = appState.m === "AUTO";
  ui.btnMode.textContent = appState.m;
  ui.btnMode.className   = `btn ${isAuto ? "btn-auto" : "btn-manual"}`;

  // 3 nút Relay (Khóa nút Bơm R1 khi đang E-STOP hoặc lỗi cảm biến)
  [1, 2, 3].forEach((i) => {
    const btn = ui[`btnR${i}`];
    const isOn = appState[`r${i}`] === 1;
    btn.textContent = isOn ? "ON" : "OFF";
    btn.className   = `btn ${isOn ? "btn-on" : "btn-off"}`;
  });
  ui.btnR1.disabled = (appState.estop === 1 || appState.e === 1);
}

// Gắn sự kiện nhấn nút gửi lệnh MQTT xuống ESP32-S3 -> Arduino
function bindEvents() {
  ui.btnEstop.addEventListener("click", () => {
    MqttService.sendCommand(`ESTOP:${appState.estop === 1 ? 0 : 1}`);
  });

  ui.btnMode.addEventListener("click", () => {
    MqttService.sendCommand(`MODE:${appState.m === "AUTO" ? "MANUAL" : "AUTO"}`);
  });

  [1, 2, 3].forEach((i) => {
    ui[`btnR${i}`].addEventListener("click", () => {
      const next = appState[`r${i}`] === 1 ? 0 : 1;
      MqttService.sendCommand(`R${i}:${next}`);
    });
  });
}

// Giám sát timeout gói tin từ ESP32-S3 mỗi 1 giây
function startGatewayWatchdog() {
  setInterval(() => {
    if (!appState.lastPacketAt) return;
    const elapsed = Date.now() - appState.lastPacketAt;
    const alive = elapsed <= APP_CONFIG.mqtt.offlineTimeoutMs;
    ui.gatewayBadge.textContent = alive ? "Gateway: Online" : "Gateway: Mất tín hiệu";
    ui.gatewayBadge.className   = `badge ${alive ? "online" : "offline"}`;
  }, 1000);
}

// Khởi chạy ứng dụng
function initApp() {
  bindEvents();
  renderUI();
  startGatewayWatchdog();

  MqttService.connect({
    onStatusChange: (connected) => {
      ui.mqttBadge.textContent = connected ? "MQTT: Online (WSS)" : "MQTT: Mất kết nối";
      ui.mqttBadge.className   = `badge ${connected ? "online" : "offline"}`;
    },
    onData: (d) => {
      Object.assign(appState, {
        t: d.t ?? 0, h: d.h ?? 0, l: d.l ?? 0,
        s1: d.s1 ?? 0, s2: d.s2 ?? 0,
        r1: d.r1 ?? 0, r2: d.r2 ?? 0, r3: d.r3 ?? 0,
        m: d.m || "AUTO",
        e: d.e ?? 0,
        estop: d.estop ?? 0,
        lastPacketAt: Date.now()
      });

      ui.gatewayBadge.textContent = "Gateway: Online";
      ui.gatewayBadge.className   = "badge online";
      ui.lastUpdate.textContent   = `Cập nhật lúc: ${new Date().toLocaleTimeString()}`;

      renderUI();
    }
  });
}

document.addEventListener("DOMContentLoaded", initApp);

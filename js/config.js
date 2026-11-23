const APP_CONFIG = {
  mqtt: {
    brokerUrl: "wss://broker.hivemq.com:8884/mqtt",
    topicData: "nhakinh_iot_2026/data",
    topicCmd:  "nhakinh_iot_2026/cmd",
    reconnectPeriodMs: 3000,
    offlineTimeoutMs:  6000 // Quá 6s không có gói mới -> báo mất tín hiệu Gateway
  },
  thresholds: {
    soilOn:  40,    // < 40% bật bơm
    soilOff: 55,    // > 55% tắt bơm
    luxOn:   400,   // < 400 lx bật đèn
    luxOff:  500,   // > 500 lx tắt đèn
    tempOn:  32.0,  // > 32.0°C bật quạt
    tempOff: 30.0   // < 30.0°C tắt quạt
  }
};

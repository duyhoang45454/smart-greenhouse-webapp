const MqttService = (() => {
  let client = null;

  function connect({ onStatusChange, onData }) {
    const clientId = "WEB_GH_" + Math.random().toString(16).slice(2, 8);

    client = mqtt.connect(APP_CONFIG.mqtt.brokerUrl, {
      clientId,
      reconnectPeriod: APP_CONFIG.mqtt.reconnectPeriodMs
    });

    client.on("connect", () => {
      onStatusChange(true);
      client.subscribe(APP_CONFIG.mqtt.topicData);
    });

    client.on("close", () => onStatusChange(false));
    client.on("offline", () => onStatusChange(false));

    client.on("message", (topic, payload) => {
      if (topic !== APP_CONFIG.mqtt.topicData) return;
      try {
        const data = JSON.parse(payload.toString());
        onData(data);
      } catch (err) {
        console.error("Gói JSON không hợp lệ:", payload.toString());
      }
    });
  }

  function sendCommand(cmd) {
    if (!client || !client.connected) {
      console.warn("Chưa kết nối MQTT, không thể gửi lệnh:", cmd);
      return false;
    }
    client.publish(APP_CONFIG.mqtt.topicCmd, cmd);
    return true;
  }

  return { connect, sendCommand };
})();

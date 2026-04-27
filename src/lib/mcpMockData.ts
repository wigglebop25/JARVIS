export const MCP_MOCK_RESPONSES = [
  "LOCAL_NODE_SYNC: Analyzing system logs for anomalies... No critical errors detected in the last 24 hours.",
  "PROTOCOL_SECURE: Commands executed in air-gapped environment. Neural weights remains local.",
  "HARDWARE_REPORT: CPU thermals stable at 42°C. Fan speeds at 1200 RPM. Node health: 100%.",
  "NEURAL_QUERY: Processing logic through local Llama core. Context window optimized for current session.",
  "SECURITY_CHECK: All external ports remain closed. Firewall integrity verified.",
  "WAKE_ON_LAN: Signal sent to device node-02. Status: Awaiting heartbeat.",
];

export const getRandomMcpResponse = () => {
  return MCP_MOCK_RESPONSES[Math.floor(Math.random() * MCP_MOCK_RESPONSES.length)];
};
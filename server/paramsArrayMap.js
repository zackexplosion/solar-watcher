const paramsArrayMap = [
  'timestamp', // 0
  'gridVoltage', 'gridFrequency',
  'acOutputVoltage', 'acOutputFrequency',
  'acOutputApparentPower', 'acOutputActivePower',
  'acOutputLoad', // 7
  'busVoltage', 'batteryVoltage',
  'batteryChargingCurrent', 'batteryCapacity',
  'heatSinkTemp', // 12
  'pvInputCurrent', 'pvInputVoltage',
  'pvBatteryVoltage',
  'batteryDischargeCurrent', // 16
  'flags', // 17
  'batteryVoltageOffset',
  'EEPRomVersion',
  'pvInputPower', // 20
]

module.exports = paramsArrayMap

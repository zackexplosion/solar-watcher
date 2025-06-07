const COLUMNS = [
  'timestamp',
  'gridVoltage', 'gridFrequency',
  'acOutputVoltage', 'acOutputFrequency',
  'acOutputApparentPower', 'acOutputActivePower',
  'acOutputLoad',
  'busVoltage', 'batteryVoltage',
  'batteryChargingCurrent', 'batteryCapacity',
  'heatSinkTemp',
  'pvInputCurrent', 'pvInputVoltage',
  'pvBatteryVoltage',
  'batteryDischargeCurrent',
  'flags',
  'batteryVoltageOffset',
  'EEPRomVersion',
  'pvInputPower',
]

function logHandler(data) {
  const log = {}

  COLUMNS.forEach((key, index) => {
    log[key] = data[index]
  })

  // detect power source from following params
  let powerSource = 'line'
  if (
    (
      log.pvInputPower > log.acOutputActivePower
      && log.pvInputPower - (log.batteryChargingCurrent * log.pvBatteryVoltage)
      > log.acOutputLoad
    )
    || log.batteryDischargeCurrent > 0
  ) {
    powerSource = 'battery'
  }

  log.powerSource = powerSource

  return log
}

module.exports = logHandler

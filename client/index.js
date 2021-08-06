// env
const ID = process.env.CLIENT_ID || 'YOLO'
const LOGGER_URL = process.env.CLIENT_LOGGER_URL || 'http://localhost:7788'
const SERIAL_PORT_PATH = process.env.CLIENT_SERIAL_PORT_PATH || 'COM1'

const request = require('axios')

// code from https://github.com/prajna-pranab/converse/blob/master/index.html
const Serialport = require('serialport')
// eslint-disable-next-line import/no-extraneous-dependencies
const Readline = require('@serialport/parser-readline');

const parser = new Readline({ delimiter: '\r' });

let port; // reference for opened coms port
let cmd; // last command that was sent

// calculate XModem CRC-16
const CRCXModem = (str) => {
  let crc = 0;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) { crc = (crc << 1) ^ 0x1021; } else crc <<= 1;
    }
  }
  // increment crc bytes containing lf, cr and '('
  crc &= 0xffff;
  let msb = crc >>> 8;
  let lsb = crc & 0xff;
  if ([0x0a, 0x0d, 0x28].includes(msb)) {
    msb++;
  }
  if ([0x0a, 0x0d, 0x28].includes(lsb)) {
    lsb++;
  }
  return Uint8Array.from([msb, lsb]);
}

// send command to controller
const sendQuery = (txt) => {
  // convert command, crc and \r to buffer
  const bytes = Buffer.concat([
    Buffer.from(txt, 'utf-8'),
    CRCXModem(txt),
    Uint8Array.from([0x0D]),
  ])

  // save the command so the reply parser knows what it is
  cmd = txt;
  // update window and log
  // document.querySelector('#sent').textContent = txt;
  // console.log('Tx:', bytes.toString('hex'), `(${txt})`);
  // send it
  port.write(bytes, (err) => {
    if (err) {
      console.error('Writing returned:', err.message);
    }
  })
}

async function sendData(data) {
  // prevent failed data
  if (data.length > 20) {
    const output = {
      id: ID,
      ...data.join(','),
    }

    console.log('sending data', output)
    try {
      await request.get(LOGGER_URL, {
        params: output,
      })
    } catch (error) {
      console.error(error)
    }
  }

  setTimeout(() => {
    sendQuery('QPIGS')
  }, 1000 * 1)
}

// parse data received from the controller
const parseQuery = (cmd, data) => {
  const queries = {
    QPI: () => {
      // (PI00
      if (data === '(NAK') return '<b>QPI (Protocol ID)</b><br />Not recognised'
      return `${'<b>QPI (Protocol ID)</b><br /> Protocol ID: '}${data.slice(1)}`
    },
    QID: () => {
      // (00000000000000
      if (data === '(NAK') return '<b>QID (Serial Number)</b><br />Not recognised'
      return `${'<b>QID (Serial number)</b><br />Serial No: '}${data.slice(1)}`
    },
    QVFW: () => {
      // (VERFW:00000.00
      if (data === '(NAK') return '<b>QVFW (Main CPU FW version)</b><br />Not recognised'
      const fields = data.split(/\.|\:/);
      return `${'<b>QVFW (Main CPU Firmware version)</b><br />'
				+ 'Version: '}${parseFloat(fields[1])}.${fields[2]}`;
    },
    QVFW2: () => {
      // (VERFW2:00000.00
      if (data === '(NAK') return '<b>QVFW2 (SCC1 CPU Firmware version)</b><br />Not recognised'
      const fields = data.split(/\.|\:/);
      return `${'<b>QVFW2 (SCC1 CPU Firmware version)</b><br />'
				+ 'Version: '}${parseFloat(fields[1])}.${fields[2]}`;
    },
    QVFW3: () => {
      // (VERFW3:00000.00
      if (data === '(NAK') return '<b>QVFW3 (SCC2 CPU Firmware version)</b><br />Not recognised'
      const fields = data.split(/\.|\:/);
      return `${'<b>QVFW3 (SCC2 CPU Firmware version)</b><br />'
				+ 'Version: '}${parseFloat(fields[1])}.${fields[2]}`;
    },
    QVFW4: () => {
      // (VERFW4:00000.00
      if (data === '(NAK') return '<b>QVFW4 (SCC3 CPU Firmware version)</b><br />Not recognised'
      const fields = data.split(/\.|\:/);
      return `${'<b>QVFW4 (SCC3 CPU Firmware version)</b><br />'
				+ 'Version: '}${parseFloat(fields[1])}.${fields[2]}`;
    },
    QPIRI: () => {
      // (000.0 00.0 000.0 00.0 00.0 0000 0000 00.0
      //	00.0 00.0 00.0 00.0 0 00 000 0 0 0 0 10 0 0 00.0 0 0
      // our inverter doesn't send last field!
      if (data == '(NAK') return '<b>QPIRI (Rating Information)</b><br />Not recognised'
      const batteryTypes = { 0: 'AGM', 1: 'FLA', 2: 'User Defined' };
      const voltageRanges = { 0: 'Appliance', 1: 'UPS' };
      const outputSources = { 0: 'Utility first', 1: 'Solar first', 2: 'SBU' };
      const chargerSources = {
        0: 'Utility first',
        1: 'Solar first',
        2: 'Solar + Utility',
        3: 'Solar only',
      };
      const deviceTypes = {
        '00': 'Grid tie',
        '01': 'Off grid',
        10: 'Hybrid',
        11: 'Off Grid, 2 trackers',
        20: 'Off grid, 3 trackers',
      };
      const topologies = { 0: 'transformerless', 1: 'transformer' }
      outputModes = {
        0: 'Single',
        1: 'Parallel',
        2: 'Phase 1',
        3: 'Phase 2',
        4: 'Phase 3',
      },
      pvStatuses = { 0: 'On one OK', 1: 'On all OK' },
      balances = { 0: 'PV max current', 1: 'PV max power' },
      fields = data.slice(1).split(' ');
      return `${'<b>QPIRI (Rating Information)</b><br />'
				+ 'Grid rating voltage: '}${parseFloat(fields[0])}V<br />`
				+ `Grid rating current: ${parseFloat(fields[1])}A<br />`
				+ `AC output rating voltage: ${parseFloat(fields[2])}V<br />`
				+ `AC output rating frequency: ${parseFloat(fields[3])}Hz<br />`
				+ `AC output rating current: ${parseFloat(fields[4])}A<br />`
				+ `AC output rating apparent power: ${parseFloat(fields[5])}VA<br />`
				+ `AC output rating active power: ${parseFloat(fields[6])}W<br />`
				+ `Battery rating voltage: ${parseFloat(fields[7])}V<br />`
				+ `Back-to-grid voltage: ${parseFloat(fields[8])}V<br />`
				+ `Low voltage disconnect: ${parseFloat(fields[9])}V<br />`
				+ `Bulk charge voltage: ${parseFloat(fields[10])}V<br />`
				+ `Float voltage: ${parseFloat(fields[11])}V<br />`
				+ `Battery Type: ${batteryTypes[fields[12]]}<br />`
				+ `Max AC charging current: ${parseFloat(fields[13])}A<br />`
				+ `Max DC charging current: ${parseFloat(fields[14])}A<br />`
				+ `AC Input voltage range: ${voltageRanges[fields[15]]}<br />`
				+ `Output source priority: ${outputSources[fields[16]]}<br />`
				+ `Charger source priority: ${chargerSources[fields[17]]}<br />`
				+ `Max in parallel: ${parseFloat(fields[18])}<br />`
				+ `Device type: ${deviceTypes[fields[19]]}<br />`
				+ `Topology: ${topologies[fields[20]]}<br />`
				+ `Output mode: ${outputModes[fields[21]]}<br />`
				+ `Battery re-discharge voltage: ${parseFloat(fields[22])}V<br />`
				+ `PV condition for parallel: ${pvStatuses[fields[23]]}<br />`
				+ `PV power balance: ${balances[fields[24]]}`;
    },
    QFLAG: () => {
      // (EaxyzDbjkuv
      if (data == '(NAK') return '<b>QFLAG (Flag status)</b><br />Not recognised'
      const flag = (letter) => {
        if (data.indexOf(letter) == -1) return 'Not supported<br />';
        return (data.indexOf(letter) < data.indexOf('D')
          ? 'Enabled<br />' : 'Disabled<br />');
      }
      return `${'<b>QFLAG (Flag status)</b><br />'
				+ 'Buzzer: '}${flag('a')
      }Overload bypass ${flag('b')
      }Power saving: ${flag('j')
      }LCD timeout: ${flag('k')
      }Overload restart: ${flag('u')
      }Over temp restart: ${flag('v')
      }Backlight: ${flag('x')
      }Source interrupt alarm: ${flag('y')
      }Record fault codes: ${flag('z')
      }Data log popup: ${flag('l')}`;
    },
    QPIGS: () => {
      // (000.0 00.0 000.0 00.0 0000 0000 000 000 00.00 000
      // 000 0000 0000 000.0 00.00 00000 10101010 00 00 00000 000
      if (data === '(NAK') return '<b>QPIGS (Inverter status)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      // const flags = fields[16];
      sendData({
        data: fields,
      })
      // sendData({
      //   a: parseFloat(fields[5]),
      //   b: parseFloat(fields[6]),
      //   c: parseFloat(fields[12]),
      //   d: parseFloat(fields[13]),
      //   e: parseFloat(fields[19]),
      //   f: parseFloat(fields[14]),
      //   g: parseFloat(fields[8]),
      //   h: parseFloat(fields[10]),
      //   i: parseFloat(fields[11]),
      //   j: parseFloat(fields[0]),
      //   k: parseFloat(fields[1]),
      //   l: parseFloat(fields[2]),
      //   m: parseFloat(fields[3]),
      //   n: parseFloat(fields[4]),
      //   flags: JSON.stringify(flags),
      // })
      // return `${'<b>QPIGS (Inverter status)</b><br />'
      // 	+ 'Grid voltage: '}${parseFloat(fields[0])}V<br />`
      // 	+ `Grid frequency: ${parseFloat(fields[1])}Hz<br />`
      // 	+ `AC output voltage: ${parseFloat(fields[2])}V<br />`
      // 	+ `AC output frequency: ${parseFloat(fields[3])}Hz<br />`
      // 	+ `AC output apparent power: ${parseFloat(fields[4])}VA<br />`
      // 	+ `AC output active power: ${parseFloat(fields[5])}W<br />`
      // 	+ `Output load: ${parseFloat(fields[6])}%<br />`
      // 	+ `Bus voltage: ${parseFloat(fields[7])}V<br />`
      // 	+ `Battery voltage: ${parseFloat(fields[8])}V<br />`
      // 	+ `Battery charging current: ${parseFloat(fields[9])}A<br />`
      // 	+ `Battery capacity: ${parseFloat(fields[10])}%<br />`
      // 	+ `Heatsink temp: ${parseFloat(fields[11])}&deg;C<br />`
      // 	+ `SCC1 Input current: ${parseFloat(fields[12])}A<br />`
      // 	+ `SCC1 Input voltage: ${parseFloat(fields[13])}V<br />`
      // 	+ `SCC1 Battery voltage: ${parseFloat(fields[14])}V<br />`
      // 	+ `Battery discharge current: ${parseFloat(fields[15])}A<br />`
      // 	+ 'Status: <br />&nbsp;&nbsp;'
      // 	+ `Add SBU priority: ${flags[0] == '1' ? 'Yes' : 'No'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `Config changed: ${flags[1] == '1' ? 'Yes' : 'No'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `SCC Firmware updated: ${flags[2] == '1' ? 'Yes' : 'No'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `Load status: ${flags[3] == '1' ? 'On' : 'Off'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `Steady voltage: ${flags[4] == '1' ? 'Yes' : 'No'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `Charging status: ${flags[5] == '1' ? 'On' : 'Off'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `SCC1 charging: ${flags[6] == '1' ? 'On' : 'Off'
      // 	}<br />&nbsp;&nbsp;`
      // 	+ `AC charging: ${flags[7] == '1' ? 'On' : 'Off'
      // 	}<br />`
      // 	+ `Battery voltage offset: ${
      // 	  parseFloat(fields[17])}mV<br />`
      // 	+ `EEprom version: ${
      // 	  fields[18]}<br />`
      // 	+ `PV1 Charging power: ${
      // 	  parseFloat(fields[19])}W`;
    },
    // QPGS0
    QPIGS2: () => {
      // (0000 000.0 00.00 00000 00000000 0000 0000 0000
      //	000.0 00.00 0000 00000
      if (data === '(NAK') return '<b>QPIGS2 (Inverter status 2)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      const flags = fields[4];
      return `${'<b>QPIGS2 (Inverter status 2)</b><br />'
				+ 'SCC2 input current: '}${parseFloat(fields[0])}A<br />`
				+ `SCC2 input voltage: ${parseFloat(fields[1])}V<br />`
				+ `SCC2 battery voltage: ${parseFloat(fields[2])}V<br />`
				+ `SCC2 charging power: ${parseFloat(fields[3])}W<br />`
				+ `SCC2 charging: ${
				  flags[0] === '1' ? 'Yes<br />' : 'No<br />'
				}SCC3 charging: ${
				  flags[1] === '1' ? 'Yes<br />' : 'No<br />'
				}AC charging current: ${parseFloat(fields[5])}A<br />`
				+ `AC charging power: ${parseFloat(fields[6])}W<br />`
				+ `SCC3 input current: ${parseFloat(fields[7])}A<br />`
				+ `SCC3 input voltage: ${parseFloat(fields[8])}V<br />`
				+ `SCC3 battery voltage: ${parseFloat(fields[9])}V<br />`
				+ `SCC3 charging power: ${parseFloat(fields[10])}W<br />`
				+ `Total PV charging power: ${parseFloat(fields[11])}W`;
    },
    QMOD: () => {
      if (data == '(NAK') return '<b>QMOD (Operating Mode)</b><br />Not recognised'
      const modes = {
        P: 'Power On',
        S: 'Standby',
        L: 'Line',
        B: 'Battery',
        Fault: 'Fault',
        H: 'Power Saving',
      };
      // (B
      return `${'<b>QMOD (Operating Mode)</b><br />Mode: '}${modes[data[1]]}`;
    },
    QPIWS: () => {
      /*
        Returns different values on protocol 3000
      */
      // (10101010101010101010101010101010101010
      if (data === '(NAK') return '<b>QPIWS (Warning Status)</b><br />Not recognised'
      const isSet = (pos) => data[pos] === '1'
      const chk = (str, pos, type) => {
        switch (type) {
          case 'none': return `<span class="noFault">${str}</span><br />`;
          case 'warn': return (isSet(pos)
            ? `<span class="warning">${str}</span><br />`
            : `<span class="noFault">${str}</span><br />`);
          case 'fault': return (isSet(pos)
            ? `<span class="fault">${str}</span><br />`
            : `<span class="noFault">${str}</span><br />`);
          case 'check': return (isSet(pos) && isSet(2)
            ? `<span class="fault">${str}</span><br />`
            : isSet(pos) ? `<span class="warning">${str}</span><br />`
              : `<span class="noFault">${str}</span><br />`);
        }
      }
      return `<b>QPIWS (Warning Status)</b><br />${
        chk('Reserved', 1, 'none')
      }${chk('Inverter fault', 2, 'fault')
      }${chk('Bus over voltage', 3, 'fault')
      }${chk('Bus under voltage', 4, 'fault')
      }${chk('Bus soft fail', 5, 'fault')
      }${chk('Line fail', 6, 'warn')
      }${chk('OPV short', 7, 'warn')
      }${chk('Inverter voltage too low', 8, 'fault')
      }${chk('Inverter voltage too high', 9, 'fault')
      }${chk('Over temperature', 10, 'check')
      }${chk('Fan locked', 11, 'check')
      }${chk('High battery voltage', 12, 'check')
      }${chk('Low battery', 13, 'warn')
      }${chk('Overcharge', 14, 'warn')
      }${chk('Battery under shutdown', 15, 'warn')
      }${chk('Battery derating', 16, 'warn')
      }${chk('Overload', 17, 'check')
      }${chk('Eeprom fault', 18, 'warn')
      }${chk('Inverter over current', 19, 'fault')
      }${chk('Inverter soft fail', 20, 'fault')
      }${chk('Self test fail', 21, 'fault')
      }${chk('OP DC voltage over', 22, 'fault')
      }${chk('Battery disconnected', 23, 'fault')
      }${chk('Current sensor fail', 24, 'fault')
      }${chk('Battery short', 25, 'fault')
      }${chk('Power limit', 26, 'warn')
      }${chk('SCC1 High PV voltage', 27, 'warn')
      }${chk('SCC1 MPPT overload fault', 28, 'warn')
      }${chk('SCC1 MPPT overload warning', 29, 'warn')
      }${chk('SCC1 Battery too low to charge', 30, 'warn')
      }${chk('SCC2 High PV voltage', 31, 'warn')
      }${chk('SCC2 MPPT overload fault', 32, 'warn')
      }${chk('SCC2 MPPT overload warning', 33, 'warn')
      }${chk('SCC2 Battery too low to charge', 34, 'warn')
      }${chk('SCC3 High PV voltage', 35, 'warn')
      }${chk('SCC3 MPPT overload fault', 36, 'warn')
      }${chk('SCC3 MPPT overload warning', 37, 'warn')
      }${chk('SCC3 Battery too low to charge', 38, 'warn')}`;
    },
    QDI: () => {
      if (data === '(NAK') return '<b>QDI (Default setting values)</b><br />Not recognised'
      const modes = {
        0: 'Solo',
        1: 'Parallel',
        2: 'Phase 1',
        3: 'Phase 2',
        4: 'Phase 2',
      };
      const pvStatuses = { 0: 'On one OK', 1: 'On all OK' };
      const balances = { 0: 'PV max current', 1: 'PV max power' };
      const stages = { 0: 'Auto', 1: '2 stage', 2: '3 stage' };
      // (000.0 00.0 0000 00.0 00.0 00.0 00.0 00 0 0
      //	0 0 0 0 0 0 1 1 0 0 1 0 00.0 0 0 1 1 000 000
      const fields = data.slice(1).split(' ');
      return `${'<b>QDI (Default setting values)</b><br />'
				+ 'AC output voltage: '}${parseFloat(fields[0])}V<br />`
				+ `AC output frequency: ${parseFloat(fields[1])}Hz<br />`
				+ `Max AC charging current: ${parseFloat(fields[2])}A<br />`
				+ `Low voltage disconnect: ${parseFloat(fields[3])}V<br />`
				+ `Float voltage: ${parseFloat(fields[4])}V<br />`
				+ `Bulk voltage: ${parseFloat(fields[5])}V<br />`
				+ `Back-to-grid voltage: ${parseFloat(fields[6])}V<br />`
				+ `Max DC charging current: ${parseFloat(fields[7])}A<br />`
				+ `AC Input voltage range: ${
				  fields[8] == '0' ? 'Appliance<br />' : 'UPS<br />'
				}Output source priority: ${
				  fields[9] == '0' ? 'Utility first<br />' : 'Solar first<br />'
				}Charger source priority: ${
				  fields[10] == '0' ? 'Utility first<br />' : 'Solar first<br />'
				}Battery type: ${
				  fields[11] == '0' ? 'AGM<br />' : 'FLA<br />'
				}Buzzer: ${
				  fields[12] == '0' ? 'Enabled<br />' : 'Disabled<br />'
				}Power saving: ${
				  fields[13] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Overload restart: ${
				  fields[14] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Over temp restart: ${
				  fields[15] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}LCD backlight: ${
				  fields[16] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Primary source interrupt alarm: ${
				  fields[17] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Fault code record: ${
				  fields[18] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Overload bypass: ${
				  fields[19] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}LCD timeout: ${
				  fields[20] == '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Output mode: ${modes[fields[21]]}<br />`
				+ `Battery re-discharge voltage: ${parseFloat(fields[22])}V<br />`
				+ `PV condition for parallel: ${pvStatuses[fields[23]]}<br />`
				+ `PV power balance: ${balances[fields[24]]}<br />`
				+ `Charging stages: ${stages[fields[25]]}<br />`
				+ `Data log popup: ${
				  fields[26] === '0' ? 'Disabled<br />' : 'Enabled<br />'
				}Max Solar charging current: ${parseFloat(fields[27])}A<br />`
				+ `CV Charging time: ${parseFloat(fields[28])}mins`;
    },
    QBEQI: () => {
      // (1 000 000 000 000 00.00 000 000
      if (data === '(NAK') return '<b>QBEQI (Equalisation status)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      return `${'<b>QBEQI (Equalisation status)</b><br />'
				+ 'Battery equalized: '}${fields[0] === '1' ? 'Yes' : 'No'}<br />`
				+ `Equalize time: ${parseFloat(fields[1])}mins<br />`
				+ `Equalize Interval: ${parseFloat(fields[2])}days<br />`
				+ `Max current: ${parseFloat(fields[3])}A<br />`
				+ `Next equalize: ${parseFloat(fields[4])}days<br />`
				+ `Equalized voltage: ${parseFloat(fields[5])}V<br />`
				+ `Absorb time: ${parseFloat(fields[6])}mins<br />`
				+ `Equalize timeout: ${parseFloat(fields[7])}mins`;
    },
    QMCHGCR: () => {
      // (000 000 000 000
      if (data === '(NAK') return '<b>QMCHGCR (Max charging current settings)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      let details = '<b>QMCHGCR (Max charging current settings)</b><br />';
      for (const fld of fields) { details += `${parseFloat(fld)}A<br />`; }
      return details;
    },
    QMUCHGCR: () => {
      // (000 000 000 000 000 000
      if (data === '(NAK') return '<b>QMUCHGCR (Max utility charging current settings)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      let details = '<b>QMUCHGCR (Max utility charging current settings)</b><br />';
      for (const fld of fields) { details += `${parseFloat(fld)}A<br />`; }
      return details;
    },
    QMSCHGCR: () => {
      // (000 000 000 000 000 000
      if (data === '(NAK') return '<b>QMSCHGCR (Max solar charging current settings)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      let details = '<b>QMUCHGCR (Max solar charging current settings)</b><br />';
      for (const fld of fields) { details += `${parseFloat(fld)}A<br />`; }
      return details;
    },
    QBOOT: () => {
      // (1
      if (data === '(NAK') return '<b>QBOOT (DSP has bootstrap?)</b><br />Not recognised'
      return `${'<b>QBOOT (DSP has bootstrap?)</b><br />Has bootstrap: '}${data.slice(1) === '1' ? 'Yes' : 'No'}`;
    },
    QOPM: () => {
      // (00
      if (data === '(NAK') return '<b>QOPM (Output mode)</b><br />Not recognised'
      const modes = {
        '00': 'Solo',
        '01': 'Parallel',
        '02': 'Phase 1',
        '03': 'Phase 2',
        '04': 'Phase 3',
      };
      return `${'<b>QOPM (Output mode)</b><br />Mode: '}${modes[data.slice(1)]}`;
    },
    QCST: () => {
      // (00
      if (data === '(NAK') return '<b>QCST (Charging stage enquiry)</b><br />Not recognised'
      const modes = { '00': 'Auto', '01': '2 Stage', '02': '3 Stage' };
      return `${'<b>QCST (Charging stage enquiry)</b><br />Stages: '}${modes[data.slice(1)]}`;
    },
    QCVT: () => {
      // (000
      if (data === '(NAK') return '<b>QCVT (Charging time in CV mode)</b><br />Not recognised'
      const details = data.slice(1);
      return `${'<b>QCVT (Charging time in CV mode)</b><br />Time: '}${details === '255' ? 'Auto' : `${parseFloat(details)}mins`}`
    },
    QBV: () => {
      // (000
      if (data === '(NAK') return '<b>QBV (SoC compensated voltage?)</b><br />Not recognised'
      // const details = data.slice(1);
      return '<b>QBV (SoC compensated voltage?)</b><br />Not yet supported'
    },
    Q1: () => {
      // (0000 00000 00 00 00 000 000 000 000 00 00 000 0000 0000 0000 00.00 10
      if (data === '(NAK') return '<b>Q1 (Undocumented)</b><br />Not recognised'
      const statuses = {
        10: 'Not charging',
        11: 'Bulk mode',
        12: 'Absorb mode',
        13: 'Float mode',
      };
      const fields = data.slice(1).split(' ');
      const flags = fields[2];
      return `${'<b>Q1 (Undocumented)</b><br />'
				+ 'Absorb (CV) time: '}${parseFloat(fields[0])}sec<br />`
				+ `Float time: ${parseFloat(fields[1])}sec<br />`
				+ `SCC ok: ${fields[2] == '01' ? 'OK<br />' : 'Not OK<br />'
				}Allow SCC on: ${fields[3] == '01' ? 'Yes<br />' : 'No<br />'
				}Average charge current: ${parseFloat(fields[4])}A<br />`
				+ `SCC PWM temperature: ${parseFloat(fields[5])}&deg;C<br />`
				+ `Battery temperature: ${parseFloat(fields[6])}&deg;C<br />`
				+ `Transformer temperature: ${parseFloat(fields[7])}&deg;C<br />`
				+ `GPADAT (GPIO13) bit: ${fields[8]}<br />`
				+ `Fan lock status: ${fields[9] == '01' ? 'Locked<br />' : 'Not Locked<br />'
				}Fan PWM duty: ${parseFloat(fields[10])}<br />`
				+ `Fan speed: ${parseFloat(fields[11])}%<br />`
				+ `SCC charge power: ${parseFloat(fields[12])}W<br />`
				+ `Parallel warning: ${fields[13]}<br />`
				+ `AC sync frequency: ${parseFloat(fields[14])}Hz<br />`
				+ `Inverter charge status:${statuses[fields[15]]}`;
    },
    QGS: () => {
      // (0000
      if (data == '(NAK') return '<b>QGS (Undocumented)</b><br />Not recognised'
      const statuses = {
        10: 'Not charging',
        11: 'Bulk mode',
        12: 'Absorb mode',
      };
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QGS (Undocumented)</b><br />Not yet implemented'
    },
    QSID: () => {
      // (1492931811100046005535
      if (data === '(NAK') return '<b>QSID (Undocumented: serial no?)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QSID (Undocumented: serial no?)</b><br />Not yet implemented'
    },
    QID2: () => {
      // (0000
      if (data === '(NAK') return '<b>QID2 (Undocumented: id?)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QID2 (Undocumented: id?)</b><br />Not yet implemented'
    },
    QDM: () => {
      // (0000
      if (data === '(NAK') return '<b>QDM (Undocumented: device model?)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QDM (Undocumented: device model?)</b><br />Not yet implemented'
    },
    QCHT: () => {
      // (0000
      if (data === '(NAK') return '<b>QCHT (Undocumented: CHT support?)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QCHT (Undocumented: CHT support?)</b><br />Not yet implemented'
    },
    QPPS: () => {
      // (0000
      if (data === '(NAK') return '<b>QPPS (Undocumented: QPPS support?)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QPPS (Undocumented: QPPS support?)</b><br />Not yet implemented'
    },
    QCHGS: () => {
      if (data === '(NAK') return '<b>QCHGS (Undocumented: CHGS id?)</b><br />Not recognised'
      // (0000
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QCHGS (Undocumented: CHGS id?)</b><br />Not yet implemented'
    },
    QMD: () => {
      // (0000
      if (data === '(NAK') return '<b>QMD (Undocumented)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QMD (Undocumented)</b><br />Not yet implemented'
    },
    QVFTR: () => {
      // (0000
      if (data === '(NAK') return '<b>QVFTR (Undocumented)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QVFTR (Undocumented)</b><br />Not yet implemented'
    },
    QPIHF: () => {
      // (0000
      if (data === '(NAK') return '<b>QPIHF (Undocumented)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QPIHF (Undocumented)</b><br />Not yet implemented'
    },
    QPICF: () => {
      // (0000
      if (data === '(NAK') return '<b>QPICF (Undocumented)</b><br />Not recognised'
      // const fields = data.slice(1).split(' ');
      // const flags = fields[2];
      return '<b>QPICF (Undocumented)</b><br />Not yet implemented'
    },
    QFS: () => {
      /*
        from posting by Coulomb
        http://forums.aeva.asn.au/viewtopic.php?f=64&t=4332&start=2200#p71161
      */

      // (00 00 00 0000 0000 0000 000.0 00.00 000.0
      //  00.00 000.0 000.0 00.0 000 000
      if (data === '(NAK') return '<b>QFS Fault query?</b><br />Not recognised'
      const modes = {
        '00': 'Power On',
        '01': 'Standby',
        '02': 'Power Saving',
        '03': 'Battery',
        '04': 'Line',
        '05': 'Bypass',
        '06': 'Fault',
        '07': 'Shutdown',
      }
      const fields = data.slice(1).split(' ');
      const flags = fields[2];
      const status = () => {
        let result = '';
        const flags = parseFloat(fields[14]);
        if (flags && 4) result += '&nbsp;&nbsp;Load on<br />'
        else result += '&nbsp;&nbsp;Load off<br />';
        if (flags && 8) result += '&nbsp;&nbsp;Inverter relay on<br />'
        else result += '&nbsp;&nbsp;Inverter relay off<br />';
        if (flags && 32) result += '&nbsp;&nbsp;Battery mode<br />';
        if (flags && 64) result += '&nbsp;&nbsp;Line mode<br />';
        if (flags && 128) result += '&nbsp;&nbsp;AC relay on<br />'
        else result += '&nbsp;&nbsp;AC relay off<br />';
        return result;
      }
      return `${'<b>QFS Fault query?</b><br />'
				+ 'Fault record status: '}${
        fields[0] === '01' ? 'Recording' : 'Not recording'
      }<br/ >`
				+ `Fault code: ${fields[1]}<br />`
				+ `Inverter mode: ${modes[fields[2]]}<br />`
				+ `Apparent load: ${fields[3]}VA<br />`
				+ `True load: ${fields[4]}W<br />`
				+ `Inverter load: ${fields[5]}W<br />`
				+ `Line voltage: ${fields[6]}V<br />`
				+ `Line frequency: ${fields[7]}Hz<br />`
				+ `Output voltage: ${fields[8]}V<br />`
				+ `Output frequency: ${fields[9]}Hz<br />`
				+ `Output current: ${fields[10]}A<br />`
				+ `Bus voltage: ${fields[11]}V<br />`
				+ `Battery voltage: ${fields[12]}V<br />`
				+ `System max temp: ${fields[13]}&deg;C<br />`
				+ `Status:<br />${status()}`;
    },
    QFAULT: () => {
      /*
			 from posting by Coulomb
			 http://forums.aeva.asn.au/viewtopic.php?f=64&t=4332&start=2200#p71161
			*/
      // (00 00 0000 0000 0000 000.0 000.0 00.00 000.0 000.0
      if (data === '(NAK') return '<b>QFAULT Fault query?</b><br />Not recognised'
      const modes = {
        '00': 'Power On',
        '01': 'Standby',
        '02': 'Power Saving',
        '03': 'Battery',
        '04': 'Line',
        '05': 'Bypass',
        '06': 'Fault',
        '07': 'Shutdown',
      };
      const fields = data.slice(1).split(' ');
      const flags = fields[2];
      return `${'<b>QFS Fault query?</b><br />'
				+ 'Fault code: '}${fields[0]}<br />`
				+ `Inverter mode: ${modes[fields[1]]}<br />`
				+ `Apparent load: ${fields[2]}VA<br />`
				+ `True load: ${fields[3]}W<br />`
				+ `Inverter load: ${fields[4]}W<br />`
				+ `Bus voltage: ${fields[5]}V<br />`
				+ `Line voltage: ${fields[6]}V<br />`
				+ `Line frequency: ${fields[7]}Hz<br />`
				+ `Output voltage: ${fields[8]}V<br />`
				+ `Output current: ${fields[9]}A`;
    },
    QSVFW2: () => {
      // (0000
      if (data == '(NAK') return '<b>QSVFW2 (Undocumented)</b><br />Not recognised'
      const fields = data.slice(1).split(' ');
      const flags = fields[2];
      return '<b>QSVFW2 (Undocumented)</b><br />'
				+ 'Not yet implemented';
    },
  }
  // check it is a query command we recognise
  if (queries.hasOwnProperty(cmd))
  // console.log()
  { queries[cmd]() }
  // document.querySelector('#parsed').innerHTML = queries[cmd]();
}

const getBuff = (str) => Buffer.concat([
  Buffer.from(str),
  CRCXModem(str),
  Uint8Array.from([0x0D]),
])
// simulate port.write() and parser.on('data') events for testing
fakePort = {
  write: (buff, err) => {
    // (mostly) real data returned from Conversol 5K III (except s/n)
    switch (cmd) {
      case 'QPI': rxData(getBuff('(PI30')); break;
      case 'QID': rxData(getBuff('(92931811100000')); break;
      case 'QVFW': rxData(getBuff('(VERFW:00020.65')); break;
      case 'QVFW2': rxData(getBuff('(NAK')); break;
      case 'QVFW3': rxData(getBuff('(VERFW:00001.21')); break;
      case 'QVFW4': rxData(getBuff('(NAK')); break;
      case 'QPIRI': rxData(getBuff('(230.0 21.7 230.0 50.0 21.7 5000 5000 48.0 49.0 43.0 58.4 54.0 1 20 040 0 2 1 1 01 0 0 54.0 0')); break;
      case 'QFLAG': rxData(getBuff('(EaxyzDbjkuv')); break;
      case 'QPIGS': rxData(getBuff('(000.0 00.0 229.8 50.0 0137 0022 002 428 54.00 000 100 0035 00.0 305.6 00.00 00001 00010000 00 00 00000 010')); break;
      case 'QPIGS2': rxData(getBuff('(NAK')); break;
      case 'QMOD': rxData(getBuff('(B')); break;
      case 'QPIWS': rxData(getBuff('(000001000000000000000000000000000000')); break;
      case 'QDI': rxData(getBuff('(230.0 50.0 0030 42.0 54.0 56.4 46.0 60 0 0 2 0 0 0 0 0 1 1 1 0 1 0 54.0 0 1')); break;
      case 'QBEQI': rxData(getBuff('(0 060 030 040 030 58.40 000 120 0 0000')); break;
      case 'QMCHGCR': rxData(getBuff('(010 020 030 040 050 060 070 080')); break;
      case 'QMUCHGCR': rxData(getBuff('(002 010 020 030 040 050 060')); break;
      case 'QMSCHGCR': rxData(getBuff('(NAK')); break;
      case 'QBOOT': rxData(getBuff('(NAK')); break;
      case 'QOPM': rxData(getBuff('(NAK')); break;
      case 'QCST': rxData(getBuff('(NAK')); break;
      case 'QCVT': rxData(getBuff('(NAK')); break;
      case 'QBV': rxData(getBuff('(NAK')); break;
      case 'Q1': rxData(getBuff('(01 00 00 000 035 027 031 00 00 000 0030 0000 13')); break;
      case 'QGS': rxData(getBuff('(NAK')); break;
      case 'QSID': rxData(getBuff('(1492931811100046005535')); break;
      case 'QID2': rxData(getBuff('(NAK')); break;
      case 'QDM': rxData(getBuff('(NAK')); break;
      case 'QGM': rxData(getBuff('(NAK')); break;
      case 'QCHT': rxData(getBuff('(NAK')); break;
      case 'QPPS': rxData(getBuff('(NAK')); break;
      case 'QCHGS': rxData(getBuff('(NAK')); break;
      case 'QMD': rxData(getBuff('(NAK')); break;
      case 'QVFTR': rxData(getBuff('(NAK')); break;
      case 'QPIHF': rxData(getBuff('(NAK')); break;
      case 'QPICF': rxData(getBuff('(NAK')); break;
      case 'QFS': rxData(getBuff('(NAK')); break;
      case 'QFAULT': rxData(getBuff('(NAK')); break;
      case 'QSVFW2': rxData(getBuff('(NAK')); break;
      default: parseQuery(cmd, '');
    }
  },
}

// recieve data responses either from inverter or fakePort
const rxData = (data) => {
  // response = body + crc + /r
  const crc = data.slice(-3, -1);
  const body = data.slice(0, -3).toString();
  const crcTxt = crc.toString('hex');
  const chk = CRCXModem(body);
  // check crc
  // comsError.textContent = (chk[0] & crc[0] && chk[1] & crc[1]) ? '' : 'CRC error!';
  // update window and log with results
  // document.querySelector('#recv').textContent = body;
  // console.log('Rx:', body, `(${crcTxt})`);
  parseQuery(cmd, body);
}

/// ////////////////////////////// main /////////////////////

// set up serial connection
Serialport.list().then((ports) => {
  console.log('ports', ports)
  const port_connect_to = SERIAL_PORT_PATH || ports[0]
  console.log('port_connect_to', port_connect_to)
  port = new Serialport(port_connect_to, {
    baudRate: 2400,
  })

  // set up parser to read whole lines
  port.pipe(parser)

  // handle open port errors
  port.on('error', (err) => {
    console.error('Opening port returned:', err.message);
  })

  // handle coms responses
  port.on('open', () => {
    parser.on('data', (data) => { rxData(data) })

    try {
      sendQuery('QPIGS')
    } catch (error) {
      // do nothing , just waiting for next loop
      console.error(error)
    }
  })
})
  .catch((err) => {
    console.error('Listing ports returned:', err.message);
  })

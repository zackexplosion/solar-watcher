const __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(((resolve) => { resolve(value); })); }
  return new (P || (P = Promise))(((resolve, reject) => {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  }));
};
const __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
};
Object.defineProperty(exports, '__esModule', { value: true });
// env setup
// main server
const http_1 = __importDefault(require('http'));
const express_1 = __importDefault(require('express'));
const dayjs_1 = __importDefault(require('dayjs'));
const timezone_js_1 = __importDefault(require('dayjs/plugin/timezone.js'));
const socket_io_1 = require('socket.io');
// for log reader
const child_process_1 = require('child_process');
const nodejs_tail_1 = __importDefault(require('nodejs-tail'));
const db_1 = __importDefault(require('./db'));
const parseLog_1 = __importDefault(require('./parseLog'));

const LOG_PATH = process.env.SERVER_LOG_PATH || './test.log';
const PORT = process.env.PORT || 7777;
const MAX_CACHE_POINTS = process.env.MAX_CACHE_POINTS || 900;
const LIVE_CHART_LOADED_DAYS = 3;
dayjs_1.default.extend(timezone_js_1.default);
dayjs_1.default.tz.setDefault('Asia/Taipei');
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {});
const cacheData = [];
// const cacheData = []
function setupLogReader() {
  // to use Tail again cuz nginx parse cant not just read the last line
  const tail = new nodejs_tail_1.default(LOG_PATH);
  tail.on('line', (line) => __awaiter(this, void 0, void 0, function* () {
    try {
      const data = (0, parseLog_1.default)(line);
      if (!data) { return; }
      io.emit('updateLiveChart', data);
    } catch (error) {
      console.error(error);
    }
  }));
  tail.on('close', () => {
    console.log('watching stopped');
  });
  tail.watch();
}
// main
io.on('connection', (socket) => {
  console.log('a user connected', socket.id, new Date());
  socket.on('getChartData', () => __awaiter(void 0, void 0, void 0, function* () {
    // prevent cache
    db_1.default.read();
    // const logs = db.get('logs').value()
    const now = (0, dayjs_1.default)().startOf('d');
    const start = now.subtract(LIVE_CHART_LOADED_DAYS, 'd');
    yield db_1.default.read();
    const logs = db_1.default.data.logs.filter((_) => (0, dayjs_1.default)(_[0]).diff(start, 'm') >= 0);
    console.log('logs read', logs.length);
    if (logs.length > 0) {
      socket.emit('setChartData', logs);
    }
  }));
  // socket.on('getLiveChartData', () => {
  //   socket.emit('setLiveChartData', cacheData)
  // })
});
// only cache last 15min
(0, child_process_1.exec)(`tail -n ${MAX_CACHE_POINTS} ${LOG_PATH}`, { maxBuffer: 1024 * 50000 }, (error, stdout, stderr) => __awaiter(void 0, void 0, void 0, function* () {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  const cacheLogs = stdout.split('\n');
  // console.log(cacheLogs)
  // const promises = []
  for (let index = cacheLogs.length - 1; index >= 0; index -= 1) {
    const line = cacheLogs[index];
    const data = (0, parseLog_1.default)(line);
    if (data) {
      cacheData.push(data);
    }
  }
  cacheData.reverse();
  setupLogReader();
  // console.log('cacheData', cacheData)
  server.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
  function getRandom(n1, seed) {
    const _seed = seed || 1;
    let r = Number.parseFloat(((Math.random() * _seed) + 1).toFixed(2));
    r += n1;
    return Number.parseFloat(r.toFixed(2));
  }
  if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
      const data = [
        new Date().getTime(),
        getRandom(224.7, 1),
        60,
        getRandom(224.7, 1),
        60,
        getRandom(1078, 100),
        getRandom(958, 100),
        21,
        getRandom(374, 1),
        getRandom(49.2, 1),
        getRandom(1, 10),
        getRandom(40, 10),
        getRandom(38, 10),
        getRandom(0, 10),
        getRandom(0, 10),
        getRandom(0, 10),
        getRandom(0, 10),
        '00010101',
        0,
        0,
        getRandom(1000, 10),
      ];
      if (cacheData.length >= MAX_CACHE_POINTS) {
        cacheData.shift();
      }
      cacheData.push(data);
      io.emit('updateLiveChart', data);
    }, 1000);
  }
}));
const latest_date = 0;
// setInterval(() => {
//   reduceLogAndSaveToDB()
//   try {
//   // prevent cache
//     db.read()
//     const log = db.get('logs').last().value()
//     if (log && latest_date !== log[0]) {
//       io.emit('appendDataToChart', log)
//       latest_date = log[0]
//     }
//   } catch (error) {
//     console.error(error)
//   }
// }, 1000 * 60 * 5.1)

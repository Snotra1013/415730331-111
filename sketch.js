'use strict'; // 啟用嚴格模式，減少隱性錯誤

// ===== 取得畫面上會用到的元素 =====
const stageEl = document.getElementById('stage'); // 全螢幕畫布（用來切換日夜配色）
const menuEl = document.getElementById('menu'); // 主選單區塊
const gameEl = document.getElementById('game'); // 遊戲區塊
const areaEl = document.getElementById('level-area'); // 關卡內容區
const hudTitle = document.getElementById('hud-title'); // 上方標題
const hudHint = document.getElementById('hud-hint'); // 上方提示
const backBtn = document.getElementById('btn-back'); // 返回按鈕
const modalEl = document.getElementById('modal'); // 小視窗遮罩
const modalTitle = document.getElementById('modal-title'); // 小視窗標題
const modalBody = document.getElementById('modal-body'); // 小視窗內文
const modalActions = document.getElementById('modal-actions'); // 小視窗按鈕區

// ===== 計時器管理：切換關卡時一次清掉，避免殘留 =====
let timers = []; // 存放所有計時器編號

function later(fn, ms) { // 登記一個延遲執行的計時器
  const id = setTimeout(fn, ms); // 建立計時器
  timers.push(id); // 記錄編號
  return id; // 回傳編號
} // later 結束

function every(fn, ms) { // 登記一個重複執行的計時器
  const id = setInterval(fn, ms); // 建立重複計時器
  timers.push(id); // 記錄編號
  return id; // 回傳編號
} // every 結束

let cleanups = []; // 離開關卡時要執行的清理工作（例如關閉聲音）

function onCleanup(fn) { // 登記一個清理工作
  cleanups.push(fn); // 記錄下來
} // onCleanup 結束

function clearAllTimers() { // 清除全部計時器，並執行清理工作
  timers.forEach(function (id) { // 逐一處理
    clearTimeout(id); // 清除延遲計時器
    clearInterval(id); // 清除重複計時器
  }); // 迴圈結束
  timers = []; // 清空紀錄
  const list = cleanups; // 取出清理工作清單
  cleanups = []; // 清空清單
  list.forEach(function (fn) { try { fn(); } catch (e) { /* 清理失敗不影響其他流程 */ } }); // 逐一執行清理工作
} // clearAllTimers 結束

// ===== 小工具 =====
function shuffle(arr) { // 洗牌（Fisher-Yates）
  for (let i = arr.length - 1; i > 0; i--) { // 由後往前
    const j = Math.floor(Math.random() * (i + 1)); // 隨機挑一個位置
    [arr[i], arr[j]] = [arr[j], arr[i]]; // 交換兩個元素
  } // 迴圈結束
  return arr; // 回傳洗好的陣列
} // shuffle 結束

function rand(min, max) { // 取得範圍內的隨機數
  return min + Math.random() * (max - min); // 回傳隨機值
} // rand 結束

function el(tag, className, text) { // 快速建立元素
  const node = document.createElement(tag); // 建立元素
  if (className) node.className = className; // 有給類別就設定
  if (text !== undefined) node.textContent = text; // 有給文字就設定
  return node; // 回傳元素
} // el 結束

// ===== 小視窗 =====
function showModal(title, html, actions) { // 顯示小視窗
  modalTitle.textContent = title; // 設定標題
  modalBody.innerHTML = html; // 設定內文（可含 HTML）
  modalActions.innerHTML = ''; // 清空舊按鈕
  actions.forEach(function (a) { // 逐一建立按鈕
    const b = el('button', 'btn' + (a.ghost ? ' ghost' : ''), a.text); // 建立按鈕
    b.addEventListener('click', a.fn); // 綁定點擊事件
    modalActions.appendChild(b); // 放進按鈕區
  }); // 迴圈結束
  modalEl.classList.remove('hidden'); // 顯示遮罩
} // showModal 結束

function closeModal() { // 關閉小視窗
  modalEl.classList.add('hidden'); // 隱藏遮罩
} // closeModal 結束

// 求助資源（台灣）
const HELP_HTML = '<div class="help">若你或身邊的人正感到痛苦，可以撥打：<br>' + // 求助資源說明
  '安心專線 1925（24 小時）<br>' + // 安心專線
  '生命線 1995<br>' + // 生命線
  '張老師 1980</div>'; // 張老師

// ===== 第一關：控制不住的胡思亂想 =====
const THOUGHTS = [ // 會湧上來的念頭（每一句都不同，用完才會重複）
  '我在做什麼', // 念頭 1
  '我做這些有甚麼意義', // 念頭 2
  '好空虛', // 念頭 3
  '我是不是很沒用', // 念頭 4
  '為什麼我什麼都做不好', // 念頭 5
  '好累', // 念頭 6
  '一切都沒有意義', // 念頭 7
  '我只會拖累別人', // 念頭 8
  '為什麼是我', // 念頭 9
  '我不夠好', // 念頭 10
  '沒有人會懂', // 念頭 11
  '提不起勁', // 念頭 12
  '再努力也沒有用', // 念頭 13
  '我是不是被討厭了', // 念頭 14
  '別人都過得比我好', // 念頭 15
  '我怎麼又搞砸了', // 念頭 16
  '明天也會一樣吧', // 念頭 17
  '真的好煩', // 念頭 18
  '我到底在期待什麼', // 念頭 19
  '都是我的錯', // 念頭 20
  '為什麼停不下來', // 念頭 21
  '我好像不屬於這裡', // 念頭 22
  '什麼都不想做', // 念頭 23
  '我是不是很麻煩', // 念頭 24
  '沒有人需要我', // 念頭 25
  '算了', // 念頭 26
  '好想消失一下', // 念頭 27
  '我撐不住了', // 念頭 28
  '為什麼大家都那麼輕鬆', // 念頭 29
  '我什麼都感覺不到', // 念頭 30
  '這樣的我有什麼價值', // 念頭 31
  '一直在原地打轉', // 念頭 32
  '要是當初不一樣就好了', // 念頭 33
  '我真的很糟', // 念頭 34
  '誰來救救我', // 念頭 35
  '好孤單' // 念頭 36
]; // 陣列結束

const BLOB_COLORS = [ // 念頭塊的配色：[背景色, 文字色]，都是偏暗的灰調，但各有一點色偏
  ['#232932', '#9AA5B3'], // 深灰藍
  ['#2A313B', '#B3BCC8'], // 稍亮的灰藍
  ['#1A1F27', '#7F8A99'], // 近黑的藍灰
  ['#33293A', '#B8A9C4'], // 灰紫
  ['#2B3A3F', '#9FB8BA'], // 灰青
  ['#3A3030', '#C4A9A9'], // 灰褐紅
  ['#161A20', '#6F7A88'], // 最深的墨色
  ['#3A3A44', '#CFCFD8'] // 偏亮的灰
]; // 配色結束

function blobShape() { // 產生不規則的多邊形輪廓（clip-path 用）
  const n = 9 + Math.floor(Math.random() * 5); // 頂點數：9 到 13 個
  const pts = []; // 存放所有頂點
  for (let i = 0; i < n; i++) { // 繞一圈產生頂點
    const a = (Math.PI * 2 * i) / n + rand(-0.15, 0.15); // 角度，加一點隨機偏移
    const r = rand(0.68, 1); // 半徑比例，隨機讓邊緣忽內忽外
    const x = 50 + 50 * r * Math.cos(a); // 頂點 X（百分比）
    const y = 50 + 50 * r * Math.sin(a); // 頂點 Y（百分比）
    pts.push(x.toFixed(1) + '% ' + y.toFixed(1) + '%'); // 轉成 CSS 座標字串
  } // 迴圈結束
  return 'polygon(' + pts.join(',') + ')'; // 組成 polygon 語法
} // blobShape 結束

function level1(area, done) { // 第一關主函式，done 為過關時呼叫的函式
  const problems = [ // 題目清單
    { q: '3 + 4', a: 7 }, // 第一題
    { q: '9 - 5', a: 4 }, // 第二題
    { q: '2 × 6', a: 12 }, // 第三題
    { q: '8 + 6', a: 14 }, // 第四題
    { q: '15 - 7', a: 8 }, // 第五題
    { q: '3 × 5', a: 15 } // 第六題
  ]; // 題目結束
  const distractors = [5, 9, 11]; // 干擾用的錯誤答案
  area.innerHTML = ''; // 清空畫布

  const board = el('div', 'l1-board'); // 題目區
  problems.forEach(function (p) { // 逐題建立卡片
    const card = el('div', 'problem'); // 題目卡片
    card.appendChild(el('span', '', p.q + ' =')); // 放入算式
    const slot = el('div', 'slot'); // 答案空格
    slot.dataset.answer = String(p.a); // 記錄正確答案
    card.appendChild(slot); // 空格放進卡片
    board.appendChild(card); // 卡片放進題目區
  }); // 迴圈結束
  area.appendChild(board); // 題目區放進畫布

  const tray = el('div', 'tray'); // 答案列
  const values = shuffle(problems.map(function (p) { return p.a; }).concat(distractors)); // 合併並打亂答案
  values.forEach(function (v) { // 逐一建立答案方塊
    const tile = el('div', 'tile', String(v)); // 答案方塊
    tile.dataset.value = String(v); // 記錄數值
    bindDrag(tile); // 綁定拖曳行為
    tray.appendChild(tile); // 放進答案列
  }); // 迴圈結束
  area.appendChild(tray); // 答案列放進畫布

  let solved = 0; // 已答對題數
  let started = false; // 念頭是否已開始湧現

  function bindDrag(tile) { // 為方塊綁定拖曳
    let dragging = false; // 是否拖曳中
    let sx = 0; // 起始 X
    let sy = 0; // 起始 Y

    tile.addEventListener('pointerdown', function (e) { // 按下
      if (tile.classList.contains('placed')) return; // 已放好的不能再拖
      dragging = true; // 進入拖曳狀態
      sx = e.clientX; // 記錄起始 X
      sy = e.clientY; // 記錄起始 Y
      tile.setPointerCapture(e.pointerId); // 鎖定指標，移出方塊也能持續追蹤
      tile.classList.add('dragging'); // 套用拖曳樣式
      tile.style.transition = 'none'; // 拖曳時取消動畫
    }); // pointerdown 結束

    tile.addEventListener('pointermove', function (e) { // 移動
      if (!dragging) return; // 沒在拖曳就略過
      tile.style.transform = 'translate(' + (e.clientX - sx) + 'px,' + (e.clientY - sy) + 'px)'; // 跟著指標位移
    }); // pointermove 結束

    function release(e) { // 放開或取消
      if (!dragging) return; // 沒在拖曳就略過
      dragging = false; // 結束拖曳狀態
      tile.classList.remove('dragging'); // 移除拖曳樣式
      tile.style.pointerEvents = 'none'; // 暫時讓方塊不擋住偵測
      const target = document.elementFromPoint(e.clientX, e.clientY); // 取得放開位置最上層的元素
      tile.style.pointerEvents = ''; // 恢復方塊的互動
      const slot = target ? target.closest('.slot') : null; // 找出是否放在空格上
      if (slot && !slot.firstChild && slot.dataset.answer === tile.dataset.value) { // 空格存在、是空的、答案正確
        slot.appendChild(tile); // 把方塊放進空格
        slot.classList.add('filled'); // 空格標示為已完成
        tile.style.transform = ''; // 清除位移
        tile.classList.add('placed'); // 標示方塊已放好
        solved++; // 答對題數加一
        if (!started) { // 第一次答對時
          started = true; // 記錄已開始
          startThoughts(); // 開始湧現念頭
        } // 判斷結束
      } else { // 否則放錯位置
        tile.style.transition = 'transform 0.25s'; // 啟用回彈動畫
        tile.style.transform = ''; // 回到原位
      } // 判斷結束
    } // release 結束
    tile.addEventListener('pointerup', release); // 放開時處理
    tile.addEventListener('pointercancel', release); // 被系統中斷時也處理
  } // bindDrag 結束

  function startThoughts() { // 讓念頭逐漸填滿螢幕
    const w = area.clientWidth; // 畫布寬
    const h = area.clientHeight; // 畫布高
    const cell = 60; // 覆蓋偵測用的小格邊長
    const cols = Math.ceil(w / cell); // 欄數
    const rows = Math.ceil(h / cell); // 列數
    const covered = []; // 每一格是否已被遮住
    for (let i = 0; i < cols * rows; i++) { // 逐格初始化
      const cy = (Math.floor(i / cols) + 0.5) * cell; // 這一格中心的 Y
      covered.push(cy < 70); // 上方資訊列底下的格子視為已遮住
    } // 迴圈結束
    let pool = shuffle(THOUGHTS.slice()); // 打亂的念頭牌堆
    let poolIdx = 0; // 目前抽到第幾張
    let spawned = 0; // 已出現數量

    function nextText() { // 抽下一句念頭
      if (poolIdx >= pool.length) { // 全部用完才重新洗牌
        pool = shuffle(THOUGHTS.slice()); // 重新洗牌
        poolIdx = 0; // 從頭開始
      } // 判斷結束
      return pool[poolIdx++]; // 回傳這一句並前進
    } // nextText 結束

    function spawn() { // 冒出一個念頭
      const open = []; // 還沒被遮住的格子
      for (let i = 0; i < covered.length; i++) { // 逐格檢查
        if (!covered[i]) open.push(i); // 沒遮住就記下來
      } // 迴圈結束
      if (open.length === 0) { // 全部遮住了
        later(done, 1200); // 稍待片刻後過關
        return; // 結束
      } // 判斷結束
      const pick = open[Math.floor(Math.random() * open.length)]; // 隨機挑一個沒遮住的格子
      const cx = ((pick % cols) + 0.5) * cell; // 念頭中心 X
      const cy = (Math.floor(pick / cols) + 0.5) * cell; // 念頭中心 Y
      const bw = Math.min(rand(260, 520), w * 0.7); // 念頭塊寬度（隨機，最大不超過畫面七成）
      const bh = bw * rand(0.5, 0.9); // 念頭塊高度（與寬度比例也隨機）
      const text = nextText(); // 抽一句念頭
      const color = BLOB_COLORS[Math.floor(Math.random() * BLOB_COLORS.length)]; // 隨機配色
      const fs = Math.min(rand(30, 52), Math.sqrt((bw * bh * 0.3) / (text.length * 1.4))); // 字級：盡量大，但要放得進塊裡
      const t = el('div', 'thought', text); // 建立念頭塊
      t.style.left = (cx - bw / 2) + 'px'; // 設定左邊位置
      t.style.top = (cy - bh / 2) + 'px'; // 設定上方位置
      t.style.width = bw + 'px'; // 設定寬度
      t.style.height = bh + 'px'; // 設定高度
      t.style.padding = '0 ' + (bw * 0.17) + 'px'; // 左右留白（用像素，避免百分比被誤算成畫布寬度）
      t.style.fontSize = fs + 'px'; // 設定字級
      t.style.background = color[0]; // 設定背景色
      t.style.color = color[1]; // 設定文字色
      t.style.clipPath = blobShape(); // 套用不規則輪廓
      t.style.transform = 'rotate(' + rand(-7, 7) + 'deg)'; // 隨機微傾斜
      area.appendChild(t); // 放進畫布
      for (let i = 0; i < covered.length; i++) { // 標記被這一塊遮住的格子
        const gx = ((i % cols) + 0.5) * cell; // 這一格中心 X
        const gy = (Math.floor(i / cols) + 0.5) * cell; // 這一格中心 Y
        const dx = (gx - cx) / (bw * 0.4); // 相對橢圓的 X 比例（取 0.4 保守估計）
        const dy = (gy - cy) / (bh * 0.4); // 相對橢圓的 Y 比例
        if (dx * dx + dy * dy <= 1) covered[i] = true; // 在橢圓內就算遮住
      } // 迴圈結束
      spawned++; // 數量加一
      later(spawn, Math.max(120, 800 - spawned * 35)); // 越來越快地冒出下一個
    } // spawn 結束
    spawn(); // 立刻冒出第一個
  } // startThoughts 結束
} // level1 結束

// ===== 第二關：提不起勁 =====
function level2(area, done) { // 第二關主函式
  area.innerHTML = // 建立畫面結構
    '<div class="l2-wrap">' + // 外層容器
    '<div class="l2-text" id="l2-text">今天只要做一件小事：起床。</div>' + // 內心獨白
    '<button class="l2-btn" id="l2-btn">起床</button>' + // 起床按鈕
    '<div class="l2-bar"><div class="l2-fill" id="l2-fill"></div></div>' + // 進度條
    '<div class="l2-tip" id="l2-tip">連續點擊「起床」，不要停下來</div>' + // 小提示
    '</div>'; // 容器結束
  const btn = document.getElementById('l2-btn'); // 起床按鈕
  const fill = document.getElementById('l2-fill'); // 進度填色
  const text = document.getElementById('l2-text'); // 獨白文字
  const words = [ // 隨進度變化的獨白
    { at: 0, t: '今天只要做一件小事：起床。' }, // 0%
    { at: 15, t: '身體好沉重…' }, // 15%
    { at: 35, t: '再躺五分鐘就好…' }, // 35%
    { at: 55, t: '明明只是起床，為什麼這麼難' }, // 55%
    { at: 75, t: '快了…再撐一下' }, // 75%
    { at: 92, t: '終於坐起來了' } // 92%
  ]; // 結束
  let progress = 0; // 目前進度（0~100）
  let clicks = 0; // 點擊次數
  let finished = false; // 是否已過關

  function render() { // 更新畫面
    fill.style.width = progress + '%'; // 更新進度條
    area.style.filter = 'grayscale(' + (0.9 - progress / 100 * 0.8) + ')'; // 進度越高色彩越回來
    let line = words[0].t; // 預設文字
    words.forEach(function (w) { // 找出符合目前進度的文字
      if (progress >= w.at) line = w.t; // 進度超過門檻就採用
    }); // 迴圈結束
    text.textContent = line; // 顯示文字
  } // render 結束

  btn.addEventListener('click', function () { // 點擊起床
    if (finished) return; // 已過關就不處理
    clicks++; // 次數加一
    const gain = Math.max(1.5, 5 - clicks * 0.12); // 越點越沒力氣，增量遞減
    progress = Math.min(100, progress + gain); // 增加進度
    render(); // 更新畫面
    if (progress >= 100) { // 達到 100%
      finished = true; // 標記過關
      later(done, 700); // 稍後呼叫過關
    } // 判斷結束
  }); // click 結束

  every(function () { // 每 0.3 秒進度會自己退回
    if (finished) return; // 過關後不再退
    progress = Math.max(0, progress - 0.8); // 進度下降
    render(); // 更新畫面
  }, 300); // 間隔 300 毫秒
  render(); // 初始畫面
} // level2 結束

// ===== 第三關：睡不著 =====
function level3(area, done) { // 第三關主函式
  area.innerHTML = // 建立畫面結構
    '<div class="l3-clock" id="l3-clock">23:00</div>' + // 時鐘
    '<div class="l3-count" id="l3-count">數羊：0 / 10</div>'; // 計數
  const clockEl = document.getElementById('l3-clock'); // 時鐘元素
  const countEl = document.getElementById('l3-count'); // 計數元素
  const worries = ['明天還有好多事要做', '剛剛是不是說錯話了', '為什麼別人都睡得著', '我是不是又要失眠了', '睡不著怎麼辦']; // 煩惱內容
  let minutes = 23 * 60; // 時間（分鐘），從晚上 11 點開始
  let count = 0; // 已數的羊
  let sheep = null; // 目前的羊
  let finished = false; // 是否過關

  function showClock() { // 更新時鐘
    const hh = String(Math.floor(minutes / 60) % 24).padStart(2, '0'); // 小時（超過 24 就回到 0，跨過午夜）
    const mm = String(Math.floor(minutes % 60)).padStart(2, '0'); // 分鐘
    clockEl.textContent = hh + ':' + mm; // 顯示時間
  } // showClock 結束

  function spawnSheep() { // 出現新的一隻羊
    const w = area.clientWidth; // 畫布寬
    const h = area.clientHeight; // 畫布高
    sheep = el('div', 'sheep', '🐑'); // 建立羊
    sheep.style.left = rand(w * 0.1, w * 0.8) + 'px'; // 隨機水平位置
    sheep.style.top = rand(h * 0.4, h * 0.8) + 'px'; // 隨機垂直位置
    sheep.addEventListener('click', function () { // 點擊羊
      if (finished) return; // 已過關不處理
      sheep.remove(); // 移除這隻羊
      sheep = null; // 清除參照
      count++; // 計數加一
      countEl.textContent = '數羊：' + count + ' / 10'; // 更新計數
      if (count >= 10) { // 數滿十隻
        finished = true; // 標記過關
        later(done, 800); // 稍後過關
      } else { // 否則
        spawnSheep(); // 出現下一隻
      } // 判斷結束
    }); // click 結束
    area.appendChild(sheep); // 放進畫布
  } // spawnSheep 結束

  function spawnWorry() { // 冒出擋住羊的煩惱泡泡
    if (finished || !sheep) return; // 過關或沒有羊就略過
    if (area.querySelectorAll('.bubble').length >= 5) return; // 泡泡最多五個
    const b = el('div', 'bubble', worries[Math.floor(Math.random() * worries.length)]); // 建立泡泡
    b.style.left = (parseFloat(sheep.style.left) - 90) + 'px'; // 水平對準羊
    b.style.top = (parseFloat(sheep.style.top) - 10) + 'px'; // 垂直對準羊
    let hp = 2; // 需要點兩下才能趕走
    b.addEventListener('click', function () { // 點擊泡泡
      hp--; // 耐久減一
      if (hp <= 0) { // 耐久用完
        b.remove(); // 移除泡泡
      } else { // 還沒用完
        b.style.opacity = '0.6'; // 變淡表示有效
      } // 判斷結束
    }); // click 結束
    area.appendChild(b); // 放進畫布
  } // spawnWorry 結束

  every(function () { // 時間一直流逝
    if (finished) return; // 過關後停止
    minutes += 15; // 每秒過 15 分鐘，慢慢從深夜走到凌晨
    showClock(); // 更新時鐘
  }, 1000); // 間隔 1 秒
  every(spawnWorry, 2200); // 每 2.2 秒冒出一個煩惱
  spawnSheep(); // 先出現第一隻羊
} // level3 結束

// ===== 自閉症第一關：每天一樣的路（第一人稱影片，不需要操作） =====
function autismLevel1(area, done) { // 自閉症第一關主函式：用畫布演出第一人稱的上學路
  area.innerHTML = ''; // 清空畫布
  const w = area.clientWidth; // 畫布寬
  const h = area.clientHeight; // 畫布高
  const dpr = Math.min(window.devicePixelRatio || 1, 2); // 螢幕像素比（最多取 2，避免太吃效能）
  const cv = document.createElement('canvas'); // 建立繪圖畫布
  cv.className = 'a1-canvas'; // 套用樣式
  cv.width = Math.round(w * dpr); // 實際像素寬
  cv.height = Math.round(h * dpr); // 實際像素高
  area.appendChild(cv); // 放進畫面
  const ctx = cv.getContext('2d'); // 取得繪圖工具
  const cardEl = el('div', 'a1-card'); // 中央的大字（第幾天）
  const subEl = el('div', 'a1-sub'); // 下方字幕（他的內心話）
  const stepEl = el('div', 'a1-steps'); // 右上角的步數
  const skipBtn = el('button', 'btn ghost a1-skip', '跳過'); // 跳過按鈕
  area.appendChild(cardEl); // 放入大字
  area.appendChild(subEl); // 放入字幕
  area.appendChild(stepEl); // 放入步數
  area.appendChild(skipBtn); // 放入跳過按鈕
  const muteBtn = el('button', 'btn ghost a1-mute', '靜音'); // 靜音按鈕
  area.appendChild(muteBtn); // 放入靜音按鈕
  muteBtn.addEventListener('click', function () { // 按下靜音或取消靜音
    muted = !muted; // 切換狀態
    muteBtn.textContent = muted ? '開啟聲音' : '靜音'; // 更新按鈕文字
  }); // click 結束
  let ended = false; // 是否已結束（避免重複呼叫過關）
  skipBtn.addEventListener('click', function () { // 按下跳過
    if (ended) return; // 已結束就不處理
    ended = true; // 標記結束
    done(); // 直接過關
  }); // click 結束

  // ---------- 左上角的小路線圖 ----------
  const MAP_NAMES = ['家', '巷口', '便利商店', '紅綠燈', '公車站', '校門']; // 路線上的地點
  const MAP_Z = [0, 40, 80, 118, 156, 196]; // 各地點在街上的位置（與街景一致）
  const MAP_X = MAP_NAMES.map(function (n, i) { return 22 + i * 51.2; }); // 各地點在路線圖上的 X 座標
  const MAP_Y = 30; // 主線的 Y 座標
  const DET = [(MAP_X[3] + MAP_X[4]) / 2, 66]; // 陌生小路在路線圖上的位置
  const SVG_NS = 'http://www.w3.org/2000/svg'; // SVG 的命名空間
  const mapEl = el('div', 'a1-map'); // 路線圖外框
  const mapSvg = document.createElementNS(SVG_NS, 'svg'); // 路線圖本體
  mapSvg.setAttribute('viewBox', '0 0 300 82'); // 路線圖座標範圍
  function sv(tag, attrs) { // 快速建立 SVG 元素並放進路線圖
    const n = document.createElementNS(SVG_NS, tag); // 建立元素
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); // 逐一設定屬性
    mapSvg.appendChild(n); // 放進路線圖
    return n; // 回傳元素
  } // sv 結束
  const mapDay = sv('text', { x: 4, y: 11, 'font-size': 11, 'font-weight': 700, fill: '#252B33' }); // 第幾天
  sv('line', { x1: MAP_X[0], y1: MAP_Y, x2: MAP_X[5], y2: MAP_Y, stroke: '#C4CBD2', 'stroke-width': 3, 'stroke-linecap': 'round' }); // 灰色的底線（整條路）
  const mapDetour = sv('path', { d: 'M' + MAP_X[3] + ' ' + MAP_Y + ' L' + DET[0] + ' ' + DET[1] + ' L' + MAP_X[4] + ' ' + MAP_Y, fill: 'none', stroke: '#B5534B', 'stroke-width': 2, 'stroke-dasharray': '4 4', opacity: 0 }); // 被迫繞路的虛線（發現路被封之後才出現）
  const mapProg = sv('polyline', { points: '', fill: 'none', stroke: '#4F6378', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); // 已經走過的路（深色）
  const mapDots = MAP_NAMES.map(function (n, i) { // 逐一畫出地點
    const c = sv('circle', { cx: MAP_X[i], cy: MAP_Y, r: 5, fill: '#C4CBD2', stroke: '#F7F8F9', 'stroke-width': 1.5 }); // 地點圓點
    sv('text', { x: MAP_X[i], y: MAP_Y + 18, 'font-size': 10, 'text-anchor': 'middle', fill: '#4A5560' }).textContent = n; // 地點名稱
    return c; // 回傳圓點，之後要換顏色
  }); // 地點結束
  const mapDetDot = sv('circle', { cx: DET[0], cy: DET[1], r: 4, fill: '#B5534B', opacity: 0 }); // 陌生小路的圓點
  const mapDetTxt = sv('text', { x: DET[0] + 9, y: DET[1] + 3.5, 'font-size': 10, fill: '#B5534B', opacity: 0 }); // 陌生小路的名稱
  mapDetTxt.textContent = '沒走過的路'; // 陌生小路的文字
  const mapMe = sv('circle', { cx: MAP_X[0], cy: MAP_Y, r: 8, fill: '#4F6378', stroke: '#FFFFFF', 'stroke-width': 2 }); // 代表「我」的圓點
  const mapMeTxt = sv('text', { x: MAP_X[0], y: MAP_Y + 3.5, 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', fill: '#FFFFFF' }); // 「我」字
  mapMeTxt.textContent = '我'; // 「我」字內容
  mapEl.appendChild(mapSvg); // 路線圖放入外框
  area.appendChild(mapEl); // 外框放進畫面

  function lerp2(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } // 兩點之間依比例取位置
  function nodeP(i) { return [MAP_X[i], MAP_Y]; } // 取得第 i 個地點的位置

  function mapUpdate(t, z, key, s) { // 依目前位置更新路線圖
    mapDay.textContent = '第 ' + (t < 21.5 ? 1 : t < 36 ? 2 : 3) + ' 天'; // 目前是第幾天
    const blocked = t >= 45.4; // 是否已發現路被封起來
    mapDetour.setAttribute('opacity', blocked ? '0.9' : '0'); // 顯示或隱藏繞路虛線
    mapDetDot.setAttribute('opacity', blocked ? '1' : '0'); // 顯示或隱藏陌生小路圓點
    mapDetTxt.setAttribute('opacity', blocked ? '1' : '0'); // 顯示或隱藏陌生小路文字
    let pos; // 「我」的位置
    let pts = []; // 已走過的路徑點
    let k = 0; // 已走到第幾個地點
    if (key === 'alley') { // 在陌生的小巷
      const q = Math.min(1, z / 60); // 小巷走了幾成
      pts = [nodeP(0), nodeP(1), nodeP(2), nodeP(3)]; // 先經過前四個地點
      if (q < 0.5) { // 走向陌生小路的中點
        pos = lerp2(nodeP(3), DET, q / 0.5); // 從紅綠燈往下偏離主線
      } else { // 從陌生小路走回主線
        pts.push(DET); // 經過陌生小路的中點
        pos = lerp2(DET, nodeP(4), (q - 0.5) / 0.5); // 往公車站靠近
      } // 判斷結束
      k = 3; // 已走到紅綠燈
      pts.push(pos); // 加入目前位置
    } else { // 在平常的大街
      const afterDetour = t >= 59.4; // 是否是繞路之後回到大街
      const zz = afterDetour ? Math.max(z, 156) : z; // 繞路後從公車站繼續
      while (k < 5 && zz >= MAP_Z[k + 1]) k++; // 找出已走到第幾個地點
      pos = k >= 5 ? nodeP(5) : lerp2(nodeP(k), nodeP(k + 1), (zz - MAP_Z[k]) / (MAP_Z[k + 1] - MAP_Z[k])); // 在兩個地點之間依比例取位置
      for (let i = 0; i <= k; i++) { // 加入走過的地點
        if (afterDetour && i === 4) pts.push(DET); // 繞路後的路徑要經過陌生小路
        pts.push(nodeP(i)); // 加入地點
      } // 迴圈結束
      if (k < 5) pts.push(pos); // 加入目前位置
    } // 判斷結束
    mapProg.setAttribute('points', pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ')); // 更新已走過的路徑
    mapDots.forEach(function (c, i) { // 逐一更新地點顏色
      const done = i <= k && !(key === 'alley' && i > 3); // 這個地點是否已走過
      const closed = blocked && i === 3 && t < 63.4; // 被封起來的紅綠燈
      c.setAttribute('fill', closed ? '#B5534B' : done ? '#4F6378' : '#C4CBD2'); // 套用顏色
    }); // 迴圈結束
    mapMe.setAttribute('cx', pos[0].toFixed(1)); // 更新「我」的位置 X
    mapMe.setAttribute('cy', pos[1].toFixed(1)); // 更新「我」的位置 Y
    mapMe.setAttribute('fill', s > 0.6 ? '#B5534B' : '#4F6378'); // 壓力大時，「我」變成警示色
    mapMeTxt.setAttribute('x', pos[0].toFixed(1)); // 更新「我」字位置 X
    mapMeTxt.setAttribute('y', (pos[1] + 3.5).toFixed(1)); // 更新「我」字位置 Y
    mapEl.style.opacity = blackAt(t) > 0.9 ? '0' : '1'; // 全黑時隱藏路線圖
  } // mapUpdate 結束

  // ---------- 聲音（用瀏覽器即時合成，不需要音檔） ----------
  const AudioCtor = window.AudioContext || window.webkitAudioContext; // 瀏覽器的音訊類別
  let ac = null; // 音訊環境
  let master = null; // 總音量
  let muted = false; // 是否靜音
  const au = {}; // 各種聲音元件
  let nextNote = 0; // 下一個音符的排程時間
  let noteStep = 0; // 目前是音樂的第幾拍
  let nextHonk = 0; // 下一次喇叭聲的時間
  let lastBeat = -1; // 上一次心跳的編號
  let hit1 = false; // 是否已播放第一次場景切換的重擊聲
  let hit2 = false; // 是否已播放第二次場景切換的重擊聲
  let noiseBuf = null; // 白噪音緩衝

  function noiseSource(loop) { // 建立一個白噪音來源
    const n = ac.createBufferSource(); // 建立來源
    n.buffer = noiseBuf; // 套用噪音緩衝
    n.loop = loop; // 是否循環
    return n; // 回傳來源
  } // noiseSource 結束

  function setupAudio() { // 建立所有聲音元件
    if (!AudioCtor) return; // 不支援聲音就略過
    try { ac = new AudioCtor(); } catch (e) { ac = null; return; } // 建立失敗就當作沒有聲音
    master = ac.createGain(); // 總音量
    master.gain.value = 0.7; // 預設音量
    const comp = ac.createDynamicsCompressor(); // 壓縮器，避免突然爆音
    master.connect(comp); // 接到壓縮器
    comp.connect(ac.destination); // 接到喇叭
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); // 兩秒的噪音緩衝
    const d = noiseBuf.getChannelData(0); // 取得資料
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; // 填入隨機值
    au.music = ac.createGain(); // 音樂音量
    au.music.gain.value = 0; // 一開始是 0
    au.music.connect(master); // 接到總音量
    au.rumble = ac.createGain(); // 車流轟隆聲的音量
    au.rumble.gain.value = 0; // 一開始是 0
    const lp = ac.createBiquadFilter(); // 低通濾波，只留低頻
    lp.type = 'lowpass'; // 低通
    lp.frequency.value = 260; // 截止頻率
    const n1 = noiseSource(true); // 循環噪音
    n1.connect(lp); // 噪音接濾波
    lp.connect(au.rumble); // 濾波接音量
    au.rumble.connect(master); // 接到總音量
    n1.start(); // 開始播放
    au.chatter = ac.createGain(); // 人群嘈雜聲的音量
    au.chatter.gain.value = 0; // 一開始是 0
    au.chatter.connect(master); // 接到總音量
    [[118, 700, 3.1], [157, 1100, 4.3], [203, 900, 2.6], [261, 1500, 5.2]].forEach(function (v) { // 四個重疊的「人聲」：音高、共鳴頻率、起伏速度
      const o = ac.createOscillator(); // 聲帶
      o.type = 'sawtooth'; // 鋸齒波，聽起來像人聲
      o.frequency.value = v[0]; // 音高
      const bp = ac.createBiquadFilter(); // 共鳴濾波
      bp.type = 'bandpass'; // 帶通
      bp.frequency.value = v[1]; // 共鳴頻率
      bp.Q.value = 4; // 共鳴強度
      const vg = ac.createGain(); // 這個聲音的音量
      vg.gain.value = 0.5; // 基本音量
      const lfo = ac.createOscillator(); // 讓音量忽大忽小，像說話的節奏
      lfo.frequency.value = v[2]; // 起伏速度
      const ld = ac.createGain(); // 起伏幅度
      ld.gain.value = 0.5; // 幅度
      lfo.connect(ld); // 起伏接幅度
      ld.connect(vg.gain); // 幅度控制音量
      o.connect(bp); // 聲帶接共鳴
      bp.connect(vg); // 共鳴接音量
      vg.connect(au.chatter); // 接到嘈雜聲音量
      o.start(); // 開始發聲
      lfo.start(); // 開始起伏
    }); // 迴圈結束
    au.drill = ac.createGain(); // 施工電鑽聲的音量（基底）
    au.drill.gain.value = 0; // 一開始是 0
    au.drillDepth = ac.createGain(); // 電鑽聲的快速開關幅度
    au.drillDepth.gain.value = 0; // 一開始是 0
    const dbp = ac.createBiquadFilter(); // 電鑽的聲音頻段
    dbp.type = 'bandpass'; // 帶通
    dbp.frequency.value = 900; // 中心頻率
    dbp.Q.value = 1.2; // 寬度
    const n2 = noiseSource(true); // 循環噪音
    const dl = ac.createOscillator(); // 快速開關的節拍
    dl.type = 'square'; // 方波
    dl.frequency.value = 13; // 每秒 13 下
    dl.connect(au.drillDepth); // 節拍接幅度
    au.drillDepth.connect(au.drill.gain); // 幅度控制音量
    n2.connect(dbp); // 噪音接濾波
    dbp.connect(au.drill); // 濾波接音量
    au.drill.connect(master); // 接到總音量
    n2.start(); // 開始播放
    dl.start(); // 開始節拍
    au.ring = ac.createGain(); // 耳鳴聲的音量
    au.ring.gain.value = 0; // 一開始是 0
    const ro = ac.createOscillator(); // 高頻的聲音
    ro.type = 'sine'; // 正弦波
    ro.frequency.value = 3300; // 高頻
    ro.connect(au.ring); // 接音量
    au.ring.connect(master); // 接到總音量
    ro.start(); // 開始發聲
    nextNote = ac.currentTime + 0.1; // 音樂從現在開始排程
    onCleanup(function () { // 離開這一關時關掉所有聲音
      if (!ac || ac.state === 'closed') return; // 已關閉就略過
      master.gain.setTargetAtTime(0, ac.currentTime, 0.05); // 音量快速降到 0
      const c = ac; // 暫存音訊環境
      setTimeout(function () { c.close(); }, 300); // 稍後關閉
    }); // 清理結束
  } // setupAudio 結束

  const CHORDS = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]]; // 四個和弦（C、Am、F、G）的音高

  function pluck(freq, when, vol, dur) { // 彈出一個柔和的音
    const o = ac.createOscillator(); // 聲音來源
    o.type = 'triangle'; // 三角波，音色柔和
    o.frequency.value = freq; // 音高
    const g = ac.createGain(); // 音量包絡
    g.gain.setValueAtTime(0.0001, when); // 起點
    g.gain.exponentialRampToValueAtTime(vol, when + 0.015); // 很快升到最大
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur); // 慢慢消失
    o.connect(g); // 聲音接音量
    g.connect(au.music); // 接到音樂音量
    o.start(when); // 開始
    o.stop(when + dur + 0.05); // 結束
  } // pluck 結束

  function scheduleMusic() { // 排程音樂：四個和弦不斷循環，平穩、可預測
    while (nextNote < ac.currentTime + 0.25) { // 提前排好接下來的音符
      const ch = CHORDS[Math.floor(noteStep / 8) % 4]; // 目前的和弦
      const k = noteStep % 8; // 這一小節的第幾拍
      if (k === 0) pluck(ch[0] / 2, nextNote, 0.16, 1.8); // 每小節第一拍是低音
      pluck(ch[[0, 1, 2, 1, 0, 1, 2, 1][k]], nextNote, 0.1, 0.9); // 上下來回的琶音
      if (k === 4) pluck(ch[2] * 2, nextNote, 0.06, 1.4); // 中間加一個高音點綴
      noteStep++; // 下一拍
      nextNote += 0.34; // 每拍 0.34 秒
    } // 迴圈結束
  } // scheduleMusic 結束

  function honk(o) { // 一聲汽車喇叭
    const when = ac.currentTime + 0.02; // 馬上播放
    const base = 380 + Math.random() * 120; // 隨機音高
    const dur = 0.18 + Math.random() * 0.55; // 隨機長度
    const g = ac.createGain(); // 音量包絡
    g.gain.setValueAtTime(0.0001, when); // 起點
    g.gain.exponentialRampToValueAtTime(0.1 + 0.12 * o, when + 0.02); // 很快變大聲
    g.gain.setValueAtTime(0.1 + 0.12 * o, when + dur); // 維持
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.06); // 收尾
    const f = ac.createBiquadFilter(); // 低通濾波，讓聲音不要太尖
    f.type = 'lowpass'; // 低通
    f.frequency.value = 2200; // 截止頻率
    [1, 1.26].forEach(function (r) { // 兩個音疊在一起，像真正的喇叭
      const os = ac.createOscillator(); // 聲音來源
      os.type = 'sawtooth'; // 鋸齒波，聲音刺耳
      os.frequency.value = base * r; // 音高
      os.connect(f); // 接濾波
      os.start(when); // 開始
      os.stop(when + dur + 0.1); // 結束
    }); // 迴圈結束
    f.connect(g); // 濾波接音量
    g.connect(master); // 接到總音量
  } // honk 結束

  function thump(o) { // 一下心跳
    const when = ac.currentTime + 0.01; // 馬上播放
    const os = ac.createOscillator(); // 聲音來源
    os.frequency.setValueAtTime(70, when); // 起始音高
    os.frequency.exponentialRampToValueAtTime(40, when + 0.18); // 音高快速下降
    const g = ac.createGain(); // 音量包絡
    g.gain.setValueAtTime(0.5 * o, when); // 一開始最大聲
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22); // 很快消失
    os.connect(g); // 聲音接音量
    g.connect(master); // 接到總音量
    os.start(when); // 開始
    os.stop(when + 0.25); // 結束
  } // thump 結束

  function impact() { // 場景突然切換時的一聲重擊
    const when = ac.currentTime + 0.01; // 馬上播放
    const src = noiseSource(false); // 一次性的噪音
    const f = ac.createBiquadFilter(); // 低通濾波
    f.type = 'lowpass'; // 低通
    f.frequency.setValueAtTime(2400, when); // 一開始很亮
    f.frequency.exponentialRampToValueAtTime(200, when + 0.6); // 快速變悶
    const g = ac.createGain(); // 音量包絡
    g.gain.setValueAtTime(0.5, when); // 一開始最大聲
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.7); // 慢慢消失
    src.connect(f); // 噪音接濾波
    f.connect(g); // 濾波接音量
    g.connect(master); // 接到總音量
    src.start(when); // 開始
  } // impact 結束

  function audioUpdate(t, s) { // 依時間與壓力程度更新所有聲音
    if (!ac || ac.state === 'closed') return; // 沒有聲音就略過
    const now = ac.currentTime; // 目前的音訊時間
    const base = muted ? 0 : (t >= 65.8 ? 0 : 0.7); // 總音量：靜音時為 0，影片最後淡出
    master.gain.setTargetAtTime(base, now, 0.15); // 平滑調整音量
    const mv = t < 0.8 ? 0 : t < 34.4 ? 0.5 : t < 35.8 ? 0.5 * (35.8 - t) / 1.4 : 0; // 音樂音量：前兩天有，第三天沒有
    if (t < 36) scheduleMusic(); // 前兩天才排程音樂
    au.music.gain.setTargetAtTime(mv, now, 0.1); // 平滑調整音樂音量
    let o = t >= 36 ? s : 0; // 吵雜的程度：只在第三天，並跟著壓力上升
    if (t >= 63.4) o = 0; // 抵達校門後，一切突然安靜下來
    au.rumble.gain.setTargetAtTime(o * 0.55, now, 0.2); // 車流轟隆聲
    au.chatter.gain.setTargetAtTime(Math.max(0, o - 0.25) * 0.5, now, 0.2); // 人群嘈雜聲
    const dd = Math.max(0, o - 0.3) * 0.22; // 電鑽聲的大小
    au.drill.gain.setTargetAtTime(dd, now, 0.1); // 電鑽聲的基底
    au.drillDepth.gain.setTargetAtTime(dd, now, 0.1); // 電鑽聲的開關幅度
    au.ring.gain.setTargetAtTime(Math.max(0, o - 0.7) * 0.05, now, 0.3); // 耳鳴聲
    if (o > 0.25 && now >= nextHonk) { // 該響喇叭了
      honk(o); // 響一聲
      if (o > 0.6 && Math.random() < 0.5) setTimeout(function () { if (ac && ac.state !== 'closed') honk(o); }, 220); // 壓力大時常常連響兩聲
      nextHonk = now + (2.2 - 1.7 * o) * (0.6 + Math.random() * 0.8); // 壓力越大，喇叭越頻繁
    } // 判斷結束
    const beat = Math.floor(t * 10.7 / (Math.PI * 2)); // 目前是第幾下心跳（與畫面的脈動同步）
    if (o > 0.3 && beat !== lastBeat) thump(o); // 壓力大時加上心跳聲
    lastBeat = beat; // 記錄心跳編號
    if (t >= 49.4 && !hit1) { hit1 = true; impact(); } // 被迫進入小巷的那一刻
    if (t >= 59.4 && !hit2) { hit2 = true; impact(); } // 回到大街的那一刻
  } // audioUpdate 結束

  // ---------- 小工具 ----------
  function rng(seed) { // 可重現的亂數產生器：同一個種子永遠蓋出同一條街
    let a = seed; // 內部狀態
    return function () { // 回傳亂數函式
      a = (a + 0x6D2B79F5) | 0; // 更新狀態
      let t = Math.imul(a ^ (a >>> 15), 1 | a); // 混合位元
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; // 再混合一次
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // 轉成 0 到 1 的小數
    }; // 函式結束
  } // rng 結束
  function hash(n) { // 把數字轉成 0 到 1 的固定亂數（用來決定哪些窗戶亮燈）
    const s = Math.sin(n * 12.9898) * 43758.5453; // 經典的雜湊算法
    return s - Math.floor(s); // 取小數部分
  } // hash 結束
  const hexCache = {}; // 顏色解析的快取
  function rgb(hex) { // 把 #RRGGBB 轉成數字陣列
    if (!hexCache[hex]) { // 還沒解析過
      hexCache[hex] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; // 解析並存起來
    } // 判斷結束
    return hexCache[hex]; // 回傳結果
  } // rgb 結束
  function mix(a, b, k) { // 兩個顏色依比例混合（用來做遠處的霧氣）
    const x = rgb(a); // 顏色 A
    const y = rgb(b); // 顏色 B
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' + Math.round(x[1] + (y[1] - x[1]) * k) + ',' + Math.round(x[2] + (y[2] - x[2]) * k) + ')'; // 回傳混合後的顏色
  } // mix 結束

  // ---------- 街道資料 ----------
  function makeBuildings(seed, zMax, minW, maxW, minH, maxH, gaps) { // 產生街道一側的建築清單
    const r = rng(seed); // 固定種子的亂數
    const list = []; // 建築清單
    let z = -10; // 從起點後方開始蓋
    while (z < zMax) { // 一路蓋到指定距離
      gaps.forEach(function (g) { if (z >= g[0] && z < g[1]) z = g[1]; }); // 如果落在缺口裡，就跳到缺口後面
      let z1 = z + minW + r() * (maxW - minW); // 這棟建築的結尾
      gaps.forEach(function (g) { if (z < g[0] && z1 > g[0]) z1 = g[0]; }); // 不可以蓋進缺口
      list.push({ z0: z, z1: z1, hgt: minH + r() * (maxH - minH), tone: Math.floor(r() * 4), seed: Math.floor(r() * 100000), store: false }); // 加入一棟建築
      z = z1; // 下一棟接在後面
    } // 迴圈結束
    return list; // 回傳清單
  } // makeBuildings 結束

  const worlds = { // 兩個場景：平常的大街、陌生的小巷
    main: { // 平常的大街
      half: 3, wallX: 5, far: 190, fog: '#EEE9DD', road: '#868C94', walk: '#B8BCBE', mark: '#E9E5D2', sky0: '#C6DAE7', sky1: '#F1ECDF', // 道路寬度、牆的位置、可視距離與配色
      tones: ['#D8D3C6', '#CBC7BC', '#E0DCD1', '#C3C0B8'], // 牆面的四種色調
      left: makeBuildings(11, 260, 9, 15, 6, 13, [[38, 46], [70, 92]]), // 左側建築（留出巷口與便利商店的位置）
      right: makeBuildings(23, 260, 9, 15, 6, 13, []) // 右側建築
    }, // 大街結束
    alley: { // 陌生的小巷
      half: 1.5, wallX: 3, far: 90, fog: '#E2E6E8', road: '#6A6F75', walk: '#8C8F92', mark: '#8F938F', sky0: '#DCE4E9', sky1: '#EEF1F2', // 更窄、更暗、更悶的配色
      tones: ['#9F998F', '#8B8782', '#ABA394', '#7F7B77'], // 牆面色調
      left: makeBuildings(31, 130, 5, 9, 9, 17, []), // 左側建築
      right: makeBuildings(47, 130, 5, 9, 9, 17, []) // 右側建築
    } // 小巷結束
  }; // 場景資料結束
  worlds.main.left.push({ z0: 70, z1: 92, hgt: 6, tone: 1, seed: 7, store: true }); // 補上便利商店那棟

  // ---------- 時間軸 ----------
  const END = 67.2; // 影片總長（秒）
  const segs = []; // 每一段的鏡頭資料
  function S(t0, t1, world, z0, z1, f0, f1) { // 登記一段鏡頭：時間、場景、起點終點位置、壓力程度（0 到 1）
    segs.push({ t0: t0, t1: t1, world: world, z0: z0, z1: z1, f0: f0 || 0, f1: f1 || 0 }); // 存入清單
  } // S 結束
  S(0, 2.5, 'main', 0, 0); // 第 1 天：站在門口
  S(2.5, 6.5, 'main', 0, 40); // 走到巷口
  S(6.5, 10, 'main', 40, 80); // 走到便利商店
  S(10, 12.5, 'main', 80, 112); // 走到紅綠燈前
  S(12.5, 14.5, 'main', 112, 112); // 等紅燈
  S(14.5, 17, 'main', 112, 156); // 過馬路走到公車站
  S(17, 20, 'main', 156, 196); // 走到校門
  S(20, 21.5, 'main', 196, 196); // 停在校門
  S(21.5, 23.2, 'main', 0, 0); // 第 2 天：回到門口
  S(23.2, 25.7, 'main', 0, 40); // 走到巷口（速度加快）
  S(25.7, 28, 'main', 40, 80); // 走到便利商店
  S(28, 29.8, 'main', 80, 112); // 走到紅綠燈前
  S(29.8, 31, 'main', 112, 112); // 等紅燈
  S(31, 33, 'main', 112, 156); // 走到公車站
  S(33, 35, 'main', 156, 196); // 走到校門
  S(35, 36, 'main', 196, 196); // 停在校門
  S(36, 38, 'main', 0, 0); // 第 3 天：回到門口
  S(38, 40.4, 'main', 0, 40); // 走到巷口
  S(40.4, 42.9, 'main', 40, 80); // 走到便利商店
  S(42.9, 45.4, 'main', 80, 104, 0.05, 0.35); // 走向紅綠燈，開始覺得不對勁
  S(45.4, 49.4, 'main', 104, 104, 0.35, 0.7); // 發現路被封起來了
  S(49.4, 59.4, 'alley', 0, 60, 0.8, 0.9); // 被迫走進陌生的小巷
  S(59.4, 63.4, 'main', 150, 196, 0.7, 0.3); // 回到大街，公車已經開走
  S(63.4, 67.2, 'main', 196, 196, 0.3, 0.2); // 終於到校門

  const subs = [ // 字幕：[開始秒數, 結束秒數, 內容]
    [0.9, 2.5, '早上七點。出門，先踏右腳。'], // 第 1 天
    [3.2, 6.3, '巷口。三十二步。'], // 巷口
    [7, 9.8, '便利商店，綠色的招牌。'], // 便利商店
    [10.5, 12.4, '紅綠燈。'], // 紅綠燈
    [12.6, 14.4, '等它變綠。'], // 等紅燈
    [15, 17, '公車站，七點十二分那一班。'], // 公車站
    [17.8, 19.8, '校門。到了。'], // 校門
    [21.8, 23.1, '和昨天一模一樣。'], // 第 2 天
    [23.6, 25.5, '巷口。三十二步。'], // 巷口
    [26, 27.8, '便利商店，綠色的招牌。'], // 便利商店
    [28.4, 29.7, '紅綠燈。'], // 紅綠燈
    [29.9, 31, '等它變綠。'], // 等紅燈
    [31.5, 33, '公車站。'], // 公車站
    [33.5, 34.8, '校門。到了。'], // 校門
    [36.8, 38, '今天也照著平常的路走。'], // 第 3 天
    [38.4, 40.2, '巷口。三十二步。'], // 巷口
    [41, 42.8, '便利商店，綠色的招牌。'], // 便利商店
    [43.6, 45.2, '紅綠燈……'], // 靠近紅綠燈
    [45.6, 47.2, '咦？前面是什麼？'], // 發現異狀
    [47.4, 49.2, '路被封起來了。'], // 路被封起來
    [49.9, 52.2, '這不是平常的路。'], // 小巷
    [52.6, 54.8, '步數對不上了。'], // 小巷
    [55.2, 57.2, '好吵。好亮。'], // 小巷
    [57.5, 59.2, '心跳好快。'], // 小巷
    [59.8, 62.6, '七點十二分那一班，已經開走了。'], // 回到大街
    [63.8, 66, '到了。但今天特別累。'] // 抵達校門
  ]; // 字幕結束
  const cards = [[0.3, 2.4, '第 1 天'], [21.6, 23.1, '第 2 天'], [36.1, 37.5, '第 3 天']]; // 中央大字：[開始, 結束, 內容]

  function lightState(t) { // 紅綠燈的狀態
    if (t < 13.8) return 'red'; // 第 1 天等紅燈
    if (t < 21.5) return 'green'; // 第 1 天綠燈
    if (t < 30.3) return 'red'; // 第 2 天等紅燈
    if (t < 35.5) return 'green'; // 第 2 天綠燈
    return 'off'; // 第 3 天施工，燈是暗的
  } // lightState 結束
  function blackAt(t) { // 畫面變黑的程度（0 到 1），用來在每一天之間淡出淡入
    if (t < 0.8) return 1 - t / 0.8; // 影片開頭淡入
    if (t >= 19.9 && t < 21) return (t - 19.9) / 1.1; // 第 1 天結束淡出
    if (t >= 21 && t < 21.6) return 1; // 全黑
    if (t >= 21.6 && t < 22.3) return 1 - (t - 21.6) / 0.7; // 第 2 天淡入
    if (t >= 34.4 && t < 35.5) return (t - 34.4) / 1.1; // 第 2 天結束淡出
    if (t >= 35.5 && t < 36.1) return 1; // 全黑
    if (t >= 36.1 && t < 36.8) return 1 - (t - 36.1) / 0.7; // 第 3 天淡入
    if (t >= 65.8) return Math.min(1, (t - 65.8) / 1.2); // 影片結尾淡出
    return 0; // 其他時間不變黑
  } // blackAt 結束

  // ---------- 3D 投影 ----------
  const cam = { x: 0, y: 1.55, z: 0 }; // 攝影機（你的眼睛）位置，單位是公尺
  let F = 1; // 焦距（決定遠近感）
  let CX = 0; // 畫面中心 X
  let HOR = 0; // 地平線的 Y
  let cur = worlds.main; // 目前正在畫的場景
  function proj(x, y, z) { // 把世界座標轉成畫面座標
    const zr = Math.max(z - cam.z, 0.05); // 與眼睛的距離（避免除以 0）
    const sc = F / zr; // 縮放比例：越遠越小
    return [CX + (x - cam.x) * sc, HOR + (cam.y - y) * sc, sc]; // 回傳畫面 X、Y 與比例
  } // proj 結束
  function poly(pts, fill) { // 畫一個填色的多邊形
    ctx.beginPath(); // 開始路徑
    ctx.moveTo(pts[0][0], pts[0][1]); // 移到第一個點
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); // 依序連線
    ctx.closePath(); // 封閉路徑
    ctx.fillStyle = fill; // 設定顏色
    ctx.fill(); // 填色
  } // poly 結束
  function fogK(z, f) { // 依距離算出霧氣比例
    return Math.min(1, Math.max(0, (z - cam.z) / cur.far)) * f; // 越遠霧越濃
  } // fogK 結束
  function bb(xa, xb, ya, yb, z, fill, text, fg) { // 畫一塊正對著你的看板（含文字）
    if (z - cam.z < 0.8) return; // 太近就不畫
    const p0 = proj(xa, yb, z); // 左上角
    const p1 = proj(xb, ya, z); // 右下角
    ctx.fillStyle = mix(fill, cur.fog, fogK(z, 0.8)); // 加上霧氣的顏色
    ctx.fillRect(p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]); // 畫出方塊
    if (text) { // 有文字
      ctx.fillStyle = fg; // 文字顏色
      ctx.font = 'bold ' + Math.max(8, (yb - ya) * p0[2] * 0.6) + 'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif'; // 依大小設定字級
      ctx.textAlign = 'center'; // 水平置中
      ctx.textBaseline = 'middle'; // 垂直置中
      ctx.fillText(text, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); // 寫字
    } // 判斷結束
  } // bb 結束
  function wallSign(side, text, zA, zB, yA, yB, bg, fg) { // 把招牌貼在牆上（文字會跟著透視斜過去）
    const yTop = Math.max(yA, yB); // 招牌上緣的高度（不管呼叫時兩個高度的順序，文字都不會上下顛倒）
    const yBot = Math.min(yA, yB); // 招牌下緣的高度
    const x = side * cur.wallX; // 牆的位置
    const a = Math.max(zA, cam.z + 1.5); // 太靠近就從眼前開始畫
    if (zB - a < 1) return; // 幾乎看不到就不畫
    const pa = side < 0 ? a : zB; // 畫面上最左邊的那一端
    const pb = side < 0 ? zB : a; // 畫面上最右邊的那一端
    const p0 = proj(x, yTop, pa); // 左上
    const p1 = proj(x, yTop, pb); // 右上
    const p2 = proj(x, yBot, pa); // 左下
    const p3 = proj(x, yBot, pb); // 右下
    poly([p0, p1, p3, p2], mix(bg, cur.fog, fogK(a, 0.8))); // 招牌底色
    if (!text) return; // 沒有文字就結束
    ctx.save(); // 保存繪圖狀態
    ctx.transform((p1[0] - p0[0]) / 200, (p1[1] - p0[1]) / 200, (p2[0] - p0[0]) / 60, (p2[1] - p0[1]) / 60, p0[0], p0[1]); // 把 200x60 的文字框貼到斜面上
    ctx.fillStyle = fg; // 文字顏色
    ctx.font = 'bold 40px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif'; // 字型
    ctx.textAlign = 'center'; // 水平置中
    ctx.textBaseline = 'middle'; // 垂直置中
    ctx.fillText(text, 100, 32); // 寫字
    ctx.restore(); // 還原繪圖狀態
  } // wallSign 結束

  function drawWall(side, b) { // 畫一棟建築的牆面與窗戶
    const x = side * cur.wallX; // 牆的位置
    const a = Math.max(b.z0, cam.z + 0.7); // 從眼前開始畫
    const c = b.z1; // 牆的結尾
    if (c <= a + 0.01 || a > cam.z + cur.far) return; // 看不到的就略過
    const mid = (a + Math.min(c, cam.z + cur.far)) / 2; // 牆的中間位置（用來算霧）
    const col = mix(cur.tones[b.tone], cur.fog, fogK(mid, 0.85)); // 牆面顏色（越遠越被霧氣蓋住）
    poly([proj(x, 0, a), proj(x, b.hgt, a), proj(x, b.hgt, c), proj(x, 0, c)], col); // 牆面
    if (side < 0) poly([proj(x, 0, a), proj(x, b.hgt, a), proj(x, b.hgt, c), proj(x, 0, c)], 'rgba(0,0,0,0.08)'); // 左側再疊一層陰影
    if (mid - cam.z > 90) return; // 太遠不畫窗戶
    if (b.store) poly([proj(x, 0.3, b.z0 + 2), proj(x, 2.7, b.z0 + 2), proj(x, 2.7, b.z1 - 2), proj(x, 0.3, b.z1 - 2)], mix('#E6EFE8', cur.fog, fogK(mid, 0.7))); // 便利商店的大片玻璃
    for (let zc = b.z0 + 1; zc + 1.6 < b.z1; zc += 3.2) { // 沿著牆一格一格放窗戶
      if (zc + 1.6 < a) continue; // 在身後的略過
      for (let row = 0; row * 3 + 2.6 < b.hgt; row++) { // 一層一層往上
        if (b.store && row === 0) continue; // 便利商店一樓不放一般窗戶
        const y0 = 1 + row * 3; // 窗戶下緣
        const hv = hash(b.seed + Math.floor(zc * 7) + row * 131); // 這扇窗戶的固定亂數
        const wc = hv > 0.9 ? '#EFE2B5' : '#93A5B2'; // 少數亮燈，其餘是玻璃的顏色
        poly([proj(x, y0, zc), proj(x, y0 + 1.5, zc), proj(x, y0 + 1.5, zc + 1.6), proj(x, y0, zc + 1.6)], mix(wc, cur.fog, fogK(mid, 0.8))); // 窗戶
      } // 層迴圈結束
    } // 窗戶迴圈結束
  } // drawWall 結束

  function drawSignal(x, z, state) { // 畫紅綠燈
    if (z - cam.z < 0.8) return; // 太近就不畫
    bb(x - 0.06, x + 0.06, 0, 4.4, z, '#5A6068', '', ''); // 燈桿
    bb(x - 0.32, x + 0.32, 4.4, 5.7, z, '#2A2F36', '', ''); // 燈箱
    const lamps = [['red', 5.35, '#E5483E'], ['amber', 5.05, '#E8B33C'], ['green', 4.75, '#42B883']]; // 三個燈：名稱、高度、亮起的顏色
    lamps.forEach(function (l) { // 逐一畫燈
      const p = proj(x, l[1], z); // 燈的位置
      ctx.beginPath(); // 開始路徑
      ctx.arc(p[0], p[1], Math.max(1, 0.13 * p[2]), 0, Math.PI * 2); // 圓形燈泡
      ctx.fillStyle = (state === l[0]) ? l[2] : '#3A4048'; // 亮的燈上色，其他是暗的
      ctx.fill(); // 填色
    }); // 迴圈結束
  } // drawSignal 結束

  function drawScene(t, key) { // 畫出整個街景
    cur = worlds[key]; // 切換目前場景
    const sky = ctx.createLinearGradient(0, 0, 0, HOR); // 天空漸層
    sky.addColorStop(0, cur.sky0); // 天頂顏色
    sky.addColorStop(1, cur.sky1); // 地平線顏色
    ctx.fillStyle = sky; // 套用漸層
    ctx.fillRect(0, 0, w, h); // 先把整個畫面塗成天空
    if (key === 'main') { // 大街才有學校的遠景
      bb(-40, 40, 0, 16, cam.z + cur.far * 1.3 > 232 ? 232 : cam.z + cur.far * 1.3, '#D6D2C6', '', ''); // 遠處的學校建築
      for (let c = -8; c <= 8; c++) { // 學校外牆的窗戶（先畫，才會被前面的街景擋住）
        for (let r = 0; r < 3; r++) bb(c * 4.4 - 1, c * 4.4 + 1, 2 + r * 4.5, 4.4 + r * 4.5, 232, '#B4B9BF', '', ''); // 一扇窗
      } // 迴圈結束
    } else { // 小巷
      bb(-3, 3, 0, 14, 100, '#FFFFFF', '', ''); // 巷子盡頭一片刺眼的白光
    } // 判斷結束
    const gA = cam.z + 0.6; // 地面從眼前開始
    const gB = cam.z + cur.far * 1.8; // 地面延伸到很遠
    poly([proj(-cur.half, 0, gA), proj(cur.half, 0, gA), proj(cur.half, 0, gB), proj(-cur.half, 0, gB)], cur.road); // 馬路
    poly([proj(-cur.wallX, 0, gA), proj(-cur.half, 0, gA), proj(-cur.half, 0, gB), proj(-cur.wallX, 0, gB)], cur.walk); // 左側人行道
    poly([proj(cur.half, 0, gA), proj(cur.wallX, 0, gA), proj(cur.wallX, 0, gB), proj(cur.half, 0, gB)], cur.walk); // 右側人行道
    if (key === 'main') { // 大街的馬路標線
      for (let zz = Math.floor(cam.z / 6) * 6; zz < cam.z + cur.far; zz += 6) { // 中線每 6 公尺一段
        if (zz + 2.5 < gA) continue; // 在身後的略過
        poly([proj(-0.08, 0, Math.max(zz, gA)), proj(0.08, 0, Math.max(zz, gA)), proj(0.08, 0, zz + 2.5), proj(-0.08, 0, zz + 2.5)], mix(cur.mark, cur.fog, fogK(zz, 0.8))); // 一段中線
      } // 迴圈結束
      for (let i = -2; i < 3; i++) { // 斑馬線，每條寬 0.5 公尺
        const zs = Math.max(118, gA); // 斑馬線起點
        if (122 > zs) poly([proj(i * 1.1 - 0.25, 0, zs), proj(i * 1.1 + 0.25, 0, zs), proj(i * 1.1 + 0.25, 0, 122), proj(i * 1.1 - 0.25, 0, 122)], mix('#EDEDE6', cur.fog, fogK(120, 0.8))); // 一條斑馬線
      } // 迴圈結束
      if (cam.z < 46) { // 還沒走過巷口時才需要畫
        poly([proj(-5, 0, 38), proj(-16, 0, 38), proj(-16, 0, 46), proj(-5, 0, 46)], '#7E848B'); // 巷子的地面
        poly([proj(-16, 0, 38), proj(-16, 9, 38), proj(-16, 9, 46), proj(-16, 0, 46)], mix('#B9B4A8', cur.fog, fogK(42, 0.7))); // 巷子盡頭的牆
        poly([proj(-5, 0, 46), proj(-16, 0, 46), proj(-16, 9, 46), proj(-5, 9, 46)], mix('#BEB9AD', cur.fog, fogK(46, 0.7))); // 巷口旁建築的側面
      } // 判斷結束
    } // 大街標線結束
    cur.left.forEach(function (b) { drawWall(-1, b); }); // 畫左側所有建築
    cur.right.forEach(function (b) { drawWall(1, b); }); // 畫右側所有建築
    const fc = rgb(cur.fog); // 霧的顏色（數字）
    const fy0 = HOR - h * 0.16; // 霧帶上緣
    const fy1 = HOR + h * 0.2; // 霧帶下緣
    const fog = ctx.createLinearGradient(0, fy0, 0, fy1); // 地平線附近的霧氣：上下兩側都漸層消失，不會出現硬邊
    fog.addColorStop(0, 'rgba(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ',0)'); // 上緣完全透明
    fog.addColorStop(0.44, 'rgba(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ',0.85)'); // 地平線處霧最濃
    fog.addColorStop(1, 'rgba(' + fc[0] + ',' + fc[1] + ',' + fc[2] + ',0)'); // 下緣完全透明
    ctx.fillStyle = fog; // 套用漸層
    ctx.fillRect(0, fy0, w, fy1 - fy0); // 畫出霧帶
    if (key === 'main') { // 大街上的東西，由遠到近依序畫
      bb(-3.8, -3.1, 0, 3.6, 200, '#C9C4B6', '', ''); // 校門左柱
      bb(3.1, 3.8, 0, 3.6, 200, '#C9C4B6', '', ''); // 校門右柱
      bb(-3.8, 3.8, 3, 3.8, 200, '#4F6378', '校門', '#FFFFFF'); // 校門橫梁
      bb(3.5, 3.6, 0, 2.6, 163, '#6E7882', '', ''); // 公車亭後柱
      poly([proj(3.5, 2.6, 154), proj(5, 2.6, 154), proj(5, 2.6, 163), proj(3.5, 2.6, 163)], mix('#6E7882', cur.fog, fogK(158, 0.8))); // 公車亭屋頂
      bb(3.5, 3.6, 0, 2.6, 154, '#6E7882', '', ''); // 公車亭前柱
      bb(3.6, 4.8, 2.2, 3, 154, '#4F6378', '公車站', '#FFFFFF'); // 公車站牌
      drawSignal(3.6, 118, lightState(t)); // 右側紅綠燈
      drawSignal(-3.6, 118, lightState(t)); // 左側行人紅綠燈
      if (t >= 36 && cam.z < 111) { // 第 3 天，紅綠燈前的施工圍欄
        for (let i = 0; i < 12; i++) { // 圍欄的紅白斜條
          const c = (i % 2) ? '#EDEDE6' : '#D9602B'; // 紅白交錯
          bb(-3 + i * 0.5, -2.5 + i * 0.5, 0.7, 1.1, 112, c, '', ''); // 下排橫條
          bb(-3 + i * 0.5, -2.5 + i * 0.5, 1.2, 1.6, 112, c, '', ''); // 上排橫條
        } // 迴圈結束
        bb(-2.95, -2.85, 0, 1.7, 112, '#3A4048', '', ''); // 左支柱
        bb(2.85, 2.95, 0, 1.7, 112, '#3A4048', '', ''); // 右支柱
        bb(-1.2, 1.2, 1.9, 2.9, 112, '#F2C14E', '施工中', '#222222'); // 施工告示牌
        if (Math.floor(t * 2) % 2 === 0) { // 警示燈每半秒閃一次
          [-2.9, 2.9].forEach(function (lx) { // 左右各一盞
            const lp = proj(lx, 1.85, 112); // 燈的位置
            ctx.beginPath(); // 開始路徑
            ctx.arc(lp[0], lp[1], Math.max(2, 0.14 * lp[2]), 0, Math.PI * 2); // 圓形燈
            ctx.fillStyle = '#FFB830'; // 琥珀色
            ctx.fill(); // 填色
          }); // 迴圈結束
        } // 判斷結束
        [-1.8, 1.8].forEach(function (cx0) { // 兩個三角錐
          if (110 - cam.z < 0.8) return; // 太近就不畫
          poly([proj(cx0 - 0.22, 0, 110), proj(cx0 + 0.22, 0, 110), proj(cx0, 0.75, 110)], mix('#D9602B', cur.fog, fogK(110, 0.8))); // 三角錐
        }); // 迴圈結束
      } // 施工圍欄結束
      wallSign(-1, '便利商店', 72, 90, 3.2, 4.6, '#3F7A68', '#FFFFFF'); // 左側牆上的便利商店招牌
      poly([proj(-4.98, 0, 3), proj(-4.98, 2.2, 3), proj(-4.98, 2.2, 4.6), proj(-4.98, 0, 4.6)], mix('#8B6B4F', cur.fog, fogK(4, 0.5))); // 自家的門
    } else { // 小巷裡的東西
      wallSign(1, '便利商店', 22, 34, 3.4, 4.6, '#B5534B', '#FFFFFF'); // 右牆上出現紅色的「便利商店」，位置不對
      wallSign(-1, '', 14, 18, 2.6, 3.6, '#E6E0B8', '#000000'); // 左牆上的空白招牌
      wallSign(1, '', 44, 49, 2.2, 3.4, '#E6E0B8', '#000000'); // 右牆上的空白招牌
      wallSign(-1, '', 38, 41, 3, 5.2, '#CFC9BE', '#000000'); // 左牆上另一塊空白招牌
    } // 判斷結束
  } // drawScene 結束

  function overlay(t, s, pulse) { // 畫面上的特效：暈影、顆粒、淡入淡出
    if (s > 0.01) { // 有壓力時才加特效
      const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.95); // 邊緣變暗的漸層
      vg.addColorStop(0, 'rgba(10,12,20,0)'); // 中心透明
      vg.addColorStop(1, 'rgba(10,12,20,' + (s * 0.6 * (0.8 + 0.2 * pulse)) + ')'); // 邊緣隨心跳變暗
      ctx.fillStyle = vg; // 套用漸層
      ctx.fillRect(0, 0, w, h); // 畫出暈影
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; // 顆粒顏色
      const n = Math.floor(s * 260); // 顆粒數量
      for (let i = 0; i < n; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); // 隨機撒上顆粒
    } // 判斷結束
    const flash = Math.max(0, 1 - Math.abs(t - 49.4) / 0.3) + Math.max(0, 1 - Math.abs(t - 59.4) / 0.3); // 場景切換時的白閃
    if (flash > 0) { // 需要閃白
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, flash) + ')'; // 白色
      ctx.fillRect(0, 0, w, h); // 蓋滿畫面
    } // 判斷結束
    const bk = blackAt(t); // 變黑程度
    if (bk > 0) { // 需要變黑
      ctx.fillStyle = 'rgba(15,20,28,' + bk + ')'; // 深色
      ctx.fillRect(0, 0, w, h); // 蓋滿畫面
    } // 判斷結束
  } // overlay 結束

  function texts(t, z, key) { // 更新字幕、大字與步數
    let sub = ''; // 目前的字幕
    let subA = 0; // 字幕透明度
    subs.forEach(function (s) { // 找出目前時間對應的字幕
      if (t >= s[0] && t < s[1]) { sub = s[2]; subA = Math.min(1, (t - s[0]) / 0.25, (s[1] - t) / 0.25); } // 前後各 0.25 秒淡入淡出
    }); // 迴圈結束
    subEl.textContent = sub; // 更新字幕文字
    subEl.style.opacity = sub ? String(subA) : '0'; // 更新字幕透明度
    let card = ''; // 目前的大字
    let cardA = 0; // 大字透明度
    cards.forEach(function (c) { // 找出目前時間對應的大字
      if (t >= c[0] && t < c[1]) { card = c[2]; cardA = Math.min(1, (t - c[0]) / 0.3, (c[1] - t) / 0.3); } // 前後各 0.3 秒淡入淡出
    }); // 迴圈結束
    cardEl.textContent = card; // 更新大字文字
    cardEl.style.opacity = card ? String(cardA) : '0'; // 更新大字透明度
    if (key === 'alley') { // 在小巷裡，步數亂跳
      stepEl.textContent = '步數 ' + (Math.floor(hash(Math.floor(t * 6)) * 90) + 10); // 數字對不上
    } else { // 在大街上，步數正常
      stepEl.textContent = '步數 ' + Math.floor(z / 1.25); // 每步 1.25 公尺
    } // 判斷結束
    stepEl.style.opacity = blackAt(t) > 0.9 ? '0' : '1'; // 全黑時隱藏步數
  } // texts 結束

  function frame(t) { // 畫出某一個時間點的畫面
    let sg = segs[segs.length - 1]; // 預設為最後一段
    for (let i = 0; i < segs.length; i++) { // 找出目前所在的鏡頭
      if (t >= segs[i].t0 && t < segs[i].t1) { sg = segs[i]; break; } // 找到就停止
    } // 迴圈結束
    const p = sg.t1 > sg.t0 ? Math.min(1, Math.max(0, (t - sg.t0) / (sg.t1 - sg.t0))) : 0; // 這一段走到了幾成
    const z = sg.z0 + (sg.z1 - sg.z0) * p; // 目前位置
    const s = sg.f0 + (sg.f1 - sg.f0) * p; // 目前的壓力程度
    const moving = sg.z1 !== sg.z0; // 是否正在走路
    const pulse = Math.pow(Math.max(0, Math.sin(t * 10.7)), 3); // 心跳（約每秒 1.7 下）
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 設定畫布縮放
    CX = w / 2; // 畫面中心
    F = h * 0.95 * (1 + s * 0.06 * pulse); // 焦距：壓力大時隨心跳忽遠忽近
    cam.z = z; // 眼睛的前後位置
    cam.x = (moving ? Math.sin(Math.PI * z / 2.5) * 0.05 : 0) + (Math.sin(t * 23) + Math.sin(t * 37.7)) * 0.02 * s; // 左右搖晃：走路與緊張
    cam.y = 1.55 - (moving ? Math.abs(Math.sin(Math.PI * z / 1.25)) * 0.07 : Math.sin(t * 1.6) * 0.01) + Math.sin(t * 29) * 0.03 * s; // 上下起伏：走路、呼吸與緊張
    HOR = h * 0.47 + Math.sin(t * 19) * h * 0.004 * s; // 地平線的位置
    cv.style.filter = 'saturate(' + (1 - s * 0.7) + ') contrast(' + (1 + s * 0.25) + ') brightness(' + (1 + s * 0.08) + ')'; // 壓力越大，畫面越褪色、越刺眼
    drawScene(t, sg.world); // 畫出街景
    overlay(t, s, pulse); // 畫上特效
    texts(t, z, sg.world); // 更新文字
    mapUpdate(t, z, sg.world, s); // 更新左上角路線圖
    audioUpdate(t, s); // 更新聲音
  } // frame 結束

  setupAudio(); // 建立聲音（這一關是由玩家按下按鈕開始的，所以瀏覽器允許播放聲音）
  const startAt = performance.now(); // 影片開始的時間
  function tick() { // 每一格畫面
    if (ended) return; // 已結束就不再畫
    const t = (performance.now() - startAt) / 1000; // 影片目前的秒數
    if (t >= END) { // 播放完畢
      ended = true; // 標記結束
      done(); // 過關
      return; // 結束
    } // 判斷結束
    frame(t); // 畫出這一格
  } // tick 結束
  every(tick, 33); // 約每秒 30 格
  tick(); // 立刻畫出第一格
} // autismLevel1 結束

// ===== 自閉症第二關：有人在叫你（拼拼圖） =====
const A2_OTHERS = ['喂，你在做什麼啊？', '你怎麼都不說話？', '要不要一起去？', '你有聽到嗎？', '看這邊啦', '老師在叫你欸', '你在拼什麼？', '回答一下嘛', '你是不是不舒服？', '這個給你看！']; // 別人說的話（畫面上會被模糊掉，看不清楚）

const A2_THOUGHTS = [ // 「我」的想法：[至少拼好幾片, [這個階段可能出現的想法]]，越接近完成，想法越平靜
  [0, ['他們好像在跟我說話。聽不清楚。', '好多聲音……']], // 剛開始
  [1, ['不知道該怎麼回答……', '他們是在叫我嗎？']], // 拼好一片之後
  [3, ['要看著他們的眼睛嗎？不想。', '如果不回答，他們會不會生氣？']], // 拼好三片之後
  [5, ['先把拼圖拼完就好。', '手上的事，我比較有把握。']], // 拼好五片之後
  [7, ['快好了。再一下就好。', '聲音好像變遠了。']], // 拼好七片之後
  [9, ['呼。拼好了。']] // 全部拼好
]; // 想法結束

function autismLevel2(area, done) { // 自閉症第二關主函式
  area.innerHTML = ''; // 清空畫布
  const w = area.clientWidth; // 畫布寬
  const h = area.clientHeight; // 畫布高
  const N = 3; // 拼圖是 N x N 片
  const small = w < 700; // 是否為手機等窄螢幕
  const B = small ? Math.min(w * 0.56, h * 0.28, 280) : Math.min(340, h * 0.38, w * 0.8); // 拼圖整體的邊長（手機縮小，留空間給想法與散落的拼圖片）
  const ps = B / N; // 每一片的邊長
  const bl = (w - B) / 2; // 拼圖板左邊位置
  const bt = small ? 92 : Math.max(100, h * 0.17); // 拼圖板上方位置（手機貼近上方）

  const cvs = document.createElement('canvas'); // 用畫布畫出一幅風景圖
  cvs.width = 600; // 圖寬
  cvs.height = 600; // 圖高
  const g = cvs.getContext('2d'); // 繪圖工具
  const sky = g.createLinearGradient(0, 0, 0, 380); // 天空漸層
  sky.addColorStop(0, '#BFD3E0'); // 上方的藍
  sky.addColorStop(1, '#EEF0E4'); // 地平線的米白
  g.fillStyle = sky; // 套用漸層
  g.fillRect(0, 0, 600, 600); // 畫天空
  g.fillStyle = '#E8C26A'; // 太陽的顏色
  g.beginPath(); // 開始路徑
  g.arc(470, 110, 55, 0, Math.PI * 2); // 太陽
  g.fill(); // 填色
  g.fillStyle = 'rgba(255,255,255,0.85)'; // 雲的顏色
  [[120, 90, 60, 22], [190, 105, 50, 18], [330, 60, 55, 18]].forEach(function (c) { // 三朵雲
    g.beginPath(); // 開始路徑
    g.ellipse(c[0], c[1], c[2], c[3], 0, 0, Math.PI * 2); // 橢圓形的雲
    g.fill(); // 填色
  }); // 迴圈結束
  g.fillStyle = '#A9BDB0'; // 遠山的顏色
  g.beginPath(); // 開始路徑
  g.moveTo(0, 360); // 左邊起點
  g.quadraticCurveTo(150, 230, 300, 340); // 山的曲線
  g.quadraticCurveTo(450, 250, 600, 350); // 山的曲線
  g.lineTo(600, 600); // 右下角
  g.lineTo(0, 600); // 左下角
  g.fill(); // 填色
  g.fillStyle = '#8FAE9A'; // 近處草地的顏色
  g.beginPath(); // 開始路徑
  g.moveTo(0, 420); // 左邊起點
  g.quadraticCurveTo(300, 340, 600, 430); // 草地的曲線
  g.lineTo(600, 600); // 右下角
  g.lineTo(0, 600); // 左下角
  g.fill(); // 填色
  g.fillStyle = '#E6DCC8'; // 小路的顏色
  g.beginPath(); // 開始路徑
  g.moveTo(255, 400); // 門口
  g.lineTo(325, 400); // 門口右側
  g.lineTo(440, 600); // 路的右下
  g.lineTo(170, 600); // 路的左下
  g.fill(); // 填色
  g.fillStyle = '#D9CBB5'; // 房子牆面的顏色
  g.fillRect(215, 300, 150, 100); // 房子本體
  g.fillStyle = '#B5674F'; // 屋頂的顏色
  g.beginPath(); // 開始路徑
  g.moveTo(200, 302); // 屋頂左下
  g.lineTo(290, 235); // 屋頂頂端
  g.lineTo(380, 302); // 屋頂右下
  g.fill(); // 填色
  g.fillStyle = '#6B7C8C'; // 門的顏色
  g.fillRect(268, 340, 44, 60); // 門
  g.fillStyle = '#F1E3B0'; // 窗戶的顏色
  g.fillRect(230, 320, 28, 28); // 左窗
  g.fillRect(322, 320, 28, 28); // 右窗
  g.fillStyle = '#7A6252'; // 樹幹的顏色
  g.fillRect(96, 330, 16, 80); // 樹幹
  g.fillStyle = '#6F9A7F'; // 樹葉的顏色
  g.beginPath(); // 開始路徑
  g.arc(104, 310, 48, 0, Math.PI * 2); // 樹葉
  g.fill(); // 填色
  const picUrl = cvs.toDataURL(); // 把圖轉成網址，給拼圖片當背景

  const board = el('div', 'a2-board'); // 拼圖板
  board.style.left = bl + 'px'; // 設定位置
  board.style.top = bt + 'px'; // 設定位置
  board.style.width = B + 'px'; // 設定寬度
  board.style.height = B + 'px'; // 設定高度
  const ghost = el('div', 'a2-ghost'); // 淡淡的完成圖，當作提示
  ghost.style.backgroundImage = 'url(' + picUrl + ')'; // 套用圖片
  board.appendChild(ghost); // 放進拼圖板
  for (let i = 0; i < N * N; i++) { // 畫出每一格的虛線框
    const cell = el('div', 'a2-cell'); // 一格
    cell.style.left = (i % N) * ps + 'px'; // 格子位置
    cell.style.top = Math.floor(i / N) * ps + 'px'; // 格子位置
    cell.style.width = ps + 'px'; // 格子寬度
    cell.style.height = ps + 'px'; // 格子高度
    board.appendChild(cell); // 放進拼圖板
  } // 迴圈結束
  area.appendChild(board); // 拼圖板放進畫面

  const meWrap = el('div', 'a2-me'); // 「我」的想法區
  const thoughtEl = el('div', 'a2-thought', ''); // 想法泡泡
  meWrap.appendChild(thoughtEl); // 放入想法
  meWrap.appendChild(el('div', 'a2-dot a2-dot1')); // 連到「我」的大圓點
  meWrap.appendChild(el('div', 'a2-dot a2-dot2')); // 連到「我」的小圓點
  meWrap.appendChild(el('div', 'a2-avatar', '我')); // 代表「我」的圓圈
  let tw = Math.min(300, w * 0.3); // 想法區寬度
  let th = 190; // 想法區高度（預估）
  let tx = bl + B + 28; // 想法區左邊位置：拼圖板右側，就在視線旁邊
  let ty = bt; // 想法區上方位置：和拼圖板上緣對齊
  if (small) { // 手機：想法區改成拼圖板正下方的一條橫幅，左邊是「我」，右邊是想法
    tw = w - 24; // 幾乎佔滿寬度，文字才不會被擠成直排
    th = 84; // 橫幅高度（預估）
    tx = 12; // 靠左留白
    ty = bt + B + 10; // 緊貼拼圖板下方
    meWrap.classList.add('wide'); // 套用橫向排版
  } else if (tx + tw > w - 12) { // 右邊放不下（窄螢幕）
    tx = Math.max(12, (w - tw) / 2); // 改成水平置中
    ty = bt + B + 16; // 放在拼圖板正下方
  } // 判斷結束
  meWrap.style.left = tx + 'px'; // 設定位置
  meWrap.style.top = ty + 'px'; // 設定位置
  meWrap.style.width = tw + 'px'; // 設定寬度
  meWrap.style.opacity = '0'; // 一開始先隱藏，等第一句別人的話出現後才冒出來
  area.appendChild(meWrap); // 放進畫面

  let placed = 0; // 已拼好的片數
  let zTop = 10; // 目前最上層的層級
  let finished = false; // 是否過關
  let lastStage = -1; // 上一次顯示的想法屬於第幾個階段
  let lastThoughtAt = -99999; // 上一次顯示想法的時間
  const thoughtIdx = {}; // 每個階段輪到第幾句想法
  let hotBubble = null; // 目前被「我」注意到的那一句別人的話

  function stageIdx() { // 依拼好的片數算出目前是第幾個想法階段
    let k = 0; // 預設第一個階段
    A2_THOUGHTS.forEach(function (t, i) { if (placed >= t[0]) k = i; }); // 取已達成的最後一個階段
    return k; // 回傳階段編號
  } // stageIdx 結束

  function showThought(force, bubble) { // 顯示「我」的一句想法
    const now = Date.now(); // 現在時間
    if (!force && now - lastThoughtAt < 4500) return; // 想法至少停留 4.5 秒，避免一直換
    const k = stageIdx(); // 目前階段
    const lines = A2_THOUGHTS[k][1]; // 這個階段的想法清單
    thoughtIdx[k] = ((thoughtIdx[k] === undefined ? -1 : thoughtIdx[k]) + 1) % lines.length; // 輪流換下一句，不重複
    thoughtEl.textContent = lines[thoughtIdx[k]]; // 更新文字
    meWrap.style.opacity = '1'; // 顯示想法區
    thoughtEl.classList.remove('pop'); // 先移除動畫標記
    void thoughtEl.offsetWidth; // 強制重新計算，讓動畫可以重新播放
    thoughtEl.classList.add('pop'); // 想法出現時輕輕浮現，吸引視線
    lastThoughtAt = now; // 記錄時間
    lastStage = k; // 記錄階段
    if (hotBubble) hotBubble.classList.remove('hot'); // 取消上一句別人的話的標記
    hotBubble = bubble || null; // 記錄這次是哪一句別人的話引起的
    if (hotBubble) hotBubble.classList.add('hot'); // 用顏色標出：「我」正在回應這一句
  } // showThought 結束

  const placedRects = []; // 已經放好的拼圖片位置（避免新片疊在一起）
  function scatter(i) { // 幫第 i 片找一個擺放的位置（散落在拼圖板周圍）
    for (let tries = 0; tries < 80; tries++) { // 最多試 80 次
      const x = rand(16, Math.max(17, w - ps - 16)); // 隨機 X
      const y0 = small ? ty + th + 8 + 56 : 100; // 可擺放的最上緣（手機：想法橫幅下方再留一條 56px 的帶狀區，給別人的話出現）
      const y = rand(y0, Math.max(y0 + 1, h - ps - 24)); // 隨機 Y（避開上方資訊列）
      const hitBoard = x + ps > bl - 12 && x < bl + B + 12 && y + ps > bt - 12 && y < bt + B + 12; // 是否壓到拼圖板
      const hitThought = x + ps > tx - 12 && x < tx + tw + 12 && y + ps > ty - 12 && y < ty + th + 12; // 是否壓到想法區
      if (hitBoard || hitThought) continue; // 壓到就重抽
      let hitOther = false; // 是否壓到其他片
      placedRects.forEach(function (r) { if (Math.abs(r[0] - x) < ps * 0.8 && Math.abs(r[1] - y) < ps * 0.8) hitOther = true; }); // 檢查距離
      if (hitOther && tries < 70) continue; // 壓到其他片就重抽（最後幾次放寬）
      placedRects.push([x, y]); // 記錄位置
      return [x, y]; // 回傳位置
    } // 迴圈結束
    return [16, 100 + i * 10]; // 實在找不到時的備用位置
  } // scatter 結束

  shuffle(Array.from({ length: N * N }, function (v, i) { return i; })).forEach(function (i) { // 把九片以隨機順序建立
    const r = Math.floor(i / N); // 這一片在第幾列
    const c = i % N; // 這一片在第幾欄
    const piece = el('div', 'a2-piece'); // 拼圖片
    piece.style.width = ps + 'px'; // 設定寬度
    piece.style.height = ps + 'px'; // 設定高度
    piece.style.backgroundImage = 'url(' + picUrl + ')'; // 套用圖片
    piece.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%'; // 圖片放大成 N 倍，只露出這一片的部分
    piece.style.backgroundPosition = (c * 100 / (N - 1)) + '% ' + (r * 100 / (N - 1)) + '%'; // 對準這一片的位置
    const pos = scatter(i); // 找擺放位置
    piece.style.left = pos[0] + 'px'; // 設定位置
    piece.style.top = pos[1] + 'px'; // 設定位置
    const cl = bl + c * ps; // 正確位置 X
    const ct = bt + r * ps; // 正確位置 Y
    let dragging = false; // 是否拖曳中
    let dx = 0; // 按下時與片左邊的距離
    let dy = 0; // 按下時與片上邊的距離
    piece.addEventListener('pointerdown', function (e) { // 按下拼圖片
      if (piece.classList.contains('placed') || finished) return; // 已放好或已過關就不能拖
      dragging = true; // 進入拖曳狀態
      dx = e.clientX - piece.offsetLeft; // 記錄按下位置
      dy = e.clientY - piece.offsetTop; // 記錄按下位置
      zTop++; // 提高層級
      piece.style.zIndex = zTop; // 放到最上層
      piece.setPointerCapture(e.pointerId); // 鎖定指標
      piece.classList.add('dragging'); // 套用拖曳樣式
    }); // pointerdown 結束
    piece.addEventListener('pointermove', function (e) { // 拖曳移動
      if (!dragging) return; // 沒在拖曳就略過
      piece.style.left = Math.min(w - ps, Math.max(0, e.clientX - dx)) + 'px'; // 更新位置 X（限制在畫面內）
      piece.style.top = Math.min(h - ps, Math.max(90, e.clientY - dy)) + 'px'; // 更新位置 Y（不蓋住資訊列）
      focusX = piece.offsetLeft + ps / 2; // 記錄正在拖的這片拼圖的中心 X，別人的話會出現在附近
      focusY = piece.offsetTop + ps / 2; // 記錄正在拖的這片拼圖的中心 Y
    }); // pointermove 結束
    function release() { // 放開
      if (!dragging) return; // 沒在拖曳就略過
      dragging = false; // 結束拖曳
      piece.classList.remove('dragging'); // 移除拖曳樣式
      if (Math.abs(piece.offsetLeft - cl) < ps * 0.3 && Math.abs(piece.offsetTop - ct) < ps * 0.3) { // 靠近正確位置
        piece.style.left = cl + 'px'; // 吸附到正確位置 X
        piece.style.top = ct + 'px'; // 吸附到正確位置 Y
        piece.style.zIndex = 2; // 放好後降到底層
        piece.classList.add('placed'); // 標記已放好
        placed++; // 片數加一
        if (stageIdx() !== lastStage) showThought(true, null); // 進入新的階段時，「我」的想法跟著換
        if (placed >= N * N) { // 全部拼好
          finished = true; // 標記過關
          later(done, 1600); // 稍後過關
        } // 判斷結束
      } // 判斷結束
    } // release 結束
    piece.addEventListener('pointerup', release); // 放開時處理
    piece.addEventListener('pointercancel', release); // 被中斷時也處理
    area.appendChild(piece); // 放進畫面
  }); // 迴圈結束

  const others = []; // 目前畫面上別人的話
  let focusX = bl + B / 2; // 視線焦點 X（一開始在拼圖板中央，拖拼圖時會跟著那一片）
  let focusY = bt + B / 2; // 視線焦點 Y

  function overlap(x, y, bw, bh, rx, ry, rw, rh, pad) { // 判斷兩個方塊是否重疊
    return x + bw > rx - pad && x < rx + rw + pad && y + bh > ry - pad && y < ry + rh + pad; // 回傳是否重疊
  } // overlap 結束

  function spawnOther() { // 冒出一句別人說的話（有點模糊，聽不太清楚）
    if (finished) return; // 過關後不再出現
    const maxN = 4 + placed; // 畫面上同時最多幾句：拼得越多，旁邊的人越多
    for (let tries = 0; tries < 60; tries++) { // 最多試 60 次找適合的位置
      const useFocus = Math.random() < 0.6; // 六成機率出現在正在拖的那片拼圖附近
      const ax = useFocus ? focusX : bl + B / 2; // 圍繞的中心 X
      const ay = useFocus ? focusY : bt + B / 2; // 圍繞的中心 Y
      const ang = Math.random() * Math.PI * 2; // 隨機方向
      const rad = useFocus ? rand(110, 230) : B / 2 + rand(70, 190); // 離中心的距離
      let x = ax + Math.cos(ang) * rad - 90; // 對話泡泡的 X
      let y = ay + Math.sin(ang) * rad * 0.7 - 20; // 對話泡泡的 Y
      if (small && tries < 12) { // 手機：先試著放在想法橫幅下方的專屬帶狀區，這裡不會被拼圖片蓋住
        x = rand(10, Math.max(11, w - 230)); // 隨機 X
        y = ty + th + 8 + rand(0, 10); // 帶狀區內的 Y
      } else if (tries >= 15) { // 靠近焦點的位置都被佔住時（手機空間小），改成在整個畫面隨機找空位
        x = rand(10, Math.max(11, w - 230)); // 隨機 X
        y = rand(90, Math.max(91, h - 70)); // 隨機 Y
      } // 判斷結束
      x = Math.min(w - 230, Math.max(10, x)); // 限制在畫面內
      y = Math.min(h - 70, Math.max(90, y)); // 限制在畫面內，且不蓋住資訊列
      if (overlap(x, y, 220, 44, bl, bt, B, B, 10)) continue; // 不遮住拼圖板
      if (overlap(x, y, 220, 44, tx, ty, tw, th, 10)) continue; // 不遮住「我」的想法區
      if (tries < 45) { // 前面幾次先避開其他已出現的話
        let hitB = false; // 是否壓到其他泡泡
        others.forEach(function (o) { if (overlap(x, y, 220, 44, o.offsetLeft, o.offsetTop, o.offsetWidth, o.offsetHeight, 4)) hitB = true; }); // 逐一檢查
        if (hitB) continue; // 重抽
      } // 判斷結束
      if (tries < 45) { // 前面幾次先盡量避開還沒拼好的拼圖片（手機空間小，否則話會被拼圖蓋住）
        let hitPiece = false; // 是否壓到拼圖片
        area.querySelectorAll('.a2-piece:not(.placed)').forEach(function (pc) { // 逐一檢查
          if (overlap(x, y, 220, 44, pc.offsetLeft, pc.offsetTop, ps, ps, 0)) hitPiece = true; // 有重疊
        }); // 檢查結束
        if (hitPiece) continue; // 重抽
      } // 判斷結束
      const b = el('div', 'a2-other', A2_OTHERS[Math.floor(Math.random() * A2_OTHERS.length)]); // 對話泡泡
      b.style.left = x + 'px'; // 設定位置
      b.style.top = y + 'px'; // 設定位置
      area.appendChild(b); // 放進畫面
      others.push(b); // 記錄泡泡
      while (others.length > maxN) others.shift().remove(); // 超過數量就移除最舊的
      later(function () { showThought(false, b); }, 900); // 約 1 秒後，「我」的想法浮現，回應這一句
      return; // 完成一次，結束
    } // 迴圈結束
  } // spawnOther 結束
  every(spawnOther, 1800); // 每 1.8 秒多一句別人的話
  later(spawnOther, 500); // 一開始很快就有第一句
} // autismLevel2 結束

// ===== 自閉症第三關：下課，大家在玩 =====
function autismLevel3(area, done) { // 自閉症第三關主函式
  area.innerHTML = ''; // 清空畫布
  const w = area.clientWidth; // 畫布寬
  const h = area.clientHeight; // 畫布高
  const cr = 70; // 安靜角落的半徑
  const cx = Math.max(w * 0.06, 16) + cr; // 角落中心 X
  const cy = h - Math.max(h * 0.08, 16) - cr; // 角落中心 Y
  const corner = el('div', 'a3-corner'); // 安靜的角落
  corner.appendChild(el('span', '', '安靜的角落')); // 角落文字
  corner.style.left = (cx - cr) + 'px'; // 設定位置
  corner.style.top = (cy - cr) + 'px'; // 設定位置
  area.appendChild(corner); // 放進畫布

  const gx = w * 0.76; // 團體遊戲中心 X
  const gy = h * 0.56; // 團體遊戲中心 Y
  const group = el('div', 'a3-group'); // 團體遊戲區
  group.style.left = gx + 'px'; // 設定位置
  group.style.top = gy + 'px'; // 設定位置
  for (let i = 0; i < 9; i++) { // 圍成一圈的同學
    const a = (Math.PI * 2 * i) / 9; // 角度
    const kid = el('div', 'a3-kid'); // 同學的圓點
    kid.style.left = (Math.cos(a) * 92) + 'px'; // 圓周上的 X
    kid.style.top = (Math.sin(a) * 92) + 'px'; // 圓周上的 Y
    group.appendChild(kid); // 放進團體遊戲區
  } // 迴圈結束
  group.appendChild(el('span', 'a3-group-label', '大家在玩團體遊戲')); // 團體遊戲文字
  area.appendChild(group); // 放進畫布

  const msg = el('div', 'a3-msg', ''); // 下方的內心話
  area.appendChild(msg); // 放進畫布
  const me = el('div', 'a3-me', '我'); // 代表你的圓點
  let mx = w * 0.42; // 你的位置 X（圓心）
  let my = h * 0.5; // 你的位置 Y（圓心）
  me.style.left = (mx - 28) + 'px'; // 設定位置
  me.style.top = (my - 28) + 'px'; // 設定位置
  area.appendChild(me); // 放進畫布

  const INVITES = ['一起來玩！', '來啦來啦', '一起踢球吧', '很好玩的啦', '一起嘛～', '過來這邊！', '換你踢球了！']; // 邀請的話
  const invites = []; // 目前出現的邀請
  let arrived = false; // 是否已走到安靜角落

  function spawnInvite() { // 冒出一句邀請（位置不會和其他邀請、團體遊戲、安靜角落重疊）
    if (arrived || invites.length >= 25) return; // 已抵達或數量已滿就不再出現
    const b = el('div', 'a3-invite', INVITES[Math.floor(Math.random() * INVITES.length)]); // 邀請泡泡
    b.style.fontSize = rand(16, 28) + 'px'; // 隨機字級，聲音忽大忽小
    b.style.visibility = 'hidden'; // 先隱藏，量好大小、找到位置後才顯示
    area.appendChild(b); // 先放進畫布才能量到實際大小
    const bw = b.offsetWidth; // 泡泡實際寬度
    const bh = b.offsetHeight; // 泡泡實際高度
    for (let tries = 0; tries < 60; tries++) { // 最多試 60 次找空位
      const x = rand(10, Math.max(11, w - bw - 10)); // 隨機 X（依實際寬度，不會被切到）
      const y = rand(90, Math.max(91, h - bh - 24)); // 隨機 Y（依實際高度，不會被切到）
      const dx = x + bw / 2 - cx; // 與角落中心的 X 距離
      const dy = y + bh / 2 - cy; // 與角落中心的 Y 距離
      if (Math.sqrt(dx * dx + dy * dy) < 170) continue; // 角落附近保持乾淨
      const gdx = x + bw / 2 - gx; // 與團體遊戲中心的 X 距離
      const gdy = y + bh / 2 - gy; // 與團體遊戲中心的 Y 距離
      if (Math.sqrt(gdx * gdx + gdy * gdy) < 150 + bw / 2) continue; // 不蓋住團體遊戲的圓點與文字
      let hit = false; // 是否壓到其他邀請
      invites.forEach(function (o) { // 逐一檢查已出現的邀請
        if (x < o.offsetLeft + o.offsetWidth + 8 && x + bw + 8 > o.offsetLeft && y < o.offsetTop + o.offsetHeight + 8 && y + bh + 8 > o.offsetTop) hit = true; // 兩個方塊重疊（含 8px 間距）
      }); // 檢查結束
      if (hit) continue; // 壓到就重抽
      b.style.left = x + 'px'; // 設定位置
      b.style.top = y + 'px'; // 設定位置
      b.style.visibility = 'visible'; // 顯示
      invites.push(b); // 記錄元素
      return; // 完成一次，結束
    } // 迴圈結束
    b.remove(); // 找不到空位就放棄這一句
  } // spawnInvite 結束

  let dragging = false; // 是否拖曳中
  me.addEventListener('pointerdown', function (e) { // 按下你的圓點
    if (arrived) return; // 已抵達就不能再拖
    dragging = true; // 進入拖曳狀態
    me.setPointerCapture(e.pointerId); // 鎖定指標
  }); // pointerdown 結束
  me.addEventListener('pointermove', function (e) { // 拖曳移動
    if (!dragging) return; // 沒在拖曳就略過
    const r = area.getBoundingClientRect(); // 畫布位置
    mx = Math.min(w - 28, Math.max(28, e.clientX - r.left)); // 限制在畫布內
    my = Math.min(h - 28, Math.max(98, e.clientY - r.top)); // 限制在資訊列之下
    me.style.left = (mx - 28) + 'px'; // 更新位置
    me.style.top = (my - 28) + 'px'; // 更新位置
  }); // pointermove 結束
  function release() { // 放開
    if (!dragging) return; // 沒在拖曳就略過
    dragging = false; // 結束拖曳
    const dx = mx - cx; // 與角落中心的 X 距離
    const dy = my - cy; // 與角落中心的 Y 距離
    if (Math.sqrt(dx * dx + dy * dy) > cr) return; // 還沒到角落
    arrived = true; // 標記已抵達
    clearAllTimers(); // 停止出現邀請
    mx = cx; // 圓點移到角落中央
    my = cy; // 圓點移到角落中央
    me.style.left = (mx - 28) + 'px'; // 更新位置
    me.style.top = (my - 28) + 'px'; // 更新位置
    invites.forEach(function (b) { b.remove(); }); // 邀請全部消失，變得安靜
    msg.textContent = '呼……聲音變小了。'; // 內心話
    later(done, 1600); // 稍後過關
  } // release 結束
  me.addEventListener('pointerup', release); // 放開時處理
  me.addEventListener('pointercancel', release); // 被中斷時也處理

  every(spawnInvite, 750); // 每 0.75 秒多一句邀請
  later(spawnInvite, 300); // 一開始很快就有第一句
} // autismLevel3 結束

// ===== 疾病與關卡資料（之後可在這裡新增） =====
const DISEASES = { // 所有疾病的資料
  depression: { // 憂鬱症
    name: '憂鬱症', // 名稱
    outro: HELP_HTML, // 最後一關過關視窗附上的求助資源
    levels: [ // 關卡清單
      { // 第一關
        title: '控制不住的胡思亂想', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '今晚還有作業沒完成', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '你坐在書桌前，準備完成今天的數學作業。眼前還有幾道題目需要解答，但腦中卻不斷浮現各種想法，讓你很難專心在眼前的事情上。', // 第一段
            '試著完成這份作業吧。' // 第二段
          ], // 內文結束
          button: '開始作答' // 開始按鈕文字
        }, // 情境結束
        hint: '把下方的答案方塊拖到正確的題目上，完成數學作業', // 操作提示
        run: level1, // 關卡函式
        info: '<p>憂鬱症患者常出現反覆、難以控制的負面想法（心理學稱之為:反芻思考）。這些念頭會占滿注意力，讓原本簡單的事情也變得困難。</p>' // 過關介紹
      }, // 第一關結束
      { // 第二關
        title: '提不起勁', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '早晨，準備開始一天', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '鬧鐘已經響了好幾次。你知道今天還有課要上，也有事情需要處理，但光是從床上起身，就好像需要花費很多力氣。', // 第一段
            '試著開始今天的生活吧。' // 第二段
          ], // 內文結束
          button: '開始這一天' // 開始按鈕文字
        }, // 情境結束
        hint: '連續點擊「起床」，讓進度條填滿', // 操作提示
        run: level2, // 關卡函式
        info: '<p>大腦裡有一個「動力系統」，靠多巴胺來驅動。它負責讓你有意願去做事——起床、洗臉、出門、工作。 但憂鬱症會使多巴胺分泌減少， 動力信號變弱。</p><p> 就像一輛車，油箱有油，但點火器壞了。想啟動，但打不著火。</p>' // 過關介紹
      }, // 第二關結束
      { // 第三關
        title: '睡不著的夜晚', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '明天還要上課，但今晚睡不著', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '夜已經深了，明天還有課。你躺在床上，試著讓自己放鬆、準備入睡，但腦袋裡仍然有許多事情揮之不去。', // 第一段
            '時間一分一秒地過去。' // 第二段
          ], // 內文結束
          button: '試著入睡' // 開始按鈕文字
        }, // 情境結束
        hint: '點擊羊來數羊，煩惱泡泡點擊兩次即可清除', // 操作提示
        theme: 'night', // 這一關使用夜間配色
        run: level3, // 關卡函式
        info: '<p>睡眠問題（難以入睡、半夜醒來）常與憂鬱症同時出現。腦中停不下來的煩惱，讓夜晚特別漫長。</p><p>若睡眠困擾持續兩週以上，建議尋求醫師或專業人員協助。</p>' // 過關介紹
      } // 第三關結束
    ] // 關卡清單結束
  }, // 憂鬱症結束
  autism: { // 自閉症
    name: '自閉症', // 名稱
    outro: '<div class="help">自閉症是一個光譜，每個人的感受與需求都不同。這個體驗只呈現其中一小部分，不能代表所有人。<br>身邊若有人是自閉症者，最好的方式是詢問他們需要什麼樣的協助。</div>', // 最後一關過關視窗附上的補充說明
    levels: [ // 關卡清單
      { // 第一關
        title: '每天一樣的路', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '早上，出門上學', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '從家裡到學校的路，你已經走過很多次了。每個轉角、每個路口、每一步的順序，你都記得很清楚。照著一樣的順序走，會讓你覺得安心。', // 第一段
            '接下來，你會用他的視角，走一遍這條路。', // 第二段
            '這一關有聲音，後段會變得很吵。想安靜一點，可以隨時按右下角的「靜音」。' // 第三段
          ], // 內文結束
          button: '開始觀看' // 開始按鈕文字
        }, // 情境結束
        hint: '這一關不需要操作，看看他眼中的這條路', // 操作提示
        run: autismLevel1, // 關卡函式
        info: '<p>許多自閉症者會透過固定的路線、順序和習慣，讓生活變得可以預測，也因此感到安心。</p><p>當計畫突然改變，例如路被封起來，可能會引起強烈的不安。提前告知變動、準備替代方案，會對患者有很大的幫助。</p>' // 過關介紹
      }, // 第一關結束
      { // 第二關
        title: '有人在叫你', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '教室裡的上午', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '上課前的空檔，你面前有一幅拼圖。把它一片一片拼好，是你覺得最安心的事，你很專注。', // 第一段
            '教室裡有人在說話，也有人在看你，但你只想先把手上的事做完。' // 第二段
          ], // 內文結束
          button: '開始拼拼圖' // 開始按鈕文字
        }, // 情境結束
        hint: '你只想把拼圖拼好，周圍的話語似乎聽不太清楚，你也不清楚該怎麼回應。', // 操作提示
        run: autismLevel2, // 關卡函式
        info: '<p>不少自閉症者覺得和別人對視很不舒服，甚至要花很多力氣才做得到。別人說的話有時像隔了一層霧，聽見了，卻很難理解，也不知道該怎麼回應。專注在某件事時，也可能沒有注意到有人在叫自己。</p><p>這並不代表不禮貌或不在乎。叫喚時可以先走到對方身邊、用輕拍或手勢輔助，再多給一點回應的時間。</p>' // 過關介紹
      }, // 第二關結束
      { // 第三關
        title: '下課，大家在玩', // 關卡名稱
        intro: { // 關卡開始前的情境說明
          title: '團體活動時間', // 情境標題
          body: [ // 情境內文，每個元素是一段
            '操場上，同學們正在玩團體遊戲，笑聲和說話聲混在一起。有人朝你招手，邀請你加入。', // 第一段
            '你覺得頭有點脹，想找個安靜的地方。' // 第二段
          ], // 內文結束
          button: '走進操場' // 開始按鈕文字
        }, // 情境結束
        hint: '把「我」拖到左下角的安靜角落', // 操作提示
        run: autismLevel3, // 關卡函式
        info: '<p>吵雜的環境、許多人同時說話，可能讓自閉症者感官過載而感到難受。不參加團體活動，不一定是不想交朋友，而是需要不同的相處方式。</p><p>提供安靜的選擇，或是一對一、小範圍的互動，常常比用力邀請更有效。</p>' // 過關介紹
      } // 第三關結束
    ] // 關卡清單結束
  } // 自閉症結束
}; // 資料結束

// ===== 遊戲流程 =====
function startDisease(id) { // 選擇疾病後開始
  const d = DISEASES[id]; // 取得疾病資料
  if (d.levels.length === 0) { // 尚未開放的主題
    showModal(d.name, '<p>這個主題還在規劃中，敬請期待。</p>', [{ text: '知道了', fn: closeModal }]); // 顯示提示
    return; // 結束
  } // 判斷結束
  menuEl.classList.add('hidden'); // 隱藏主選單
  gameEl.classList.remove('hidden'); // 顯示遊戲畫面
  runLevel(id, 0); // 從第一關開始
} // startDisease 結束

function runLevel(id, index) { // 執行指定關卡
  const d = DISEASES[id]; // 疾病資料
  const lv = d.levels[index]; // 關卡資料
  clearAllTimers(); // 清除上一關的計時器
  closeModal(); // 關閉小視窗
  areaEl.style.filter = ''; // 清除濾鏡
  areaEl.innerHTML = ''; // 清空畫布
  stageEl.dataset.theme = lv.theme || 'day'; // 依關卡設定切換日夜配色，沒設定就用日間
  hudTitle.textContent = '第 ' + (index + 1) + ' 關　' + lv.title; // 顯示標題（疾病名稱已由選單帶入，不再重複）
  hudHint.textContent = ''; // 情境畫面先不顯示操作提示
  function begin() { // 真正開始關卡
    areaEl.innerHTML = ''; // 清掉情境畫面
    hudHint.textContent = lv.hint; // 顯示操作提示
    lv.run(areaEl, function () { finishLevel(id, index); }); // 執行關卡，過關時呼叫 finishLevel
  } // begin 結束
  if (lv.intro) { // 這一關有情境說明
    showIntro(lv.intro, begin); // 先顯示情境，按下按鈕後才呼叫 begin
  } else { // 沒有情境說明
    begin(); // 直接開始
  } // 判斷結束
} // runLevel 結束

function showIntro(intro, onStart) { // 顯示關卡開始前的情境畫面
  const wrap = el('div', 'intro'); // 情境外框
  wrap.appendChild(el('h2', 'intro-title', intro.title)); // 情境標題
  intro.body.forEach(function (text) { // 逐段放入內文
    wrap.appendChild(el('p', 'intro-body', text)); // 一段內文
  }); // 迴圈結束
  const btn = el('button', 'btn intro-btn', intro.button); // 開始按鈕
  btn.addEventListener('click', onStart); // 按下後開始關卡
  wrap.appendChild(btn); // 按鈕放進外框
  areaEl.appendChild(wrap); // 外框放進畫布
  btn.focus(); // 讓鍵盤使用者可以直接按 Enter 開始
} // showIntro 結束

function finishLevel(id, index) { // 過關後的處理
  const d = DISEASES[id]; // 疾病資料
  const lv = d.levels[index]; // 關卡資料
  clearAllTimers(); // 停止計時器
  const isLast = index === d.levels.length - 1; // 是否最後一關
  const actions = []; // 按鈕清單
  actions.push({ text: '回主選單', ghost: true, fn: backToMenu }); // 回主選單按鈕
  if (!isLast) { // 還有下一關
    actions.push({ text: '下一關', fn: function () { runLevel(id, index + 1); } }); // 下一關按鈕
  } // 判斷結束
  showModal('體驗成功', lv.info + (isLast ? (d.outro || '') : ''), actions); // 顯示成功視窗，最後一關附上求助資源
} // finishLevel 結束

function backToMenu() { // 回到主選單
  clearAllTimers(); // 清除計時器
  closeModal(); // 關閉小視窗
  areaEl.innerHTML = ''; // 清空畫布
  areaEl.style.filter = ''; // 清除濾鏡
  stageEl.dataset.theme = 'day'; // 回到日間配色
  gameEl.classList.add('hidden'); // 隱藏遊戲畫面
  menuEl.classList.remove('hidden'); // 顯示主選單
} // backToMenu 結束

// ===== 綁定事件 =====
document.querySelectorAll('.disease-btn').forEach(function (b) { // 逐一處理疾病按鈕
  b.addEventListener('click', function () { startDisease(b.dataset.id); }); // 點擊後開始該疾病
}); // 迴圈結束
backBtn.addEventListener('click', backToMenu); // 返回按鈕回主選單

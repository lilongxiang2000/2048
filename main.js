let allCell      = document.querySelectorAll('tbody > tr > td')
let allCellNum   = new Array(16).fill(0)
let topScoreCell = document.querySelector('.top-score')
let topScore     = window.localStorage.getItem('topScore-2048') || 0
let scoreCell    = document.querySelector('.score')
let score        = 0


let replay = document.querySelector('.replay-btn')
replay.addEventListener('click', function () {
  init()
})

/**
 * 禁用 body 的滚动条
 * 设置 passive 属性的目的主要是为了在阻止事件默认行为导致的卡顿
 * 兼容 安卓 iOS
 */
document.body.addEventListener(
  'touchmove', function (e) {
    e.preventDefault()
  }, { passive: false }
)

// 移动端 touch 检测
let main = document.querySelector('.main')
let touchesPoints = []
main.addEventListener('touchmove', function (e) {
  let touchPoint = [e.touches[0].clientX, e.touches[0].clientY]
  touchesPoints.push(touchPoint)
})
main.addEventListener('touchend', function (e) {
  if (touchesPoints.length >= 2) {
    let startPoint = touchesPoints[0]
    let endPoint   = touchesPoints[touchesPoints.length - 1]
    let direction  = getTouchDirection(startPoint, endPoint)
    move(direction)
  }
  touchesPoints = []
})
function getTouchDirection(startPoint, lastPoint) {
  let x = lastPoint[0] - startPoint[0]
  let y = lastPoint[1] - startPoint[1]
  if (Math.abs(x) > Math.abs(y)) {
    if (x > 0) return 'right'
    else return 'left'
  } else {
    if (y > 0) return 'down'
    else return 'up'
  }
}

// 按键检测 方向键 & WASD
window.addEventListener("keydown", function (e) {
  let direction = getKeydownDirection(e.code)
  move(direction)
})
function getKeydownDirection(keyCode) {
  let direction = ''
  switch (keyCode) {
    case 'ArrowUp':
    case 'KeyW':
      direction = 'up'
      break
    case 'ArrowDown':
    case 'KeyS':
      direction = 'down'
      break
    case 'ArrowLeft':
    case 'KeyA':
      direction = 'left'
      break
    case 'ArrowRight':
    case 'KeyD':
      direction = 'right'
      break
    default:
      direction = '' + keyCode
  }
  return direction
}

// 手柄检测
const haveEvents       = 'ongamepadconnected' in window
const controllers      = {}
const btnIdx2Direction = {
  '12': 'up',
  '13': 'down',
  '14': 'left',
  '15': 'right',
}

function addGamepad(gamepad) {
  controllers[gamepad.index] = gamepad
  requestAnimationFrame(updateStatus)
}

function removeGamepad(gamepad) {
  delete controllers[gamepad.index]
}

let lastBtnIdx = -1
function updateStatus() {
  if (!haveEvents) updateGamepads()

  for (let i in controllers) {
    const controller = controllers[i]
    if (controller) {
      // [{pressed: false, touched: false, value: 0}]
      controller.buttons.forEach((button, idx) => {
        if (btnIdx2Direction[idx]) {
          if (button.value === 1) {
            if (idx !== lastBtnIdx) {
              lastBtnIdx = idx
              move(btnIdx2Direction[idx])
            }
          } else if (idx === lastBtnIdx) {
            lastBtnIdx = -1
          }
        }
      })
    }
  }

  requestAnimationFrame(updateStatus);
}

function updateGamepads() {
  const gamepads = navigator.getGamepads
    ? navigator.getGamepads()
    : navigator?.webkitGetGamepads() || []
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (gamepads[i].index in controllers) {
        controllers[gamepads[i].index] = gamepads[i]
      } else addGamepad(gamepads[i]);
    }
  }
}

window.addEventListener("gamepadconnected", e => {
  console.log(`${e.gamepad.id} connected`)
  addGamepad(e.gamepad)
  console.log(controllers)
})
window.addEventListener("gamepaddisconnected", e => {
  console.log(`${e.gamepad.id} disconnected`)
  removeGamepad(e.gamepad)
  console.log(controllers)
})

if (!haveEvents) {
  setInterval(updateGamepads, 1000)
}



function init() {
  allCellNum = new Array(16).fill(0)
  repaintAll()

  setRandomCell()
  setRandomCell()

  updateTopScore()
  updateScore(-score)
}


/** 移动 cell 并创建新的 cell
 * @param {String} direction
 */
function move(direction) {
  let moved = false
  switch (direction) {
    case 'up':
      moveUp()
      console.log('move up')
      break
    case 'down':
      moveDown()
      console.log('move down')
      break
    case 'left':
      moveLeft()
      console.log('move left')
      break
    case 'right':
      moveRight()
      console.log('move right')
      break
    default:
      console.log('move error')
      break
  }
  // 移动成功后，随机生成一个新的 cell
  moved = repaintAll()
  if (moved) console.log('finish')
  else console.warn('Can not move')

  if (checkGameOver()) {
    alert('Game Over')
    init()
  } else if (moved) setRandomCell()
}
function moveUp() {
  // 遍历每列
  for (let col = 0; col < 4; col++) {
    let cols = [
      allCellNum[col],
      allCellNum[col + 4],
      allCellNum[col + 8],
      allCellNum[col + 12]
    ]

    // 该列为空，不处理
    if (cols.reduce((a, b) => {
        return a + b
      }, 0) == 0) {
      continue
    }
    // 去除中间 0，往上补 0
    cols = cols.filter(col => col != 0)
    for (let i = cols.length; i < 4; i++) {
      cols.push(0)
    }

    for (let row = 0; row < 3; row++) {
      if (cols[row] == cols[row + 1]) {
        cols[row] *= 2
        updateScore(cols[row])
        cols[row + 1] = 0
        row++
      }
      // 去除中间 0，往下补 0
      cols = cols.filter(col => col != 0)
      if (cols.length == 1) {
        if (cols.length == 1) {
          // 该行没有其他元素，提前结束
          for (let i = cols.length; i < 4; i++) {
            cols.push(0)
          }
          break
        }
      }
      for (let i = cols.length; i < 4; i++) {
        cols.push(0)
      }
    }
    allCellNum[col] = cols[0],
    allCellNum[col + 4] = cols[1],
    allCellNum[col + 8] = cols[2],
    allCellNum[col + 12] = cols[3]
  }
}
function moveDown() {
  // 遍历每列
  for (let col = 0; col < 4; col++) {
    let cols = [
      allCellNum[col],
      allCellNum[col + 4],
      allCellNum[col + 8],
      allCellNum[col + 12]
    ]

    // 该列为空，不处理
    if (cols.reduce((a, b) => {
        return a + b
      }, 0) == 0) {
      continue
    }
    // 去除中间 0，往上补 0
    cols = cols.filter(col => col != 0)
    for (let i = cols.length; i < 4; i++) {
      cols.unshift(0)
    }

    for (let row = 3; row >= 1; row--) {
      if (cols[row] == cols[row - 1]) {
        cols[row] *= 2
        updateScore(cols[row])
        cols[row - 1] = 0
        row--
      }
      // 去除中间 0，往上补 0
      cols = cols.filter(col => col != 0)
      if (cols.length == 1) {
        // 该行没有其他元素，提前结束
        for (let i = cols.length; i < 4; i++) {
          cols.unshift(0)
        }
        break
      }
      for (let i = cols.length; i < 4; i++) {
        cols.unshift(0)
      }
    }
    allCellNum[col] = cols[0],
    allCellNum[col + 4] = cols[1],
    allCellNum[col + 8] = cols[2],
    allCellNum[col + 12] = cols[3]
  }
}
function moveLeft() {
  // 遍历每行
  for (let row = 0; row < 4; row++) {
    let rows = [
      allCellNum[row * 4 + 0],
      allCellNum[row * 4 + 1],
      allCellNum[row * 4 + 2],
      allCellNum[row * 4 + 3]
    ]

    // 该行为空，不处理
    if (rows.reduce((a, b) => {
        return a + b
      }, 0) == 0) {
      continue
    }
    // 去除中间 0，往右补 0
    rows = rows.filter(row => row != 0)
    for (let i = rows.length; i < 4; i++) {
      rows.push(0)
    }

    for (let col = 0; col < 3; col++) {
      if (rows[col] == rows[col + 1]) {
        rows[col] *= 2
        updateScore(rows[col])
        rows[col + 1] = 0
        col++
      }
      // 去除中间 0，往右补 0
      rows = rows.filter(row => row != 0)
      if (rows.length == 1) {
        // 该行没有其他元素，提前结束
        for (let i = rows.length; i < 4; i++) {
          rows.push(0)
        }
        break
      }
      for (let i = rows.length; i < 4; i++) {
        rows.push(0)
      }
    }
    allCellNum[row * 4 + 0] = rows[0],
    allCellNum[row * 4 + 1] = rows[1],
    allCellNum[row * 4 + 2] = rows[2],
    allCellNum[row * 4 + 3] = rows[3]
  }
}
function moveRight() {
  // 遍历每行
  for (let row = 0; row < 4; row++) {
    let rows = [
      allCellNum[row * 4 + 0],
      allCellNum[row * 4 + 1],
      allCellNum[row * 4 + 2],
      allCellNum[row * 4 + 3]
    ]

    // 该行为空，不处理
    if (rows.reduce((a, b) => {
        return a + b
      }, 0) == 0) {
      continue
    }
    // 去除中间 0，往右补 0
    rows = rows.filter(row => row != 0)
    for (let i = rows.length; i < 4; i++) {
      rows.unshift(0)
    }

    for (let col = 3; col >= 1; col--) {
      if (rows[col] == rows[col - 1]) {
        rows[col] *= 2
        updateScore(rows[col])
        rows[col - 1] = 0
        col--
      }
      // 去除中间 0，往右补 0
      rows = rows.filter(row => row != 0)
      if (rows.length == 1) {
        if (rows.length == 1) {
          // 该行没有其他元素，提前结束
          for (let i = rows.length; i < 4; i++) {
            rows.unshift(0)
          }
          break
        }
      }
      for (let i = rows.length; i < 4; i++) {
        rows.unshift(0)
      }
    }
    allCellNum[row * 4 + 0] = rows[0],
    allCellNum[row * 4 + 1] = rows[1],
    allCellNum[row * 4 + 2] = rows[2],
    allCellNum[row * 4 + 3] = rows[3]
  }
}

function getRandomNum() {
  // https://github.com/gabrielecirulli/2048/blob/master/js/game_manager.js#L71
  return Math.random() < 0.9 ? 2 : 4
}

function repaintAll() {
  let repainted = false
  for (let i = 0; i < 16; i++) {
    if (allCellNum[i] == 0) {
      if (!allCell[i].classList.contains('null')) {
        repainted = true
      }
      resetClassList(allCell[i])
    } else {
      if (!allCell[i].classList.contains('n-' + allCellNum[i])) {
        repainted = true
      }
      resetClassList(allCell[i], 'n-' + allCellNum[i])
    }
  }
  return repainted
}

function repaint(index, num) {
  if (num == 0) {
    resetClassList(allCell[index])
    allCellNum[index] = num
  } else {
    resetClassList(allCell[index], 'n-' + num)
    allCellNum[index] = num
  }
}

function resetClassList(item, className='') {
  while (item.classList.length) {
    item.classList.remove(item.classList.item(0))
  }
  if (className.length) item.classList.add(className)
  else item.classList.add('null')
}

/** 随机设置一个 cell 为 2 或 4
 * @returns {boolean} 是否设置成功
 */
function setRandomCell() {
  let emptyCell = []
  for (let i = 0; i < 16; i++) {
    if (allCellNum[i] == 0) {
      emptyCell.push(i)
    }
  }
  if (emptyCell.length == 0) return false
  let index = emptyCell[Math.floor(Math.random() * emptyCell.length)]
  let num = getRandomNum()
  repaint(index, num)
  return true
}

function updateScore(num=0) {
  score += num
  scoreCell.innerHTML = score
}
function updateTopScore() {
  topScore = score > topScore ? score : topScore
  window.localStorage.setItem('topScore-2048', topScore)
  topScoreCell.innerHTML = 'TOP:' +
    window.localStorage.getItem('topScore-2048')
}

function checkGameOver() {
  let emptyCell = allCellNum.filter(num => num == 0)
  if (emptyCell.length == 0) {
    let allCellNumCopy = allCellNum.slice()
    let thisScore = score // 记录检查前的分数
    moveUp()
    updateScore(thisScore - score) // 还原检测前分数
    moveDown()
    updateScore(thisScore - score) // 还原检测前分数
    moveLeft()
    updateScore(thisScore - score) // 还原检测前分数
    moveRight()
    updateScore(thisScore - score) // 还原检测前分数
    if (allCellNumCopy.toString() == allCellNum.toString()) {
      return true
    } else {
      allCellNum = allCellNumCopy
      return false
    }
  }
  return false
}

init()

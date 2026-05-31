const socket = io();  // 如果前后端分开部署，改成 io('https://你的后端地址')
let myNumber = null;  // 'A' 或 'B'
let gameState = { A: null, B: null };
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 连接服务器
socket.on('assign', (num) => {
    myNumber = num;
    document.getElementById('playerLabel').innerText = `你是玩家 ${num}`;
});

socket.on('gameState', (state) => {
    gameState = state;
    updateUI();
    drawCanvas();
});

function updateUI() {
    if (gameState.A) document.getElementById('hpA').innerText = `A血量: ${gameState.A.hp}`;
    if (gameState.B) document.getElementById('hpB').innerText = `B血量: ${gameState.B.hp}`;
}

// 绘制圆形玩家
function drawCanvas() {
    ctx.clearRect(0, 0, 600, 600);
    if (gameState.A) {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(gameState.A.x, gameState.A.y, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('A', gameState.A.x-6, gameState.A.y+6);
        // 显示武器
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.fillText(gameState.A.weapon===0?'拳':'弓', gameState.A.x-10, gameState.A.y-10);
    }
    if (gameState.B) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(gameState.B.x, gameState.B.y, 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('B', gameState.B.x-6, gameState.B.y+6);
        ctx.fillStyle = 'black';
        ctx.font = '12px monospace';
        ctx.fillText(gameState.B.weapon===0?'拳':'弓', gameState.B.x-10, gameState.B.y-10);
    }
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    if (!myNumber) return;
    const key = e.key;
    let dx = 0, dy = 0;
    let dir = null;
    switch(key) {
        case 'w': dy = -10; dir = 0; break;
        case 's': dy = 10;  dir = 1; break;
        case 'a': dx = -10; dir = 2; break;
        case 'd': dx = 10;  dir = 3; break;
        case ' ':           // 空格攻击
            socket.emit('attack');
            break;
        case 'e':
            socket.emit('heal');
            break;
        case 'r':
            socket.emit('switchWeapon');
            break;
        default: return;
    }
    if (dx !== 0 || dy !== 0) {
        socket.emit('move', { dx, dy, dir });
    }
});

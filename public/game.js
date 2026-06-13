const socket = io("windtalking-production.up.railway.app");
let myNumber = null;  // 'A' 或 'B'
let gameState = { A: null, B: null };
let attackEffect = null;  // 存储攻击特效 { x, y, endTime }

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 网格配置
const GRID_SIZE = 30;     // 格子大小 30px
const MAP_SIZE = 20;      // 20x20 网格
const PLAYER_SIZE = 20;   // 玩家圆形半径

// 偏移量，让地图居中
const offsetX = (canvas.width - MAP_SIZE * GRID_SIZE) / 2;
const offsetY = (canvas.height - MAP_SIZE * GRID_SIZE) / 2;

// ========== 连接服务器 ==========
socket.on('assign', (num) => {
    myNumber = num;
    document.getElementById('playerLabel').innerText = `你是玩家 ${num}`;
});

socket.on('gameState', (state) => {
    // 检测是否有攻击发生（血量变化）
    if (gameState.A && gameState.B && state.A && state.B) {
        if (gameState.A.hp > state.A.hp && myNumber === 'B') {
            // A 被攻击了，在 A 位置显示特效
            triggerAttackEffect(state.A.x, state.A.y);
        }
        if (gameState.B.hp > state.B.hp && myNumber === 'A') {
            // B 被攻击了，在 B 位置显示特效
            triggerAttackEffect(state.B.x, state.B.y);
        }
    }
    gameState = state;
    updateUI();
    drawCanvas();
});

socket.on('gameOver', (winner) => {
    setTimeout(() => {
        alert(`游戏结束！玩家 ${winner} 胜利！`);
    }, 100);
});

// ========== 攻击特效 ==========
function triggerAttackEffect(x, y) {
    attackEffect = {
        x: x,
        y: y,
        endTime: Date.now() + 200  // 特效持续 200ms
    };
}

// ========== UI 更新 ==========
function updateUI() {
    if (gameState.A) {
        document.getElementById('hpA').innerHTML = `A血量: ${gameState.A.hp} ❤️`;
        document.getElementById('weaponA').innerHTML = `武器: ${gameState.A.weapon === 0 ? '👊 拳套' : '🏹 弓箭'}`;
        document.getElementById('packsA').innerHTML = `血包: ${gameState.A.packs} 💊`;
    }
    if (gameState.B) {
        document.getElementById('hpB').innerHTML = `B血量: ${gameState.B.hp} ❤️`;
        document.getElementById('weaponB').innerHTML = `武器: ${gameState.B.weapon === 0 ? '👊 拳套' : '🏹 弓箭'}`;
        document.getElementById('packsB').innerHTML = `血包: ${gameState.B.packs} 💊`;
    }
}

// ========== 绘制游戏 ==========
function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. 绘制网格背景
    drawGrid();
    
    // 2. 绘制墙壁（如果你有墙的数据）
    drawWalls();
    
    // 3. 绘制攻击特效（在玩家下面但会闪烁，放在这里）
    
    // 4. 绘制玩家 A
    if (gameState.A) {
        drawPlayer(gameState.A.x, gameState.A.y, 'A', '#4ade80', '#22c55e');
    }
    
    // 5. 绘制玩家 B
    if (gameState.B) {
        drawPlayer(gameState.B.x, gameState.B.y, 'B', '#f87171', '#ef4444');
    }
    
    // 6. 绘制攻击特效（在玩家上面）
    if (attackEffect && Date.now() < attackEffect.endTime) {
        drawAttackEffect(attackEffect.x, attackEffect.y);
    } else {
        attackEffect = null;
    }
    
    // 7. 绘制血条
    drawHealthBars();
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= MAP_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i * GRID_SIZE, offsetY);
        ctx.lineTo(offsetX + i * GRID_SIZE, offsetY + MAP_SIZE * GRID_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * GRID_SIZE);
        ctx.lineTo(offsetX + MAP_SIZE * GRID_SIZE, offsetY + i * GRID_SIZE);
        ctx.stroke();
    }
}

// 绘制墙壁（如果你有 map_grid 数据）
function drawWalls() {
    if (!gameState.walls) return;
    ctx.fillStyle = '#8b5a2b';
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (gameState.walls[y] && gameState.walls[y][x] === 1) {
                ctx.fillRect(offsetX + x * GRID_SIZE, offsetY + y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        }
    }
}

// 绘制玩家
function drawPlayer(x, y, label, lightColor, darkColor) {
    // 外发光效果
    ctx.shadowBlur = 10;
    ctx.shadowColor = lightColor;
    
    // 圆形身体
    ctx.beginPath();
    ctx.arc(offsetX + x, offsetY + y, PLAYER_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = lightColor;
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 重置阴影
    ctx.shadowBlur = 0;
    
    // 标签
    ctx.font = `bold ${PLAYER_SIZE}px monospace`;
    ctx.fillStyle = 'white';
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'black';
    ctx.fillText(label, offsetX + x - 6, offsetY + y + 12);
    ctx.shadowBlur = 0;
}

// 绘制攻击特效（爆炸/冲击波）
function drawAttackEffect(x, y) {
    const progress = 1 - (attackEffect.endTime - Date.now()) / 200;  // 0 到 1
    const radius = PLAYER_SIZE + progress * 30;
    ctx.beginPath();
    ctx.arc(offsetX + x, offsetY + y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${1 - progress})`;
    ctx.fill();
    
    // 内圈
    ctx.beginPath();
    ctx.arc(offsetX + x, offsetY + y, radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 0, ${1 - progress})`;
    ctx.fill();
}

// 绘制血条
function drawHealthBars() {
    const hpWidth = 100;
    const hpHeight = 12;
    const spacing = 10;
    
    if (gameState.A) {
        const hpPercent = gameState.A.hp / 250;
        ctx.fillStyle = '#333';
        ctx.fillRect(offsetX, offsetY - 25, hpWidth, hpHeight);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(offsetX, offsetY - 25, hpWidth * hpPercent, hpHeight);
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`A: ${gameState.A.hp}/250`, offsetX + 5, offsetY - 30);
    }
    
    if (gameState.B) {
        const hpPercent = gameState.B.hp / 250;
        ctx.fillStyle = '#333';
        ctx.fillRect(offsetX + 300, offsetY - 25, hpWidth, hpHeight);
        ctx.fillStyle = '#f87171';
        ctx.fillRect(offsetX + 300, offsetY - 25, hpWidth * hpPercent, hpHeight);
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(`B: ${gameState.B.hp}/250`, offsetX + 305, offsetY - 30);
    }
}

// ========== 键盘控制 ==========
document.addEventListener('keydown', (e) => {
    if (!myNumber) return;
    const key = e.key;
    let dx = 0, dy = 0;
    let dir = null;
    
    // 防止页面滚动
    if (['w', 's', 'a', 'd', ' ', 'e', 'r'].includes(key.toLowerCase())) {
        e.preventDefault();
    }
    
    switch(key) {
        case 'w': dy = -GRID_SIZE; dir = 0; break;
        case 's': dy = GRID_SIZE; dir = 1; break;
        case 'a': dx = -GRID_SIZE; dir = 2; break;
        case 'd': dx = GRID_SIZE; dir = 3; break;
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

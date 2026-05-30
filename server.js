const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// 静态文件（如果你把前端放同一个服务器测试用，也可以分开）
app.use(express.static('public'));

// 游戏状态
let players = {};
let playerIds = [];   // 记录连接顺序

io.on('connection', (socket) => {
    console.log('新连接', socket.id);

    // 最多只允许 2 个玩家
    if (playerIds.length >= 2) {
        socket.disconnect();
        return;
    }

    // 分配玩家编号
    const playerNumber = playerIds.length === 0 ? 'A' : 'B';
    playerIds.push(socket.id);
    players[socket.id] = {
        id: socket.id,
        number: playerNumber,
        x: playerNumber === 'A' ? 100 : 300,   // 初始位置不同
        y: 200,
        hp: 250,
        weapon: 0,   // 0=拳套 1=弓箭
        packs: 10,
        lastDir: 3   // 0上 1下 2左 3右
    };

    socket.emit('assign', playerNumber);
    broadcastPlayers();

    // 移动
    socket.on('move', (data) => {
        if (!players[socket.id]) return;
        const player = players[socket.id];
        let { dx, dy, dir } = data;
        let newX = player.x + dx;
        let newY = player.y + dy;
        // 边界限制（简单版，你可以改成 20x20 网格）
        if (newX >= 20 && newX <= 580 && newY >= 20 && newY <= 580) {
            player.x = newX;
            player.y = newY;
            player.lastDir = dir;
        }
        broadcastPlayers();
    });

    // 攻击（空壳，等待你填逻辑）
    socket.on('attack', () => {
      function inMeleeRange(ax, ay, bx, by) {
        const dx = ax - bx;
        const dy = ay - by;
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist < 30;   // 两个圆接触就算近战命中
      }
      bool ranged_attack(int atk_x, int atk_y, int last_dir, int def_x, int def_y) {
        for (int i = 1; i <= BOW_RANGE; i++) {
            int check_x = atk_x, check_y = atk_y;
            switch (last_dir) {
                case 0: check_y -= i; break;
                case 1: check_y += i; break;
                case 2: check_x -= i; break;
                case 3: check_x += i; break;
            }
            if (边界或墙壁) break;
            if (check_x == def_x && check_y == def_y) return true;
        }
        return false;
      }
      const attacker = players[socket.id];
      if (!attacker) return;
      const defenderId = playerIds.find(id => id !== socket.id);
      if (!defenderId) return;
      const defender = players[defenderId];
  
      let hit = false;
      // 近战距离阈值（两个圆半径之和）
      const meleeDist = 30;
      const dist = Math.hypot(attacker.x - defender.x, attacker.y - defender.y);
  
      if (attacker.weapon === 0) {
          // 拳套近战
          if (dist < meleeDist) hit = true;
      } else {
          // 弓箭远程
          const rangePx = 200;  // 相当于你 C++ 里的 BOW_RANGE * 格子尺寸（一格约30px）
          hit = rangedAttack(attacker, defender, rangePx);
      }
  
      if (hit) {
          const damage = attacker.weapon === 0 ? 10 : 20;
          defender.hp -= damage;
          if (defender.hp < 0) defender.hp = 0;
          // 广播胜负（简单处理）
          if (defender.hp <= 0) {
              io.emit('gameOver', `玩家 ${attacker.number} 胜利！`);
          }
      }

        broadcastPlayers();
    });

    socket.on('heal', () => {

      
    });
    socket.on('switchWeapon', () => {
        if (!players[socket.id]) return;
        const player = players[socket.id];
        player.weapon = !player.weapon;
        broadcastPlayers();
    });

    socket.on('disconnect', () => {
        console.log('断开', socket.id);
        playerIds = playerIds.filter(id => id !== socket.id);
        delete players[socket.id];
        broadcastPlayers();
    });
});

function broadcastPlayers() {
    const state = {
        A: null,
        B: null
    };
    for (let id of playerIds) {
        const p = players[id];
        state[p.number] = { x: p.x, y: p.y, hp: p.hp, weapon: p.weapon, packs: p.packs };
    }
    io.emit('gameState', state);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`服务器运行在端口 ${PORT}`));

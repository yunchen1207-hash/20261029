// ------------------------------------------------------------------
// 全局變數宣告 (Global Variables)
// ------------------------------------------------------------------

// 儲存待機精靈圖 (Sprite Sheet) 與走路精靈圖
let imgIdle;
let imgWalk;

// 角色座標位置 (x, y)
let charX;
let charY;

// 角色移動速度 (像素/畫格)
let moveSpeed = 4;

// 角色當前朝向：1 代表朝右，-1 代表朝左 (用於水平翻轉)
let charDirection = 1;

// 角色當前狀態：'idle' 代表待機，'walk' 代表走路
let currentAnim = 'idle';

// 精靈圖參數設定
const idleFrames = 7;      // 待機圖共有 7 張畫格
const idleImgWidth = 618;  // 待機精靈圖總寬度
const idleImgHeight = 190; // 待機精靈圖總高度
const idleFrameWidth = idleImgWidth / idleFrames; // 單張畫格寬度 (約 88.28px)

const walkFrames = 8;      // 走路圖共有 8 張畫格
const walkImgWidth = 1019; // 走路精靈圖總寬度
const walkImgHeight = 195; // 走路精靈圖總高度
const walkFrameWidth = walkImgWidth / walkFrames; // 單張畫格寬度 (約 127.37px)

// 動畫播放控制變數
let currentFrame = 0;      // 當前播放到的畫格索引 (Index)
let frameCounter = 0;      // 用於計數控制動畫播放速度的計數器
let frameDelay = 6;        // 每隔多少幀畫面的時間更新一次精靈圖畫格

// 圖片載入狀態標記
let isIdleLoaded = false;
let isWalkLoaded = false;

// ------------------------------------------------------------------
// p5.js 預載階段 (Preload Phase)
// 在 setup() 執行前預先載入外部資源
// ------------------------------------------------------------------
function preload() {
  // 嘗試載入待機圖片檔案 1/停/停.png
  imgIdle = loadImage('1/停/停.png', 
    () => {
      // 成功載入回呼函式
      isIdleLoaded = true;
      console.log('成功載入 1/停/停.png');
      updateStatusUI('已載入自訂圖片檔案');
    }, 
    () => {
      // 失敗回呼函式：生成向量備用圖檔
      console.warn('無法找到 1/停/停.png，啟用動態繪製待機圖案備用方案');
      imgIdle = createFallbackSpriteSheet(idleImgWidth, idleImgHeight, idleFrames, 'idle');
      isIdleLoaded = true;
      updateStatusUI('使用模擬繪製精靈圖');
    }
  );

  // 嘗試載入走路圖片檔案 1/走路/走路.png
  imgWalk = loadImage('1/走路/走路.png', 
    () => {
      // 成功載入回呼函式
      isWalkLoaded = true;
      console.log('成功載入 1/走路/走路.png');
    }, 
    () => {
      // 失敗回呼函式：生成向量備用圖檔
      console.warn('無法找到 1/走路/走路.png，啟用動態繪製走路圖案備用方案');
      imgWalk = createFallbackSpriteSheet(walkImgWidth, walkImgHeight, walkFrames, 'walk');
      isWalkLoaded = true;
    }
  );
}

// ------------------------------------------------------------------
// p5.js 初始化階段 (Setup Phase)
// 畫布建立與基本屬性設定
// ------------------------------------------------------------------
function setup() {
  // 建立與視窗大小相同的全螢幕畫布
  let canvas = createCanvas(windowWidth, windowHeight);
  // 將畫布放置到指定的 HTML 容器中
  canvas.parent('canvas-container');

  // 設定繪圖模式為中心點對齊 (方便圖片進行縮放與翻轉)
  imageMode(CENTER);

  // 初始化角色位置在畫面正中央
  charX = width / 2;
  charY = height / 2;

  // 設定畫面更新率為 60 FPS
  frameRate(60);
}

// ------------------------------------------------------------------
// p5.js 主要繪製與邏輯循環 (Draw Loop Phase)
// 每秒執行約 60 次
// ------------------------------------------------------------------
function draw() {
  // 1. 設定背景顏色為需求指定色號 #caf0f8
  background('#caf0f8');

  // 繪製地面參考線 (增強空間視覺感)
  stroke('#90e0ef');
  strokeWeight(3);
  line(0, height / 2 + 90, width, height / 2 + 90);

  // 2. 處理使用者輸入邏輯 (鍵盤控制角色移動與狀態)
  handleInput();

  // 3. 更新動畫畫格計數器
  updateAnimationFrame();

  // 4. 繪製角色精靈動畫
  drawCharacter();
}

// ------------------------------------------------------------------
// 輸入處理邏輯 (Input Handling)
// 檢查按鍵並更新角色的位置、朝向與動畫狀態
// ------------------------------------------------------------------
function handleInput() {
  // 預設為待機狀態
  let isMoving = false;

  // 檢查是否按下右箭頭鍵或 'D' 鍵 / 'd' 鍵
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // 68 是 keycode for 'D'
    charX += moveSpeed;          // 角色向右移動
    charDirection = 1;           // 角色面朝右邊
    currentAnim = 'walk';        // 切換至走路動畫
    isMoving = true;
  } 
  // 檢查是否按下左箭頭鍵或 'A' 鍵 / 'a' 鍵
  else if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // 65 是 keycode for 'A'
    charX -= moveSpeed;          // 角色向左移動
    charDirection = -1;          // 角色面朝左邊 (轉向)
    currentAnim = 'walk';        // 切換至走路動畫
    isMoving = true;
  }

  // 若沒有按下任何移動方向鍵，則回復至待機狀態
  if (!isMoving) {
    // 當從走路切換回待機時，重置動畫畫格
    if (currentAnim !== 'idle') {
      currentAnim = 'idle';
      currentFrame = 0;
      frameCounter = 0;
    }
  }

  // 邊界限制：防止角色超出畫面左右兩側
  charX = constrain(charX, 50, width - 50);
}

// ------------------------------------------------------------------
// 動畫幀數計算邏輯 (Animation Frame Control)
// 控制精靈畫格的循環播放速度
// ------------------------------------------------------------------
function updateAnimationFrame() {
  // 計數器累加
  frameCounter++;

  // 當計數器達到設定的延遲時間時，更新至下一畫格
  if (frameCounter >= frameDelay) {
    frameCounter = 0; // 重置計數器

    // 根據當前動畫狀態確定總畫格數
    let totalFrames = (currentAnim === 'idle') ? idleFrames : walkFrames;

    // 畫格索引遞增，並使用模數運算 (%) 實現循環播放
    currentFrame = (currentFrame + 1) % totalFrames;
  }
}

// ------------------------------------------------------------------
// 角色繪製邏輯 (Character Rendering)
// 計算裁切區塊並處理轉向翻轉
// ------------------------------------------------------------------
function drawCharacter() {
  // 儲存目前的繪圖矩陣狀態
  push();

  // 將座標原點平移至角色的當前位置 (charX, charY)
  translate(charX, charY);

  // 處理轉向：透過 scale(charDirection, 1) 進行水平翻轉 (1 為正常，-1 為翻轉)
  scale(charDirection, 1);

  // 根據當前狀態選擇要使用的精靈圖與畫格尺寸
  if (currentAnim === 'idle' && isIdleLoaded) {
    // 計算待機精靈圖中當前畫格的 X 軸像素位置
    let sx = currentFrame * idleFrameWidth;
    let sy = 0;

    // 使用 p5.js image 函數裁切繪製精靈圖畫格
    // 語法: image(img, dx, dy, dWidth, dHeight, sx, sy, sWidth, sHeight)
    image(
      imgIdle, 
      0, 0,                            // 繪製於當前原點 (0, 0)
      idleFrameWidth, idleImgHeight,    // 畫面上顯示的大小
      sx, sy,                          // 精靈圖裁切起始點
      idleFrameWidth, idleImgHeight     // 裁切的寬高
    );

  } else if (currentAnim === 'walk' && isWalkLoaded) {
    // 計算走路精靈圖中當前畫格的 X 軸像素位置
    let sx = currentFrame * walkFrameWidth;
    let sy = 0;

    // 繪製走路畫格
    image(
      imgWalk, 
      0, 0,                            // 繪製於當前原點 (0, 0)
      walkFrameWidth, walkImgHeight,    // 畫面上顯示的大小
      sx, sy,                          // 精靈圖裁切起始點
      walkFrameWidth, walkImgHeight     // 裁切的寬高
    );
  }

  // 恢復原先的繪圖矩陣狀態
  pop();
}

// ------------------------------------------------------------------
// 視窗大小改變監聽 (Window Resize Handler)
// 當瀏覽器大小改變時自動調整畫布大小
// ------------------------------------------------------------------
function windowResized() {
  // 重設畫布寬高為新的視窗大小
  resizeCanvas(windowWidth, windowHeight);
  // 保持角色在縱向中央
  charY = height / 2;
}

// ------------------------------------------------------------------
// UI 狀態更新選用函式
// ------------------------------------------------------------------
function updateStatusUI(text) {
  let el = document.getElementById('status-tag');
  if (el) el.innerText = '圖片狀態：' + text;
}

// ------------------------------------------------------------------
// 備用機制：動態生成精靈圖 (Fallback Sprite Sheet Generator)
// 當無法讀取外部圖片時，使用 p5 Graphics 自動畫出高質感的動畫圖集
// ------------------------------------------------------------------
function createFallbackSpriteSheet(totalWidth, totalHeight, frames, type) {
  // 建立離線繪圖畫布 (Graphics Object)
  let pg = createGraphics(totalWidth, totalHeight);
  let frameW = totalWidth / frames;

  pg.noStroke();

  for (let i = 0; i < frames; i++) {
    // 計算單個畫格的中心 X 座標
    let cx = i * frameW + frameW / 2;
    let cy = totalHeight / 2 + 10;

    if (type === 'idle') {
      // 繪製待機動畫 (浮動上下微張動作)
      let offsetY = Math.sin((i / frames) * Math.PI * 2) * 5;

      // 影子
      pg.fill(0, 0, 0, 30);
      pg.ellipse(cx, cy + 60, 50, 14);

      // 身體
      pg.fill('#0077b6');
      pg.ellipse(cx, cy + offsetY, 50, 70);

      // 眼睛
      pg.fill(255);
      pg.ellipse(cx + 12, cy - 10 + offsetY, 16, 20);
      pg.fill(0);
      pg.ellipse(cx + 15, cy - 10 + offsetY, 6, 8);

      // 帽子/裝飾
      pg.fill('#00b4d8');
      pg.rect(cx - 20, cy - 45 + offsetY, 40, 12, 6);

    } else if (type === 'walk') {
      // 繪製走路動畫 (腿部擺動與晃動動作)
      let legAngle = Math.sin((i / frames) * Math.PI * 2) * 20;
      let offsetY = Math.abs(Math.sin((i / frames) * Math.PI * 2)) * -8;

      // 影子
      pg.fill(0, 0, 0, 30);
      pg.ellipse(cx, cy + 60, 45, 12);

      // 後腿
      pg.stroke('#005f73');
      pg.strokeWeight(10);
      pg.line(cx, cy + 20 + offsetY, cx - legAngle, cy + 55 + offsetY);

      // 前腿
      pg.stroke('#0a9396');
      pg.line(cx, cy + 20 + offsetY, cx + legAngle, cy + 55 + offsetY);

      pg.noStroke();
      // 身體
      pg.fill('#0077b6');
      pg.ellipse(cx, cy + offsetY, 52, 68);

      // 眼睛
      pg.fill(255);
      pg.ellipse(cx + 14, cy - 10 + offsetY, 16, 20);
      pg.fill(0);
      pg.ellipse(cx + 17, cy - 10 + offsetY, 6, 8);

      // 帽子
      pg.fill('#90e0ef');
      pg.rect(cx - 18, cy - 45 + offsetY, 40, 12, 6);
    }
  }

  // 回傳生成好的離線圖像作為 Sprite Sheet
  return pg;
}
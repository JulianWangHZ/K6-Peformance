# K6 Conduit 效能測試

[English](README.md) | [中文](README_zh.md)

這是一個使用 K6 對 [Conduit 開源討論平台](https://demo.realworld.show/#/) 進行效能測試的專案，包含負載測試、尖峰測試和壓力測試。

## 專案概述

Conduit 是一個開源的社群討論平台，提供文章發布、評論、用戶管理等功能。本專案針對該平台進行全面的效能測試，確保系統在不同負載條件下的稳定性和效能表現。

## 測試環境

- **開發環境**: https://node-express-conduit.appspot.com/api
- **測試環境**: https://api.realworld.show/api/

## 測試類型

### 1. 負載測試 (Load Test)
- **檔案**: `test_scripts/conduit_load_test.js`
- **目的**: 測試系統在正常預期負載下的效能表現
- **配置**: 10 個虛擬用戶，持續 10 分鐘

### 2. 尖峰測試 (Spike Test)
- **檔案**: `test_scripts/conduit_spike_test.js`
- **目的**: 測試系統在短時間內負載急劇增加時的表現
- **配置**: 模擬流量突增情況

### 3. 壓力測試 (Stress Test)
- **檔案**: `test_scripts/conduit_stress_test.js`
- **目的**: 測試系統在超出正常負載條件下的極限表現
- **配置**: 逐步增加負載直到系統達到極限

## 效能指標

- **響應時間**: 95% 的請求應在 1 秒內完成
- **錯誤率**: 應低於 1%
- **檢查通過率**: 應高於 99%

## 安裝與使用

### 前置需求

- Node.js (建議版本 16 或以上)
- K6 (建議版本 0.40 或以上)

### 安裝 K6

#### macOS (使用 Homebrew)
```bash
brew install k6
```

#### Windows (使用 Chocolatey)
```bash
choco install k6
```

#### Linux
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 安裝專案依賴

```bash
npm install
```

### 環境配置

創建 `.env.local` 檔案來自定義您的測試環境：

```bash
# 複製範例檔案
cp .env.local.example .env.local
```

編輯 `.env.local` 檔案以設定您的偏好：

```env
# 測試環境選擇
ENV=staging

# API 配置 (可選 - 可覆蓋 environments.js 中的預設值)
DEV_BASE_URL=https://node-express-conduit.appspot.com/api
STAGE_BASE_URL=https://api.realworld.show/api/

# 測試配置 (可選 - 可覆蓋 environments.js 中的預設值)
DEFAULT_TIMEOUT=3s
DEFAULT_THINK_TIME=1s
DEFAULT_USERS=10
DEFAULT_DURATION=10min

# 效能閾值 (可選 - 可覆蓋 environments.js 中的預設值)
RESPONSE_TIME_THRESHOLD=1000
ERROR_RATE_THRESHOLD=0.01
CHECK_PASS_RATE_THRESHOLD=0.99
```

### 執行測試

#### 執行所有測試
```bash
npm run test:all
```

#### 執行特定測試
```bash
# 負載測試
npm run test:load

# 尖峰測試
npm run test:spike

# 壓力測試
npm run test:stress
```

#### 使用不同環境
```bash
# 使用開發環境
npm run test:load:dev

# 使用測試環境
npm run test:load:stage
```

#### 使用環境變數
```bash
# 使用 .env.local 檔案配合 npm 腳本
npm run test:load:env
npm run test:spike:env
npm run test:stress:env
npm run test:all:env

# 或直接使用特定的環境變數
DEFAULT_USERS=20 npm run test:load
DEFAULT_USERS=50 DEFAULT_DURATION=5min npm run test:stress
```

## 專案結構

```
K6-Peformance/
├── config/
│   └── environments.js          # 環境配置
├── test_data/
│   └── demo_data.json          # 測試資料
├── test_scripts/
│   ├── conduit_load_test.js    # 負載測試腳本
│   ├── conduit_spike_test.js   # 尖峰測試腳本
│   └── conduit_stress_test.js  # 壓力測試腳本
├── .env.local.example          # 環境變數範例
├── .env.local                  # 本地環境變數 (需自行創建)
├── package.json                # 專案依賴和腳本
└── README.md                   # 專案說明文件
```

## 配置說明

### 環境配置 (`config/environments.js`)

所有配置都集中在 `config/environments.js` 中，並支援環境變數：

**預設配置：**
- **開發環境**: `https://node-express-conduit.appspot.com/api`
- **測試環境**: `https://api.realworld.show/api/`
- **預設超時時間**: 3s
- **預設思考時間**: 1s
- **預設用戶數**: 10
- **預設持續時間**: 10min

**環境變數 (透過 `.env.local` - 全部為可選)：**
- `ENV`: 選擇環境 (dev/stage)
- `DEV_BASE_URL`: 覆蓋開發環境 API URL
- `STAGE_BASE_URL`: 覆蓋測試環境 API URL
- `DEFAULT_TIMEOUT`: 覆蓋預設請求超時時間
- `DEFAULT_THINK_TIME`: 覆蓋預設用戶思考時間
- `DEFAULT_USERS`: 覆蓋預設虛擬用戶數量
- `DEFAULT_DURATION`: 覆蓋預設測試持續時間
- `RESPONSE_TIME_THRESHOLD`: 覆蓋響應時間閾值 (預設: 1000ms)
- `ERROR_RATE_THRESHOLD`: 覆蓋錯誤率閾值 (預設: 0.01)
- `CHECK_PASS_RATE_THRESHOLD`: 覆蓋檢查通過率閾值 (預設: 0.99)

### 使用環境變數

1. **創建 `.env.local` 檔案：**
   ```bash
   cp .env.local.example .env.local
   ```

2. **編輯您的配置：**
   ```env
   ENV=staging
   DEFAULT_USERS=20
   DEFAULT_DURATION=5min
   ```

3. **使用環境變數執行測試：**
   ```bash
   # 使用 npm 腳本 (推薦)
   npm run test:load:env
   
   # 或直接使用環境變數
   DEFAULT_USERS=20 npm run test:load
   ```

### 效能閾值

效能閾值定義在 `config/environments.js` 中，可透過環境變數自定義：

- `http_req_duration`: HTTP 請求持續時間閾值 (95 百分位數)
- `http_req_failed`: HTTP 請求失敗率閾值
- `checks`: 檢查通過率閾值

**預設值：**
- 響應時間: 1000ms (95 百分位數)
- 錯誤率: 1%
- 檢查通過率: 99%

**透過環境變數覆蓋：**
```bash
RESPONSE_TIME_THRESHOLD=500 ERROR_RATE_THRESHOLD=0.005 k6 run test_scripts/conduit_load_test.js
```

## 測試報告

執行測試後，K6 會生成詳細的效能報告，包括：
- 請求統計
- 響應時間分佈
- 錯誤率分析
- 系統資源使用情況

## 注意事項

1. 請確保在執行測試前，目標環境是可訪問的
2. 建議在非生產環境進行測試
3. 根據實際需求調整測試參數
4. 監控目標系統的資源使用情況

## 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個專案。

## 授權

MIT License

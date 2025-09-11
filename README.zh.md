# K6 DummyJSON 效能測試

[English](README.md) | [中文](README.zh.md)

這是一個使用 K6 對 [DummyJSON API](https://dummyjson.com/) 進行效能測試的專案，包含負載測試、尖峰測試和壓力測試。

## 專案概述

DummyJSON 是一個免費的 REST API，提供用於測試和原型設計的假數據。本專案針對 DummyJSON API 進行全面的效能測試，包括用戶認證、文章創建、評論和點讚功能，確保系統在不同負載條件下的稳定性和效能表現。

![效能演示](assets/performance_demo.gif)

## 測試環境

- **開發環境**: https://dummyjson.com
- **測試環境**: https://dummyjson.com

## 測試類型

### 1. 負載測試 (Load Test)
- **檔案**: `test_scripts/conduit_load_test.js`
- **目的**: 測試 DummyJSON API 在正常預期負載下的效能表現
- **配置**: 200 個虛擬用戶（分散到不同場景），持續 10.5 分鐘
- **場景**: 用戶登入、文章創建、評論和點讚

#### 測試執行時間軸
```
時間軸: 0s -------- 30s -------- 1m -------- 7m -------- 10.5m
       |           |            |            |            |
Creators:  [創建內容階段] (0-7分鐘)
Consumers:           [瀏覽+評論階段] (30秒-10分鐘)  
Favoriters:                    [點讚階段] (1分鐘-10.5分鐘)
```

**場景詳情：**
- **Creators**: 2-20 個 VU，創建文章和內容
- **Consumers**: 35-140 個 VU，瀏覽和評論現有文章
- **Favoriters**: 10-40 個 VU，點讚和與文章互動

### 2. 尖峰測試 (Spike Test)
- **檔案**: `test_scripts/conduit_spike_test.js`
- **目的**: 測試 DummyJSON API 在短時間內負載急劇增加時的表現
- **配置**: 模擬流量突增情況，快速增加用戶數

### 3. 壓力測試 (Stress Test)
- **檔案**: `test_scripts/conduit_stress_test.js`
- **目的**: 測試 DummyJSON API 在超出正常負載條件下的極限表現
- **配置**: 逐步增加負載直到系統達到極限

## 效能指標

- **響應時間**: 95% 的請求應在 500ms 內完成（DummyJSON 通常更快）
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

專案預設配置為使用 DummyJSON API。所有配置都集中在 `config/environments.js` 中，不需要額外的環境檔案。

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

#### 使用不同環境
```bash
# 使用開發環境 (與測試環境相同，都是 DummyJSON)
npm run test:load:dev

# 使用測試環境 (預設)
npm run test:load:stage
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
├── package.json                # 專案依賴和腳本
└── README.md                   # 專案說明文件
```

## 配置說明

### 環境配置 (`config/environments.js`)

所有配置都集中在 `config/environments.js` 中：

**預設配置：**
- **API URL**: `https://dummyjson.com` (開發和測試環境相同)
- **超時時間**: 3s
- **思考時間**: 1s
- **用戶數**: 200 個虛擬用戶
- **持續時間**: 10.5min

**效能閾值：**
- 響應時間: 500ms (95 百分位數) - 針對 DummyJSON API 優化
- 錯誤率: 1%
- 檢查通過率: 99%

### 自定義配置

要修改測試參數，直接編輯 `config/environments.js`：

```javascript
export const environments = {
    dev: {
        baseUrl: "https://dummyjson.com",
        timeout: "3s",
        thinkTime: "1s",
        users: 200,        // 在這裡修改用戶數量
        duration: "10min"  // 在這裡修改測試持續時間
    }
}
```


## 測試報告

執行測試後，K6 會生成詳細的效能報告，包括：
- 請求統計
- 響應時間分佈
- 錯誤率分析
- 系統資源使用情況
- 自動在 `results/` 目錄中生成 HTML 報告

## 注意事項

1. DummyJSON 是免費的 API 服務 - 基本測試不需要認證
2. 測試使用預設的文章 ID（1-10）進行評論和點讚場景
3. 用戶認證使用固定憑證（emilys/emilyspass）以保持一致性
4. 根據實際需求調整測試參數
5. 監控 API 速率限制和響應時間

## 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個專案。

## 授權

MIT License

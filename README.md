# K6 DummyJSON Performance Testing

[English](README.md) | [中文](README.zh.md)

A comprehensive performance testing project using K6 for the [DummyJSON API](https://dummyjson.com/), including load testing, spike testing, and stress testing.

## Project Overview

DummyJSON is a free REST API that provides fake data for testing and prototyping. This project conducts comprehensive performance testing on the DummyJSON API to test system stability and performance under various load conditions, including user authentication, post creation, commenting, and liking functionality.

![Performance Demo](assets/performance_demo.gif)

## Test Environments

- **Development Environment**: https://dummyjson.com
- **Staging Environment**: https://dummyjson.com

## Test Types

### 1. Load Testing
- **File**: `test_scripts/conduit_load_test.js`
- **Purpose**: Test DummyJSON API performance under normal expected load
- **Configuration**: 200 virtual users (distributed across scenarios), 10.5 minutes duration
- **Scenarios**: User login, post creation, commenting, and liking

#### Test Execution Timeline
```
Timeline: 0s -------- 30s -------- 1m -------- 7m -------- 10.5m
          |           |            |            |            |
Creators:  [Content Creation Phase] (0-7 minutes)
Consumers:           [Browse+Comment Phase] (30s-10 minutes)  
Favoriters:                    [Like Phase] (1m-10.5 minutes)
```

**Scenario Details:**
- **Creators**: 2-20 VUs, create posts and content
- **Consumers**: 35-140 VUs, browse and comment on existing posts
- **Favoriters**: 10-40 VUs, like and interact with posts

### 2. Spike Testing
- **File**: `test_scripts/conduit_spike_test.js`
- **Purpose**: Test DummyJSON API behavior when load increases dramatically in a short time
- **Configuration**: Simulates traffic spikes with rapid user increase (20 → 200 → 300 VUs)
- **Duration**: 10.5 minutes with multiple spike patterns
- **Scenarios**: Mixed workload (30% creators, 40% consumers, 30% favoriters)

#### Spike Test Timeline
```
Timeline: 0m → 2m → 3m → 5m → 5.5m → 7.5m → 8.5m → 9.5m → 10.5m
VUs:     0  → 20  → 200 → 200 → 20   → 20   → 300  → 300  → 0
Phase:   Start → Normal → Spike1 → Sustain → Drop → Recovery → Spike2 → Sustain → End
```

### 3. Stress Testing
- **File**: `test_scripts/conduit_stress_test.js`
- **Purpose**: Test DummyJSON API limits under conditions beyond normal load
- **Configuration**: Gradually increase load until system reaches its limit (50 → 200 → 500 → 800 → 1100 → 1300 VUs)
- **Duration**: 30 minutes with progressive load increase
- **Scenarios**: Adaptive workload based on stress level

#### Stress Test Timeline
```
Timeline: 0m → 2m → 5m → 7m → 10m → 12m → 15m → 17m → 20m → 22m → 25m → 27m → 30m
VUs:     0  → 50  → 200 → 200 → 500 → 500 → 800 → 800 → 1100 → 1100 → 1300 → 1300 → 0
Phase:   Start → Warm → Normal → Steady → Stress1 → Steady → Stress2 → Steady → Stress3 → Steady → Peak → Steady → End
```

## Performance Metrics

- **Response Time**: 95% of requests should complete within 500ms (DummyJSON is typically faster)
- **Error Rate**: Should be less than 1%
- **Check Pass Rate**: Should be higher than 99%

## Installation & Usage

### Prerequisites

- Node.js (recommended version 16 or above)
- K6 (recommended version 0.40 or above)

### Installing K6

#### macOS (using Homebrew)
```bash
brew install k6
```

#### Windows (using Chocolatey)
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

### Installing Project Dependencies

```bash
npm install
```

### Environment Configuration

The project is configured to use DummyJSON API by default. All configuration is centralized in `config/environments.js` and no additional environment files are needed.

### Running Tests

#### Run All Tests
```bash
npm run test:all
```

#### Run Specific Tests
```bash
# Load testing
npm run test:load

# Spike testing
npm run test:spike

# Stress testing
npm run test:stress
```

#### Using Different Environments
```bash
# Using development environment
npm run test:load:dev

# Using staging environment
npm run test:load:stage
```

#### Using Different Environments
```bash
# Using development environment (same as staging for DummyJSON)
npm run test:load:dev

# Using staging environment (default)
npm run test:load:stage
```

## Project Structure

```
K6-Peformance/
├── config/
│   └── environments.js          # Environment configuration
├── test_data/
│   └── demo_data.json          # Test data
├── test_scripts/
│   ├── conduit_load_test.js    # Load test script
│   ├── conduit_spike_test.js   # Spike test script
│   └── conduit_stress_test.js  # Stress test script
├── package.json                # Project dependencies and scripts
└── README.md                   # Project documentation
```

## Configuration

### Environment Configuration (`config/environments.js`)

All configuration is centralized in `config/environments.js`:

**Default Configuration:**
- **API URL**: `https://dummyjson.com` (both dev and stage)
- **Timeout**: 3s
- **Think Time**: 1s
- **Users**: 200 virtual users
- **Duration**: 10.5min

**Performance Thresholds:**
- Response time: 500ms (95th percentile) - optimized for DummyJSON API
- Error rate: 1%
- Check pass rate: 99%

### Customizing Configuration

To modify test parameters, edit `config/environments.js` directly:

```javascript
export const environments = {
    dev: {
        baseUrl: "https://dummyjson.com",
        timeout: "3s",
        thinkTime: "1s",
        users: 200,        // Change number of users here
        duration: "10min"  // Change test duration here
    }
}
```

## Test Reports

After running tests, K6 generates detailed performance reports including:
- Request statistics
- Response time distribution
- Error rate analysis
- System resource usage
- HTML report generated automatically in `results/` directory

## Important Notes

1. DummyJSON is a free API service - no authentication required for basic testing
2. Tests use predefined post IDs (1-10) for commenting and liking scenarios
3. User authentication uses fixed credentials (emilys/emilyspass) for consistency
4. Adjust test parameters according to actual requirements
5. Monitor API rate limits and response times during testing


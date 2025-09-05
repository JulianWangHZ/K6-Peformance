# K6 Conduit Performance Testing

English | [繁體中文](README_ZH.md)

A comprehensive performance testing project using K6 for the [Conduit Open Source Discussion Platform](https://demo.realworld.show/#/), including load testing, spike testing, and stress testing.

## Project Overview

Conduit is an open-source community discussion platform that provides article publishing, commenting, and user management features. This project conducts comprehensive performance testing on the platform to ensure system stability and performance under various load conditions.

## Test Environments

- **Development Environment**: https://node-express-conduit.appspot.com/api
- **Staging Environment**: https://api.realworld.show/api/

## Test Types

### 1. Load Testing
- **File**: `test_scripts/conduit_load_test.js`
- **Purpose**: Test system performance under normal expected load
- **Configuration**: 10 virtual users, 10 minutes duration

### 2. Spike Testing
- **File**: `test_scripts/conduit_spike_test.js`
- **Purpose**: Test system behavior when load increases dramatically in a short time
- **Configuration**: Simulates traffic spikes

### 3. Stress Testing
- **File**: `test_scripts/conduit_stress_test.js`
- **Purpose**: Test system limits under conditions beyond normal load
- **Configuration**: Gradually increase load until system reaches its limit

## Performance Metrics

- **Response Time**: 95% of requests should complete within 1 second
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

Create a `.env.local` file to customize your test environment:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` with your preferred settings:

```env
# Test Environment Selection
ENV=staging

# API Configuration (optional - can override defaults in environments.js)
DEV_BASE_URL=https://node-express-conduit.appspot.com/api
STAGE_BASE_URL=https://api.realworld.show/api/

# Test Configuration (optional - can override defaults in environments.js)
DEFAULT_TIMEOUT=3s
DEFAULT_THINK_TIME=1s
DEFAULT_USERS=10
DEFAULT_DURATION=10min

# Performance Thresholds (optional - can override defaults in environments.js)
RESPONSE_TIME_THRESHOLD=1000
ERROR_RATE_THRESHOLD=0.01
CHECK_PASS_RATE_THRESHOLD=0.99
```

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

#### Using Environment Variables
```bash
# Use .env.local file with npm scripts
npm run test:load:env
npm run test:spike:env
npm run test:stress:env
npm run test:all:env

# Or use specific environment variables directly
DEFAULT_USERS=20 npm run test:load
DEFAULT_USERS=50 DEFAULT_DURATION=5min npm run test:stress
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
├── .env.local.example          # Environment variables example
├── .env.local                  # Local environment variables (create this)
├── package.json                # Project dependencies and scripts
└── README.md                   # Project documentation
```

## Configuration

### Environment Configuration (`config/environments.js`)

All configuration is centralized in `config/environments.js` with environment variable support:

**Default Configuration:**
- **Dev Environment**: `https://node-express-conduit.appspot.com/api`
- **Stage Environment**: `https://api.realworld.show/api/`
- **Default Timeout**: 3s
- **Default Think Time**: 1s
- **Default Users**: 10
- **Default Duration**: 10min

**Environment Variables (via `.env.local` - all optional):**
- `ENV`: Select environment (dev/stage)
- `DEV_BASE_URL`: Override development API URL
- `STAGE_BASE_URL`: Override staging API URL
- `DEFAULT_TIMEOUT`: Override default request timeout
- `DEFAULT_THINK_TIME`: Override default user think time
- `DEFAULT_USERS`: Override default number of virtual users
- `DEFAULT_DURATION`: Override default test duration
- `RESPONSE_TIME_THRESHOLD`: Override response time threshold (default: 1000ms)
- `ERROR_RATE_THRESHOLD`: Override error rate threshold (default: 0.01)
- `CHECK_PASS_RATE_THRESHOLD`: Override check pass rate threshold (default: 0.99)

### Using Environment Variables

1. **Create `.env.local` file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit your configuration:**
   ```env
   ENV=staging
   DEFAULT_USERS=20
   DEFAULT_DURATION=5min
   ```

3. **Run tests with environment variables:**
   ```bash
   # Using npm scripts (recommended)
   npm run test:load:env
   
   # Or directly with environment variables
   DEFAULT_USERS=20 npm run test:load
   ```

### Performance Thresholds

Performance thresholds are defined in `config/environments.js` and can be customized via environment variables:

- `http_req_duration`: HTTP request duration threshold (95th percentile)
- `http_req_failed`: HTTP request failure rate threshold
- `checks`: Check pass rate threshold

**Default Values:**
- Response time: 1000ms (95th percentile)
- Error rate: 1%
- Check pass rate: 99%

**Override via Environment Variables:**
```bash
RESPONSE_TIME_THRESHOLD=500 ERROR_RATE_THRESHOLD=0.005 k6 run test_scripts/conduit_load_test.js
```

## Test Reports

After running tests, K6 generates detailed performance reports including:
- Request statistics
- Response time distribution
- Error rate analysis
- System resource usage

## Important Notes

1. Ensure the target environment is accessible before running tests
2. Recommend testing in non-production environments
3. Adjust test parameters according to actual requirements
4. Monitor target system resource usage


// Load environment variables with fallback to defaults
const getEnvConfig = () => {
    return {
        devBaseUrl: __ENV.DEV_BASE_URL || "https://node-express-conduit.appspot.com/api",
        stageBaseUrl: __ENV.STAGE_BASE_URL || "https://api.realworld.show/api/",
        defaultTimeout: __ENV.DEFAULT_TIMEOUT || "3s",
        defaultThinkTime: __ENV.DEFAULT_THINK_TIME || "1s",
        defaultUsers: parseInt(__ENV.DEFAULT_USERS) || 10,
        defaultDuration: __ENV.DEFAULT_DURATION || "10min"
    };
};

const envConfig = getEnvConfig();

export const environments = {
    dev: {
        baseUrl: envConfig.devBaseUrl,
        timeout: envConfig.defaultTimeout,
        thinkTime: envConfig.defaultThinkTime,
        users: envConfig.defaultUsers,
        duration: envConfig.defaultDuration
    },
    stage: {
        baseUrl: envConfig.stageBaseUrl,
        timeout: envConfig.defaultTimeout,
        thinkTime: envConfig.defaultThinkTime,
        users: envConfig.defaultUsers,
        duration: envConfig.defaultDuration
    }
}

// Performance thresholds with environment variable support
const getThresholds = () => {
    const responseTimeThreshold = parseInt(__ENV.RESPONSE_TIME_THRESHOLD) || 1000;
    const errorRateThreshold = parseFloat(__ENV.ERROR_RATE_THRESHOLD) || 0.01;
    const checkPassRateThreshold = parseFloat(__ENV.CHECK_PASS_RATE_THRESHOLD) || 0.99;
    
    return {
        http_req_duration: [`p(95)<${responseTimeThreshold}`], // 95% of requests should complete within threshold
        http_req_failed: [`rate<${errorRateThreshold}`], // error rate should be less than threshold
        checks: [`rate<${1 - checkPassRateThreshold}`], // check pass rate should be higher than threshold
        // Additional thresholds can be added here
        // http_reqs: ["rate>10"], // at least 10 requests per second
        // iterations: ["count>1000"], // at least 1000 iterations
    };
};

export const thresholds = getThresholds();
  
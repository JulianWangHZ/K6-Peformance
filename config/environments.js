// DummyJSON API configuration
export const environments = {
    dev: {
        baseUrl: "https://dummyjson.com",
        timeout: "3s",
        thinkTime: "1s",
        users: 200,
        duration: "10min"
    },
    stage: {
        baseUrl: "https://dummyjson.com",
        timeout: "3s",
        thinkTime: "1s",
        users: 200,
        duration: "10min"
    }
}

// Performance thresholds optimized for DummyJSON API
export const thresholds = {
    http_req_duration: ['p(95)<500'], // 95% of requests should complete within 500ms
    http_req_failed: ['rate<0.01'], // error rate should be less than 1%
    checks: ['rate<0.01'], // check pass rate should be higher than 99%
    // Additional thresholds can be added here
    // http_reqs: ["rate>10"], // at least 10 requests per second
    // iterations: ["count>1000"], // at least 1000 iterations
};
  
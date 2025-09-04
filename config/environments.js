export const environments = {
    staging: {
        baseUrl: "https://node-express-conduit.appspot.com/api",
        timeout: "3s",
        thinkTime: "1s",
        users: 10,
        duration: "10min"
    },
}

// Performance thresholds
export const thresholds = {
    http_req_duration: ["p(95)<2000"], // 95% of requests should complete within 2 seconds
    http_req_failed: ["rate<0.01"], // error rate should be less than 1%
    // http_reqs: ["rate>10"], // at least 10 requests per second
    // iterations: ["count>1000"], // at least 1000 iterations
    checks: ["rate<0.01"], // error rate should be less than 1%
  };
  
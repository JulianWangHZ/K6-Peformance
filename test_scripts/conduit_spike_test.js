import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { environments, thresholds } from '../config/environments.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

function sleepJitter(minSeconds = 1, maxSeconds = 3) {
    const randomSeconds = Math.random() * (maxSeconds - minSeconds) + minSeconds;
    sleep(randomSeconds);
}

function retryOperation(operation, maxRetries = 3, operationName = 'operation') {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = operation();
            if (result !== false) {
                return result;
            }
        } catch (error) {
            console.log(`${operationName} attempt ${attempt} failed: ${error.message}`);
        }
        
        if (attempt < maxRetries) {
            const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            sleep(backoffTime / 1000);
        }
    }
    
    console.log(`${operationName} failed after ${maxRetries} attempts`);
    return false;
}

// custom metrics
const articleCreationRate = new Rate('article_creation_success');
const commentCreationRate = new Rate('comment_creation_success');
const favoriteRate = new Rate('favorite_success');
const registerRate = new Rate('register_success');

const articleCreationTime = new Trend('article_creation_time');
const commentCreationTime = new Trend('comment_creation_time');
const favoriteTime = new Trend('favorite_time');
const registerTime = new Trend('register_time');

const articlesCreated = new Counter('articles_created');
const commentsCreated = new Counter('comments_created');
const favoritesGiven = new Counter('favorites_given');

// load test data
const postData = new SharedArray('posts', function () {
    return JSON.parse(open('../test_data/article_content.json')).posts;
});

const commentData = new SharedArray('comments', function () {
    return JSON.parse(open('../test_data/comments.json')).comments;
});

const config = environments.stage;

export const options = {
    scenarios: {
        // sudden traffic increase
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                // Normal load - 2 minutes
                { duration: '2m', target: 20 },
                // Sudden spike - 1 minute (10x increase)
                { duration: '1m', target: 200 },
                // Sustained high load - 2 minutes
                { duration: '2m', target: 200 },
                // Sudden drop - 30 seconds
                { duration: '30s', target: 20 },
                // Recovery period - 2 minutes
                { duration: '2m', target: 20 },
                // Second spike - 1 minute (15x increase)
                { duration: '1m', target: 300 },
                // Sustained high load - 1 minute
                { duration: '1m', target: 300 },
                // Gradual ramp down - 1 minute
                { duration: '1m', target: 0 }
            ],
            exec: 'spikeScenario',
            tags: { scenario: 'spike' }
        }
    },
    
    thresholds: {
        ...thresholds,
        'register_success': ['rate>0.80'], // Lower threshold for spike test
        'article_creation_success': ['rate>0.70'], // Lower threshold for spike test
        'comment_creation_success': ['rate>0.75'], // Lower threshold for spike test
        'favorite_success': ['rate>0.75'], // Lower threshold for spike test
        'article_creation_time': ['p(95)<3000'], // Higher threshold for spike test
        'comment_creation_time': ['p(95)<2500'], // Higher threshold for spike test
        'favorite_time': ['p(95)<2000'], // Higher threshold for spike test
        'register_time': ['p(95)<1000'], // Higher threshold for spike test
        'http_req_failed': ['rate<0.40'] // Allow higher failure rate during spikes
    }
};

let authToken = '';
let availableArticles = [];

// Helper function for random number generation
function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// user login
function login() {
    return retryOperation(() => {
        const loginPayload = {
            username: 'emilys',
            password: 'emilyspass',
            expiresInMins: 30
        };

        const params = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        };

        const startTime = Date.now();
        const response = http.post(`${config.baseUrl}/auth/login`, JSON.stringify(loginPayload), params);
        const endTime = Date.now();

        const success = check(response, { 
            'login status is 200': (r) => r.status === 200,
            'login response has token': (r) => r.json('accessToken') !== undefined,
            'login response has user data': (r) => r.json('id') !== undefined
        });

        if (!success) {
            console.log(`VU${__VU} Login failed - Status: ${response.status}, Response: ${response.body}`);
            registerRate.add(false);
            registerTime.add(endTime - startTime);
            return false;
        } else {
            console.log(`VU${__VU} Login successful - User ID: ${response.json('id')}`);
        }

        registerRate.add(true);
        registerTime.add(endTime - startTime);
        authToken = response.json('accessToken');
        return true;
    }, 3, 'login');
}

// create post
function createPost() {
    return retryOperation(() => {
        const randomPost = postData[Math.floor(Math.random() * postData.length)];
        
        const postPayload = {
            title: `K6 Spike Test Post - ${randomPost.title} - ${Date.now()}`,
            body: randomPost.body,
            userId: 1
        };

        const params = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        };

        const startTime = Date.now();
        const response = http.post(`${config.baseUrl}/posts/add`, JSON.stringify(postPayload), params);
        const endTime = Date.now();

        const success = check(response, {
            'create post status is 200 or 201': (r) => r.status === 200 || r.status === 201,
            'create post has id': (r) => r.json('id') !== undefined,
            'create post has title': (r) => r.json('title') !== undefined
        });

        if (!success) {
            console.log(`VU${__VU} Create post failed - Status: ${response.status}, Response: ${response.body}`);
            articleCreationRate.add(false);
            articleCreationTime.add(endTime - startTime);
            return false;
        }

        articleCreationRate.add(true);
        articleCreationTime.add(endTime - startTime);

        const postId = response.json('id');
        articlesCreated.add(1);
        availableArticles.push(postId);
        console.log(`VU${__VU} created post: ${postId}, Total posts: ${availableArticles.length}`);
        return postId;
    }, 3, 'createPost');
}

// create comment
function createComment(postId) {
    return retryOperation(() => {
        const randomComment = commentData[Math.floor(Math.random() * commentData.length)];
        
        const commentPayload = {
            body: randomComment.body,
            postId: postId,
            userId: 1
        };

        const params = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        };

        const startTime = Date.now();
        const response = http.post(`${config.baseUrl}/comments/add`, JSON.stringify(commentPayload), params);
        const endTime = Date.now();

        const success = check(response, {
            'create comment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
            'create comment has body': (r) => r.json('body') !== undefined,
            'create comment has id': (r) => r.json('id') !== undefined
        });

        if (!success) {
            console.log(`VU${__VU} Create comment failed - Status: ${response.status}, Response: ${response.body}`);
            commentCreationRate.add(false);
            commentCreationTime.add(endTime - startTime);
            return false;
        }

        commentCreationRate.add(true);
        commentCreationTime.add(endTime - startTime);
        commentsCreated.add(1);
        return true;
    }, 3, 'createComment');
}

// like post
function likePost(postId) {
    return retryOperation(() => {
        const likePayload = {
            reactions: { 
                likes: randomIntBetween(1, 30), 
                dislikes: 0 
            }
        };

        const params = {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: config.timeout
        };

        const startTime = Date.now();
        const response = http.put(`${config.baseUrl}/posts/${postId}`, JSON.stringify(likePayload), params);
        const endTime = Date.now();

        const success = check(response, {
            'like post status is 200': (r) => r.status === 200,
            'like post has reactions': (r) => r.json('reactions') !== undefined
        });

        if (!success) {
            console.log(`VU${__VU} Like post failed - Status: ${response.status}, Response: ${response.body}`);
            favoriteRate.add(false);
            favoriteTime.add(endTime - startTime);
            return false;
        }

        favoriteRate.add(true);
        favoriteTime.add(endTime - startTime);
        favoritesGiven.add(1);
        return true;
    }, 3, 'likePost');
}

// spike scenario - mixed workload
export function spikeScenario() {
    if (!login()) {
        console.log(`VU${__VU} Spike test login failed`);
        return;
    }

    // Random behavior during spike
    const behavior = Math.random();
    
    if (behavior < 0.3) {
        // 30% - Create posts (content creators)
        const postCount = Math.floor(Math.random() * 2) + 1;
        for (let i = 0; i < postCount; i++) {
            const postId = createPost();
            if (postId) {
                console.log(`VU${__VU} Successfully created post: ${postId}`);
                sleepJitter(1, 2);
            }
        }
    } else if (behavior < 0.7) {
        // 40% - Create comments (consumers)
        const predefinedPostIds = Array.from({length: 20}, (_, i) => i + 1);
        const randomPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
        
        console.log(`VU${__VU} Consumer commenting on post: ${randomPostId}`);
        const commentSuccess = createComment(randomPostId);
        if (commentSuccess) {
            console.log(`VU${__VU} Successfully commented on post: ${randomPostId}`);
        }
        
        // Maybe comment another post
        if (Math.random() < 0.5) {
            const anotherPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
            const anotherCommentSuccess = createComment(anotherPostId);
            if (anotherCommentSuccess) {
                console.log(`VU${__VU} Successfully commented on another post: ${anotherPostId}`);
            }
        }
    } else {
        // 30% - Like posts (favoriters)
        const predefinedPostIds = Array.from({length: 20}, (_, i) => i + 1);
        const likeCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < likeCount; i++) {
            const randomPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
            console.log(`VU${__VU} Favoriter liking post: ${randomPostId}`);
            const likeSuccess = likePost(randomPostId);
            if (likeSuccess) {
                console.log(`VU${__VU} Successfully liked post: ${randomPostId}`);
            }
            sleepJitter(0.5, 1);
        }
    }

    sleepJitter(1, 3);
}

// default function for CLI overrides
export default function() {
    spikeScenario();
}

// setup function
export function setup() {
    console.log(`Starting spike test against ${config.baseUrl}`);
    return { baseUrl: config.baseUrl };
}

// teardown function
export function teardown(data) {
    console.log(`Total posts created: ${articlesCreated.value}`);
    console.log(`Total comments created: ${commentsCreated.value}`);
    console.log(`Total likes given: ${favoritesGiven.value}`);
}

export function handleSummary(data) {
    return {
        "results/spike-test-report.html": htmlReport(data, {
            title: 'K6 DummyJSON Spike Test Report',
            description: 'Spike test results for DummyJSON API - Testing sudden traffic increases'
        }),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

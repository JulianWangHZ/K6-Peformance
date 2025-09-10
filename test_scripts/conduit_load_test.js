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
            //console.log(`${operationName} attempt ${attempt} failed: ${error.message}`);
        }
        
        if (attempt < maxRetries) {
            const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            //console.log(`Retrying ${operationName} in ${backoffTime}ms...`);
            sleep(backoffTime / 1000);
        }
    }
    
    //console.log(`${operationName} failed after ${maxRetries} attempts`);
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
        // creator scenario
        creators: {
            executor: 'ramping-vus',
            startVUs: 2,
            stages: [
                { duration: '1m', target: 5 },
                { duration: '2m', target: 10 },
                { duration: '4m', target: 20 },
                { duration: '2m', target: 0 }
            ],
            exec: 'creatorScenario',
            tags: { scenario: 'creators' }
        },
        
        // consumer scenario
        consumers: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '30s',
            stages: [
                { duration: '30s', target: 35 },
                { duration: '2m', target: 70 },
                { duration: '5m', target: 140 },
                { duration: '2m', target: 0 }
            ],
            exec: 'consumerScenario',
            tags: { scenario: 'consumers' }
        },
        
        // favoriter scenario
        favoriters: {
            executor: 'ramping-vus',
            startVUs: 0,
            startTime: '1m',
            stages: [
                { duration: '30s', target: 10 },
                { duration: '2m', target: 20 },
                { duration: '5m', target: 40 },
                { duration: '2m', target: 0 }
            ],
            exec: 'favoriterScenario',
            tags: { scenario: 'favoriters' }
        }
    },
    
    thresholds: {
        ...thresholds,
        'register_success': ['rate>0.95'], // login success rate
        'article_creation_success': ['rate>0.85'], // post creation success rate
        'comment_creation_success': ['rate>0.90'], // comment creation success rate
        'favorite_success': ['rate>0.90'], // like success rate
        'article_creation_time': ['p(95)<2000'], // post creation time (DummyJSON is faster)
        'comment_creation_time': ['p(95)<1500'], // comment creation time
        'favorite_time': ['p(95)<1000'], // like time
        'register_time': ['p(95)<500'] // login time (DummyJSON is faster)
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
        } else {
            console.log(`VU${__VU} Login successful - User ID: ${response.json('id')}`);
        }

        registerRate.add(success);
        registerTime.add(endTime - startTime);

        if (success) {
            authToken = response.json('accessToken');
            return true;
        }
        
        return false;
    }, 3, 'login');
}


// create post
function createPost() {
    return retryOperation(() => {
        const randomPost = postData[Math.floor(Math.random() * postData.length)];
        
        const postPayload = {
            title: `K6 Test Post - ${randomPost.title} - ${Date.now()}`,
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
            'create post status is 200': (r) => r.status === 200,
            'create post has id': (r) => r.json('id') !== undefined,
            'create post has title': (r) => r.json('title') !== undefined
        });

        articleCreationRate.add(success);
        articleCreationTime.add(endTime - startTime);

        if (success) {
            const postId = response.json('id');
            articlesCreated.add(1);
            availableArticles.push(postId);
            console.log(`VU${__VU} created post: ${postId}, Total posts: ${availableArticles.length}`);
            return postId;
        }
        
        return false;
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
            'create comment status is 200': (r) => r.status === 200,
            'create comment has body': (r) => r.json('body') !== undefined,
            'create comment has id': (r) => r.json('id') !== undefined
        });

        commentCreationRate.add(success);
        commentCreationTime.add(endTime - startTime);

        if (success) {
            commentsCreated.add(1);
            return true;
        }
        
        return false;
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

        favoriteRate.add(success);
        favoriteTime.add(endTime - startTime);

        if (success) {
            favoritesGiven.add(1);
            return true;
        }
        
        return false;
    }, 3, 'likePost');
}

// creator scenario
export function creatorScenario() {
    if (!login()) {
        console.log('Creator login failed');
        return;
    }

    sleepJitter(1, 2);

    // create 1-3 posts
    const postCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < postCount; i++) {
        const postId = createPost();
        if (postId) {
            sleepJitter(2, 4); 
        }
    }

    sleepJitter(3, 6);
}

// consumer scenario
export function consumerScenario() {
    if (!login()) {
        console.log('Consumer login failed');
        return;
    }

    sleepJitter(1, 2);

    // comment on random post (use predefined post IDs)
    const predefinedPostIds = Array.from({length: 20}, (_, i) => i + 1);
    const randomPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
    
    console.log(`VU${__VU} Consumer commenting on post: ${randomPostId}`);
    createComment(randomPostId);
    
    sleepJitter(2, 4);

    // maybe comment another post
    if (Math.random() < 0.3) {
        const anotherPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
        console.log(`VU${__VU} Consumer commenting on another post: ${anotherPostId}`);
        createComment(anotherPostId);
    }

    sleepJitter(1, 3);
}

// favoriter scenario
export function favoriterScenario() {
    if (!login()) {
        console.log('Favoriter login failed');
        return;
    }

    sleepJitter(1, 2);

    // like multiple posts (use predefined post IDs)
    const predefinedPostIds = Array.from({length: 20}, (_, i) => i + 1);
    const likeCount = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < likeCount; i++) {
        const randomPostId = predefinedPostIds[Math.floor(Math.random() * predefinedPostIds.length)];
        console.log(`VU${__VU} Favoriter liking post: ${randomPostId}`);
        likePost(randomPostId);
        sleepJitter(1, 2);
    }

    sleepJitter(2, 4);
}

// setup function
export function setup() {
    console.log(`Starting load test against ${config.baseUrl}`);
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
        "results/load-test-report.html": htmlReport(data, {
            title: 'K6 DummyJSON Load Test Report',
            description: 'Performance test results for DummyJSON API'
        }),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}   
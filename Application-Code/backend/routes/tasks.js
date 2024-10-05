const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const client = require("prom-client");

// Create a Registry to register the metrics
const register = new client.Registry();

// Default metrics that track HTTP response times, memory usage, etc.
client.collectDefaultMetrics({ register });

// Custom metrics example - you can create custom counters, histograms, etc.
const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [50, 100, 200, 300, 400, 500, 1000] // Define latency buckets
});

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to capture the response time
router.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        httpRequestDurationMicroseconds.labels(req.method, req.route?.path || req.url, res.statusCode).observe(duration);
    });
    next();
});

// Your existing routes
router.post("/", async (req, res) => {
    try {
        const task = await new Task(req.body).save();
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find();
        res.send(tasks);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate({ _id: req.params.id }, req.body);
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint to expose Prometheus metrics
router.get("/metrics", async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

module.exports = router;

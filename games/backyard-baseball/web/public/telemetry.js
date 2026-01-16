var Telemetry = {
    endpoint: 'https://backyard-baseball-api.humphrey-austin20.workers.dev/api/telemetry',
    queue: [],
    batchSize: 10,
    flushInterval: 5000,
    sessionId: null,
    flushTimer: null,

    init: function() {
        this.sessionId = this.generateUUID();
        this.startFlushTimer();
    },

    generateUUID: function() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    startFlushTimer: function() {
        var self = this;
        this.flushTimer = setInterval(function() {
            self.flush();
        }, this.flushInterval);
    },

    send: function(eventType, data) {
        data = data || {};

        var event = {
            eventType: eventType,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            data: data,
            url: window.location.href
        };

        this.queue.push(event);

        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    },

    sendBatch: function(events) {
        var self = this;
        events.forEach(function(e) {
            e.sessionId = self.sessionId;
            self.queue.push(e);
        });

        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    },

    flush: function() {
        if (this.queue.length === 0) return;

        var batch = this.queue.splice(0, this.batchSize);
        var payload = JSON.stringify({ events: batch });

        if (navigator.sendBeacon) {
            try {
                navigator.sendBeacon(this.endpoint, payload);
            } catch (e) {
                this.fallbackSend(payload);
            }
        } else {
            this.fallbackSend(payload);
        }
    },

    fallbackSend: function(payload) {
        try {
            fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(function() {});
        } catch (e) {}
    },

    destroy: function() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
};

Telemetry.init();

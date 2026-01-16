var GameLoader = {
    instance: null,
    canvas: null,

    load: function(config, callbacks) {
        var self = this;
        this.canvas = document.getElementById('unity-canvas');
        this.callbacks = callbacks;

        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        var frameworkUrl = config.frameworkUrl;
        if (frameworkUrl.endsWith('.br')) {
            frameworkUrl = frameworkUrl.slice(0, -3);
        }

        var script = document.createElement('script');
        script.src = frameworkUrl;
        script.onload = function() {
            self.initUnity(config);
        };
        script.onerror = function() {
            if (callbacks.onError) {
                callbacks.onError(new Error('Failed to load Unity framework script'));
            }
        };
        document.body.appendChild(script);
    },

    initUnity: function(config) {
        var self = this;
        var callbacks = this.callbacks;

        if (typeof createUnityInstance === 'undefined') {
            if (callbacks.onError) {
                callbacks.onError(new Error('Unity loader not available'));
            }
            return;
        }

        createUnityInstance(this.canvas, config, function(progress) {
            if (callbacks.onProgress) {
                callbacks.onProgress(progress);
            }
        }).then(function(unityInstance) {
            self.instance = unityInstance;
            self.setupBridge();
            if (callbacks.onComplete) {
                callbacks.onComplete(unityInstance);
            }
        }).catch(function(error) {
            if (callbacks.onError) {
                callbacks.onError(error);
            }
        });
    },

    setupBridge: function() {
        var self = this;

        window.SendTelemetry = function(json) {
            try {
                var batch = JSON.parse(json);
                if (batch.events && Array.isArray(batch.events)) {
                    Telemetry.sendBatch(batch.events);
                }
            } catch (e) {
                console.error('Telemetry parse error:', e);
            }
        };

        window.addEventListener('beforeunload', function() {
            Telemetry.flush();
        });

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                Telemetry.flush();
            }
        });

        window.addEventListener('error', function(event) {
            Telemetry.send('js_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', function(event) {
            Telemetry.send('unhandled_rejection', {
                reason: String(event.reason)
            });
        });
    },

    sendToUnity: function(objectName, methodName, value) {
        if (this.instance) {
            this.instance.SendMessage(objectName, methodName, value);
        }
    },

    setFullscreen: function(fullscreen) {
        if (this.instance) {
            this.instance.SetFullscreen(fullscreen ? 1 : 0);
        }
    },

    quit: function() {
        if (this.instance) {
            this.instance.Quit();
        }
    }
};

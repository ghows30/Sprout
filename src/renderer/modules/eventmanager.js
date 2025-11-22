const EventManager = (() => {
    const events = {};

    function subscribe(event, callback) {
        if (!events[event]) {
            events[event] = [];
        }
        events[event].push(callback);

    }

    function unsubscribe(event, callback) {
        if (!events[event]) return;
        events[event] = events[event].filter(cb => cb !== callback);
    }

    function notify(event, data) {
        if (!events[event]) return;
        console.log(`Notifying ${event}`, data);
        events[event].forEach(callback => callback(data));
    }

    return {
        subscribe,
        unsubscribe,
        notify
    };
})();

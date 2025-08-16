export function getDeviceType() {
    const width = window.innerWidth;

    if (width > 1766) {
        return 'desktop';
    } else if (width > 700) {
        return 'tablet';
    } else if (width > 420) {
        return 'mobile';
    } else {
        return 'phone'
    }
}

export function debounce(func, delay) {
    var timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout( () => {
            func.apply(this, args);
        }, delay)
    }
}

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}
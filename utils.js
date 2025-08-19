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

export function getElementProps(element) {
    if (!(element instanceof HTMLElement)) {
      console.warn("Invalid input: Please provide a valid HTML element.");
      return null;
    }
  
    const rect = element.getBoundingClientRect();
  
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: rect.x, // x and y are often equivalent to left and top, but included for completeness
      y: rect.y
    };
  }
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

export function timeSince(dateInput, includeDays = false) {
    const now = new Date();
    const inputDate = new Date(dateInput);
  
    // Extract differences
    let years = now.getFullYear() - inputDate.getFullYear();
    let months = now.getMonth() - inputDate.getMonth();
    let days = now.getDate() - inputDate.getDate();
  
    // Adjust if negative
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonth;
    }
  
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  
    // Build output
    let parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (includeDays && days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  
    return parts.length > 0 ? parts.join(', ') : 'Today';
}

export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
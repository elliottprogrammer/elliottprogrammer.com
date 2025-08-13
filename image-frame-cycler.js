function imageFrameCycler(imgContainerSelector, userOptions) {
    const imgContainerElement = document.querySelector(imgContainerSelector);
    const defaultOptions = {
        shouldReverse: false,
        targetFPS: 18,
    };
    const options = {...defaultOptions, ...userOptions};
    

    let lastFrameTime = 0;
    const frameInterval = 1000 / options.targetFPS; // Milliseconds per frame
    let stopped = false;

    return {
        doFrameCycle: function(timestamp, index, isForwardCycle, frameCycleComplete) {
            // If enough time has passed since the last frame
            if (timestamp - lastFrameTime >= frameInterval) {
                lastFrameTime = timestamp;
    
                // Get the images (each frame) in the DOM.
                const imgFrames = imgContainerElement.getElementsByTagName('img');
                // Create a document fragment to batch DOM updates
                const fragment = document.createDocumentFragment();
    
                for (const element of imgFrames) {
                    let elementIndex = element.dataset.id;
                    // Perform element updates
                    if (elementIndex == index) {
                        // Bring index element to front.
                        element.style.visibility = 'visible';
                    } else {
                        // Otherwise move behind.
                        element.style.visibility = 'hidden';
                    }
    
                    //Append the updated element to the fragment
                    fragment.appendChild(element.cloneNode(true)); // Create a copy for the fragment
                }
                // Compare with current DOM and update only if different
                const fragmentChildren = fragment.children;
                const currentImgs = imgContainerElement.children;
                let needsUpdate = false;
    
                for (let i = 0; i < currentImgs.length; i++) {
                    const fragZ = fragmentChildren[i].style.visibility || '';
                    const domZ = currentImgs[i].style.visibility || '';
                    if (fragZ !== domZ) {
                        needsUpdate = true;
                        break;
                    }
                }
    
                if (needsUpdate) {
                    imgContainerElement.innerHTML = ''; // Clear existing content
                    imgContainerElement.appendChild(fragment);
                }
    
                if (options.shouldReverse) {
                    if (isForwardCycle) {
                        if (index === imgFrames.length - 1) {
                            isForwardCycle = false;
                        } else {
                            index++;
                        }
                    } else {
                        if (index === 0) {
                            frameCycleComplete = true;
                        } else {
                            index--;
                        }  
                    }
                } else {
                    if (index === imgFrames.length - 1) {
                        frameCycleComplete = true;
                    } else {
                        index++;
                    }
                }
            }
    
            if (! frameCycleComplete && ! stopped) {
                requestAnimationFrame((ts) => this.doFrameCycle(ts, index, isForwardCycle, frameCycleComplete)); // Request the next animation frame
            }
        },
        stopCycle: function() {
            stopped = true;
        }
    }
    
}
export { imageFrameCycler };

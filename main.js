        import { ImageAtomizer } from './image-atomizer.js';
        import { Typewriter } from './t-writer.js';
        import { imageFrameCycler } from './image-frame-cycler.js';
        import { confettea } from './confettea.js';
        import { getDeviceType, getElementProps, getRandomInt, timeSince, numberWithCommas, debounce } from './utils.js';

        let gitSlider;
        let sliderTl;
        let isGitSliderPlaying = false;
        
        const sliderScrollDuration = 60;
        const slider = document.getElementById('git-contribution-slider');
        let sliderDirection;
        const prevBtn = slider.querySelector('.prev');
        const nextBtn = slider.querySelector('.next');
        const playBtn = slider.querySelector('.play');
        const pauseBtn = slider.querySelector('.pause');
        
        // Blinking eyes on both images
        const frameCycle1 = imageFrameCycler('#about-me-image .frames-container', { shouldReverse: true });
        const frameCycle2 = imageFrameCycler('#searching-bugs .frames-container.searching-eyes-frames', { shouldReverse: true });
        let blinkTimer;
        function blinkEyesRandomly() {
            const randomDelay = getRandomInt(1000, 6000);
            requestAnimationFrame((timestamp) => frameCycle1.doFrameCycle(timestamp, 0, true, false));
            requestAnimationFrame((timestamp) => frameCycle2.doFrameCycle(timestamp, 0, true, false));
            blinkTimer = setTimeout(blinkEyesRandomly, randomDelay);
        }

        // Twinkler logic (class)
        class Twinkler {
            constructor(twinkleElem, randomRange) {
                this.twinkleElement = twinkleElem;
                this.randomRange = {
                    low: randomRange[0],
                    high: randomRange[1],
                }
                this.timer = null;
                this.hasStarted = false;
            }

            twinkle() {
                gsap.to(this.twinkleElement, {
                    duration: .2,
                    scale: 1,
                    rotation: 180,
                    ease: 'none',
                    repeat: 1,
                    yoyo: true
                });
            }

            _cycleTwinkler = () => {
                const randomWait = getRandomInt(this.randomRange.low, this.randomRange.high);
                this.twinkle();
                // recursively twinkle with random wait duration.
                this.timer = setTimeout( this._cycleTwinkler, randomWait);
            }

            start() {
                // Don't start the twinkler if it's already been started
                if (! this.hasStarted ) {
                    this._cycleTwinkler();
                    this.hasStarted = true;
                }
            }

            stop() {
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                    this.hasStarted = false;
                }
            }
        }

        // Light switch twinkle
        const clickMeTwinkle = document.querySelector('img.click-me-twinkle');
        const lightSwitchTwinkler = new Twinkler(clickMeTwinkle, [1000, 4000]);

        // Coffee cup twinkle
        const cupTwinkle = document.querySelector('img.twinkle');
        const cupTwinkler = new Twinkler(cupTwinkle, [3000, 8000]);

        // Image caption nudge arrow (w/ twinkle)
        const aboutMeCaptionArrow = document.querySelector('#about-me-image-caption .caption-arrow-forward');
        const searchingBugsCaptionArrow = document.querySelector('#searching-bugs-image-caption .caption-arrow-forward');
        const aboutMeArrowTwinkle = document.querySelector('#about-me-image-caption img.twinkle-shine');
        const searchingBugsArrowTwinkle = document.querySelector('#searching-bugs-image-caption img.twinkle-shine');
        let arrow1Timer;
        const arrow1Twinkler = new Twinkler(aboutMeArrowTwinkle, [1000, 3000]);
        function nudgeArrow1Randomly() {
            const randomWait = getRandomInt(1000, 4000);
            gsap.to(aboutMeCaptionArrow, {
                duration: .2,
                x: 8,
                ease: 'none',
                repeat: 3,
                yoyo: true,
                onComplete: () => { arrow1Twinkler.twinkle(); },
            });
            arrow1Timer = setTimeout( nudgeArrow1Randomly, randomWait );
        }
        let arrow2Timer;
        const arrow2Twinkler = new Twinkler(searchingBugsArrowTwinkle, [1000, 3000]);
        function nudgeArrow2Randomly() {
            const randomWait = getRandomInt(1000, 4000);
            gsap.to(searchingBugsCaptionArrow, {
                duration: .2,
                x: 8,
                ease: 'none',
                repeat: 3,
                yoyo: true,
                onComplete: () => { arrow2Twinkler.twinkle(); },
            });
            arrow2Timer = setTimeout( nudgeArrow2Randomly, randomWait );
        }

        // Ceiling fan logic (class)
        class CeilingFan {
            constructor() {
                this.animationId = null;
                this.fanCycler = imageFrameCycler('#searching-bugs .frames-container', { targetFPS: 18 });
                this.stopped = false;
                this.timer = null;
            }

            doFanCycle = () => {
                if (! this.stopped) {
                    this.animationId = requestAnimationFrame((timestamp) => { this.fanCycler.doFrameCycle(timestamp, 0, true, false)});
                    this.timer = setTimeout(this.doFanCycle, 222);
                }
            }

            start = () => {
                this.fanCycler.resetCycler();
                this.stopped = false;
                this.doFanCycle();
            }

            stop = () => {
                this.stopped = true;
                clearTimeout(this.timer);
                this.fanCycler.stopCycler();
            }
        }

        const aboutMeLightGlow = document.querySelector('#about-me-image.interactive-image .glow-light');
        const aboutMeLampLight = document.querySelector('#about-me-image.interactive-image .light-on-container > img');
        const aboutMeLightSwitch = document.querySelector('#about-me-image button.light-switch');
        const coffeeCupHidden = document.querySelector('#about-me-image .coffee-cup-container > img[data-id="0"]');
        const coffeeCupVisible = document.querySelector('#about-me-image .coffee-cup-container > img[data-id="1"]');
        const coffeeCupVisibleWithShadow = document.querySelector('#about-me-image .coffee-cup-container > img[data-id="2"]');
        const coffeeCupButton = document.querySelector('#about-me-image .coffee-cup-btn');
        const clickSound = document.getElementById('click-sound');
        const selectSuccessSound = document.getElementById('select-success-sound');
        const taDaSound = document.getElementById('ta-da-sound');
        const swooshSound1 = document.getElementById('swoosh-sound1');
        const swooshSound2 = document.getElementById('swoosh-sound2');
        const levelCompleteSound = document.getElementById('level-complete-sound');
        let isLightOn = false;
        
        aboutMeLightSwitch.addEventListener('click', (e) => {
            clickSound.currentTime = 0;
            clickSound.play();
            lightSwitchTwinkler.stop();;
            clearTimeout(arrow1Timer);
            const computedStyle = window.getComputedStyle(aboutMeLightGlow);
            const lightOpacity = parseFloat(computedStyle.getPropertyValue('opacity'));
            // If light is ON, turn it OFF.
            if (lightOpacity > 0) {
                aboutMeLightGlow.style.opacity = 0;
                aboutMeLampLight.style.visibility = 'hidden';
                coffeeCupHidden.style.visibility = 'visible';
                coffeeCupVisible.style.visibility = 'hidden';
                coffeeCupVisibleWithShadow.style.visibility = 'hidden';
                isLightOn = false;
                coffeeCupButton.setAttribute('tabindex', '-1');
                cupTwinkler.stop();
                //clearTimeout(twinkleTimer);
                cupTwinkle.style.visibility = 'hidden';
            // If light is OFF, turn it ON
            } else {
                aboutMeLightGlow.style.opacity = 1;
                aboutMeLampLight.style.visibility = 'visible'; 
                coffeeCupHidden.style.visibility = 'hidden';
                coffeeCupVisibleWithShadow.style.visibility = 'visible';
                coffeeCupVisible.style.visibility = 'visible';
                isLightOn = true;
                coffeeCupButton.setAttribute('tabindex', '0');
                cupTwinkle.style.visibility = 'visible';
                const delay = getRandomInt(500, 2000);
                setTimeout( cupTwinkler.twinkle(), delay );
                cupTwinkler.start();
            }
        });
        const aboutMeImage = document.querySelector('#about-me-image.interactive-image');
        const aboutMeImageCaption = document.querySelector('section#about-me figure figcaption');
        const aboutMeFoundCoffeeDialog = document.querySelector('#about-me-image .coffee-found-dialog');
        const coffeeDialogLine1 = document.querySelector('#about-me-image .coffee-found-dialog .line1');
        const coffeeDialogLine2 = document.querySelector('#about-me-image .coffee-found-dialog .line2');
        const coffeeDialogLine3 = document.querySelector('#about-me-image .coffee-found-dialog .line3');
        const aboutCompleteText1 = document.querySelector('#about-me-image .word1');
        const aboutCompleteText2 = document.querySelector('#about-me-image .word2');
        const aboutCompleteCheck3 = document.querySelector('#about-me-image .check');
        let hasFoundCoffee = false;

        const aboutCompleteTl = gsap.timeline();
        const aboutMeComplete = aboutCompleteTl.from(aboutCompleteText1, {
            duration: 1,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                swooshSound1.curentTime = 0;
                swooshSound1.play();
            },
        })
        .from(aboutCompleteText2, {
            duration: 1,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                swooshSound2.curentTime = 0;
                swooshSound2.play();
            },
        }, 0.3)
        .from(aboutCompleteCheck3, {
            duration: 1,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                levelCompleteSound.curentTime = 0;
                levelCompleteSound.play();
            },
        }, 0.8);;
        aboutMeComplete.pause();

        coffeeCupButton.addEventListener('mouseenter', () => {
            if (isLightOn) {
                coffeeCupVisible.classList.add('hover');
            }
        });
        coffeeCupButton.addEventListener('mouseleave', () => {
            coffeeCupVisible.classList.remove('hover');
        });
        coffeeCupButton.addEventListener('click', (e) => {
            if (hasFoundCoffee) {
                return false;
            }
            hasFoundCoffee = true;
            selectSuccessSound.currentTime = 0;
            selectSuccessSound.play();
            cupTwinkler.stop();
            const { height } = getElementProps(aboutMeImage);
            gsap.to(aboutMeFoundCoffeeDialog, {
                delay: 1,
                y: (height - (height * .35)) * -1 + 'px',
                opacity: 1,
                duration: .5,
                onComplete: function() {
                    const element = this._targets[0]; // Get the animated element
                    const rect = element.getBoundingClientRect();
                    const xPos = rect.x + (rect.width / 2);
                    const yPos = rect.y - (rect.height / 2);
                    const fettiOrigin = {
                        x: xPos / document.body.clientWidth,
                        y: yPos / document.body.clientHeight,
                    }

                    function showChallengeComplete() {
                        setTimeout(() => {
                            aboutMeComplete.play();
                        }, 1000);
                    }
                    taDaSound.currentTime = 0;
                    taDaSound.play();
                    confettea.burst({
                        particleCount: 80,
                        origin: fettiOrigin
                    });
                    const aboutMeCaptionWriterOptions = { typeColor: 'white', cursorColor: '#0348fa', typeSpeed: 70 };
                    const writer1 = new Typewriter(coffeeDialogLine1, aboutMeCaptionWriterOptions);
                    const writer2 = new Typewriter(coffeeDialogLine2, aboutMeCaptionWriterOptions);
                    const writer3 = new Typewriter(coffeeDialogLine3, aboutMeCaptionWriterOptions);
                    writer1.rest(600).type("You found it!").rest(400).removeCursor().then(writer2.start.bind(writer2)).start();
                    writer2.type(" Thank you! 😃 ").rest(700).removeCursor().then(writer3.start.bind(writer3));
                    writer3.type("I gotta have my coffee!").then(showChallengeComplete);
                    aboutMeImageCaption.innerHTML = `While working, you will usually find me drinking either good, quality coffee, or a can of Coke.`;
                }
            })
        });

        const imageStatus = {
            isFanOn: false,
            isLightOn: false,
        };
        
        const lightSwitchImageContainer = document.querySelector('.light-switch-container');
        const lightSwitchImages = lightSwitchImageContainer.getElementsByTagName('img');
        function setSwitchRecepticle(imageStatus) {
            clickSound.currentTime = 0;
            clickSound.play();
            clearTimeout(arrow2Timer);
            let imageIdToShow;
            const { isFanOn, isLightOn } = imageStatus;
            if( isFanOn && ! isLightOn) {
                imageIdToShow = 1;
            } else if (! isFanOn && isLightOn) {
                imageIdToShow = 2;
            } else if (isFanOn && isLightOn) {
                imageIdToShow = 3;
            } else {
                imageIdToShow = 0;
            }
            
            for(const element of lightSwitchImages) {
                if (element.dataset.id == imageIdToShow) {
                    element.style.visibility = 'visible';
                } else {
                    element.style.visibility = 'hidden';
                }
            }
        }
        let hasBugDeployed = false;
        let hasFoundBug = false;
        let bugTimeline;
        const searchingBugsImage = document.querySelector('#searching-bugs.interactive-image');
        const searchingBugsDomeLight = document.querySelector('#searching-bugs.interactive-image .fan-dome-light-container > img');
        const searchingBugsLightGlow = document.querySelector('#searching-bugs.interactive-image .cone-light-container > img');
        const searchingBugsLightSwitch = document.querySelector('#searching-bugs button.light-switch');
        const searchingBugsImageCaption = document.querySelector('section#what-sets-me-apart figure figcaption');
        const theBug = document.querySelector('#searching-bugs.interactive-image .the-bug');
        const searchingBugsFoundDialog = document.querySelector('#searching-bugs .searching-bugs-found-dialog');
        const searchingBugsDialogLine1 = document.querySelector('#searching-bugs .searching-bugs-found-dialog .line1');
        const searchingBugsDialogLine2 = document.querySelector('#searching-bugs .searching-bugs-found-dialog .line2');
        const searchingBugsDialogLine3 = document.querySelector('#searching-bugs .searching-bugs-found-dialog .line3');
        const bugsCompleteText1 = document.querySelector('#searching-bugs .word1');
        const bugsCompleteText2 = document.querySelector('#searching-bugs .word2');
        const bugsCompleteCheck3 = document.querySelector('#searching-bugs .check');
        const bugScuttleSound = document.getElementById('bugs-scuttle-sound');
        bugScuttleSound.volume = 0.15;
        const bugSquishSound = document.getElementById('bug-squish-sound');

        const bugsCompleteTl = gsap.timeline();
        const bugsComplete = bugsCompleteTl.from(bugsCompleteText1, {
            duration: 1.0,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                swooshSound1.curentTime = 0;
                swooshSound1.play();
            },
        })
        .from(bugsCompleteText2, {
            duration: 1.0,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                swooshSound2.curentTime = 0;
                swooshSound2.play();
            },
        }, 0.3)
        .from(bugsCompleteCheck3, {
            duration: 1.0,
            xPercent: -50,
            scale: 0,
            ease: 'elastic.out(.7,0.19)',
            onStart: () => {
                levelCompleteSound.curentTime = 0;
                levelCompleteSound.play();
            },
        }, 0.8);;
        bugsComplete.pause();

        searchingBugsLightSwitch.addEventListener('click', (e) => {
            imageStatus.isLightOn = !imageStatus.isLightOn;
            setSwitchRecepticle(imageStatus);
            if (imageStatus.isLightOn) {
                searchingBugsDomeLight.style.visibility = 'visible';
                searchingBugsLightGlow.style.visibility = 'visible';
                maybeDeployBug();
            } else {
                searchingBugsDomeLight.style.visibility = 'hidden';
                searchingBugsLightGlow.style.visibility = 'hidden';
            }
        });
        // Start Bug animation around here...
        const searchingBugsFanSwitch = document.querySelector('#searching-bugs button.fan-switch');
        const fan = new CeilingFan();
        searchingBugsFanSwitch.addEventListener('click', (e) => {
            imageStatus.isFanOn = !imageStatus.isFanOn;
            setSwitchRecepticle(imageStatus);
            if (imageStatus.isFanOn) {
                fan.start();
                maybeDeployBug();
            } else {
                if (fan.animationId) {
                    fan.stop();
                } 
            }
        });
        
        function maybeDeployBug() {
            if (hasBugDeployed) {
                return;
            }
            const { width, height } = getElementProps(searchingBugsImage);
            const {isFanOn, isLightOn} = imageStatus;
            if (isFanOn && isLightOn) {
                theBug.style.visibility = 'visible';
                CustomBounce.create("myBounce", {
                    strength: 0.4,
                    squash: 3,
                    squashID: "myBounce-squash",
                });
                bugTimeline = gsap.timeline();
                bugTimeline
                    // Fall down and bounce
                    .to(theBug, {
                        duration: 0.7,
                        ease: "myBounce",
                        y: height * .52 + 'px',
                        onComplete: () => {
                            bugScuttleSound.currentTime = 0;
                            //bugScuttleSound.play();
                        }
                    })
                    // Squash (durung bounce at the same time)
                    .to(theBug, {
                        duration: 0.7,
                        scaleX: 1.4,
                        scaleY: 0.6,
                        ease: "myBounce-squash",
                        transformOrigin: "center bottom",
                    }, 0);
                bugTimeline
                // Then move across desk, back and forth in loop.
                    .to(theBug, {
                        duration: 5,
                        x: '-=' + width * .05 + 'px',
                        y: '+=' + height * .035 + 'px',
                        repeat: -1,
                        yoyo: true,
                        ease: 'none'
                    })
                    // And wiggle at the same time.
                    .to(theBug, {
                        duration: .1,
                        rotation: 8,
                        ease: 'none',
                    }, 0)
                    .to(theBug, {
                        duration: .1,
                        rotation: -8,
                        repeat: -1,
                        yoyo: true,
                        ease: 'none'
                    });

                hasBugDeployed = true;
            }
        }

        theBug.addEventListener('click', () => {
            if (hasFoundBug) {
                return false;
            }
            theBug.classList.add('squished');
            hasFoundBug = true;
            bugScuttleSound.pause();
            bugTimeline.pause();
            const { width, height } = getElementProps(searchingBugsImage);
            bugSquishSound.currentTime = 0;
            bugSquishSound.play();
            gsap.to(theBug, {
                duration: .15,
                scaleY: .2,
                ease: 'none',
                transformOrigin: "center bottom",
            });
            gsap.to(searchingBugsFoundDialog, {
                delay: 1,
                y: (height - (height * .42)) * -1 + 'px',
                opacity: 1,
                duration: .5,
                onComplete: function() {
                    const element = this._targets[0]; // Get the animated element
                    const rect = element.getBoundingClientRect();
                    const xPos = rect.x + (rect.width / 2);
                    const yPos = rect.y - (rect.height / 2);
                    const fettiOrigin = {
                        x: xPos / document.body.clientWidth,
                        y: yPos / document.body.clientHeight,
                    }

                    function showChallengeComplete() {
                        setTimeout(() => {
                            bugsComplete.play();
                        }, 1000);
                    }
                    taDaSound.currentTime = 0;
                    taDaSound.play();
                    confettea.burst({
                        particleCount: 80,
                        origin: fettiOrigin
                    });
                    const searchingBugsCaptionWriterOptions = { typeColor: 'white', cursorColor: '#0348fa', typeSpeed: 70 };
                    const writer1 = new Typewriter(searchingBugsDialogLine1, searchingBugsCaptionWriterOptions);
                    const writer2 = new Typewriter(searchingBugsDialogLine2, searchingBugsCaptionWriterOptions);
                    const writer3 = new Typewriter(searchingBugsDialogLine3, searchingBugsCaptionWriterOptions);
                    writer1.rest(600).type("You squashed the bug!").rest(400).removeCursor().then(writer2.start.bind(writer2)).start();
                    writer2.type(" Thank you! 😃 ").rest(700).removeCursor().then(writer3.start.bind(writer3));
                    writer3.type("We're now bug-free!").then(showChallengeComplete);
                    searchingBugsImageCaption.innerHTML = `I strive to ensure my code is clean, bug-fee, easy to read, and easy to maintain.`;
                }
            })
        });

        function injectMemberSinceDate() {
            const stackMemberSinceElement = document.querySelector('#stack-member-since');
            const githubMemberSinceElement = document.querySelector('#github-member-since');
            const githubYearlyContributionText = document.querySelector('#git-profile-detail-text');
            const stackMemberForString = timeSince('May 5, 2012');
            const githubMemberForString = timeSince('February 19, 2013');
            stackMemberSinceElement.innerHTML = stackMemberForString;
            githubMemberSinceElement.innerHTML = githubMemberForString;
            githubYearlyContributionText.innerText = getDeviceType() === 'phone' ? 'this year' : 'in the last year';
        }


        document.addEventListener('DOMContentLoaded', function() {
            gsap.registerPlugin(ScrollTrigger);
            gsap.registerPlugin(CustomEase);
            
            const navMenuButton = document.querySelector('.nav-menu-button');
            navMenuButton.addEventListener('click', (e) => {
                const menuBtnElement = e.currentTarget;
                const classes = menuBtnElement.classList;
                if (classes.contains('open')) {
                    menuBtnElement.classList.remove('open');
                } else {
                    menuBtnElement.classList.add('open');
                }
            });
            blinkEyesRandomly();
            //showClickIndicatorRandomly();
            lightSwitchTwinkler.start();
            nudgeArrow1Randomly();
            nudgeArrow2Randomly();
            injectMemberSinceDate();

            // Listen for window blur event
            window.addEventListener('blur', function() {
                if (hoverMeTimer) {
                    clearTimeout(hoverMeTimer);
                    hoverMeTimer = null;
                }
                // Stop blinking when window loses focus.
                if (blinkTimer) {
                    clearTimeout(blinkTimer);
                    blinkTimer = null;
                }
                if (arrow1Timer) {
                    clearTimeout(arrow1Timer);
                    arrow1Timer = null;
                }
                if (arrow2Timer) {
                    clearTimeout(arrow2Timer);
                    arrow2Timer = null;
                }
            });

            // Listen for window focus event
            window.addEventListener('focus', function() {
                // Start blinking again when window re-focusus.
                if (!hoverMeTimer) {
                    hoverMe();
                }
                if (!blinkTimer) {
                    blinkEyesRandomly();
                }
                if (!arrow1Timer) {
                    nudgeArrow1Randomly();
                }
                if (!arrow2Timer) {
                    nudgeArrow2Randomly();
                }
            });
        });

        // Initialize a new Lenis instance for smooth scrolling
        const lenis = new Lenis();

        // Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
        lenis.on('scroll', ScrollTrigger.update);

        // Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
        // This ensures Lenis's smooth scroll animation updates on each GSAP tick
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000); // Convert time from seconds to milliseconds
        });

        // Disable lag smoothing in GSAP to prevent any delay in scroll animations
        gsap.ticker.lagSmoothing(0);

        const name = document.querySelector('.name');
        const title = document.querySelector('.title');
        const description = document.querySelector('.description');
        gsap.from( '.name', {
            opacity: 0,
            y: -70,
            duration: 1,
            ease: 'power1.inOut',
            onStart: () => {
                name.style.visibility = 'visible';
            }
        });

        gsap.from( [title, description], {
            opacity: 0,
            y: 70,
            duration: 1,
            ease: 'power1.inOut',
            onStart: () => {
                title.style.visibility = 'visible';
                description.style.visibility = 'visible';
            },
        })

        gsap.to( '.hover-me img', {
            delay:3.5,
            opacity: 1,
        });

        // HoverMe image shakes every random 1 - 5 seconds
        let hoverMeTimer;
        function hoverMe() {
            gsap.to( '.hover-me img', {
                delay: 3.5,
                duration: .1,
                rotationZ: 20,
                yoyo: true,
                repeat: 5,
                ease: "power1.inOut",
                onComplete() {
                    const randomWait = getRandomInt(1000, 5000);
                    hoverMeTimer = setTimeout( hoverMe, randomWait );
                },
            });
        }
        hoverMe();

        // Zoom-in atomizer image on scroll.
        // I'll come back to this, I'm not getting desired results.

        // const heroSection = document.querySelector('.atomizer-container');
        // gsap.to(heroSection, {
        //     xPercent: 3,
        //     yPercent: 9.35,
        //     z: 1000,

        //     stager: 0.05,
        //     duration: 10,
        //     scrollTrigger: {
        //         trigger: heroSection,
        //         start: "50px",
        //         pin: false,
        //         scrub: true,
        //         end: '+=700vh',
        //         markers: true,
        //     },
        // })

        const aboutMeTextContainer = document.querySelector('#about-me .two-col > div:first-child');
        const aboutMeImageContainer = document.querySelector('#about-me .two-col > div:last-child');
        gsap.set([aboutMeTextContainer, aboutMeImageContainer], {
            transform: 'translateY(250px)',
            opacity: 0,
        })
        gsap.to(aboutMeTextContainer, {
            scrollTrigger: aboutMeTextContainer,
            opacity: 1,
            y: 0,
        });
        gsap.to(aboutMeImageContainer, {
            scrollTrigger: {
                trigger: aboutMeImageContainer,
                start: 'top bottom',
            },
            opacity: 1,
            y: 0,
            onComplete: () => {
                if ('phone' === getDeviceType()) {
                    const textTl = gsap.timeline( {delay: 1.5, ease: "power1.inOut" } );
                    textTl.to('#about-me-image .interactive-image-text', {
                        duration: .5,
                        scaleX: 1,
                    }).to('#about-me-image .interactive-image-text .text', {
                        duration: .2,
                        opacity: 1,
                    }).to('#about-me-image .interactive-image-text .text', {
                        delay: .5,
                        duration: .5,
                        x: 0,
                    }, 0).to('#about-me-image .interactive-image-text .text', {
                        delay: 3,
                        duration: .5,
                        x: -250,
                    }).to('#about-me-image .interactive-image-text', {
                        duration: .5,
                        scaleX: 0,
                    });
                }  
            },
                    
        });
        const setsMeApartText = document.querySelector('#what-sets-me-apart .two-col > div:first-child');
        const setsMeApartImage = document.querySelector('#what-sets-me-apart .two-col > div:last-child');
        gsap.set([setsMeApartText, setsMeApartImage], {
            transform: 'translateY(250px)',
            opacity: 0,
        })
        gsap.to(setsMeApartText, {
            scrollTrigger: setsMeApartText,
            opacity: 1,
            y: 0,
        });
        gsap.to(setsMeApartImage, {
            scrollTrigger: {
                trigger: setsMeApartImage,
                start: 'top bottom',
            },
            opacity: 1,
            y: 0,          
        });

        const interactImgTxtTl = gsap.timeline({
            scrollTrigger: {
                trigger: setsMeApartImage,
                start: 'bottom+=200px bottom',
            },
            delay: 1.5,
            ease: "power1.inOut",
        } );
        if ('phone' === getDeviceType()) {
            interactImgTxtTl.to('#searching-bugs .interactive-image-text', {
                duration: .5,
                scaleX: 1,
            }).to('#searching-bugs .interactive-image-text .text', {
                duration: .2,
                opacity: 1,
            }).to('#searching-bugs .interactive-image-text .text', {
                delay: .5,
                duration: .5,
                x: 0,
            }, 0).to('#searching-bugs .interactive-image-text .text', {
                delay: 3,
                duration: .5,
                x: -250,
            }).to('#searching-bugs .interactive-image-text', {
                duration: .5,
                scaleX: 0,
            });
        }

        const stackOverflowH2 = document.querySelector('#make-impact h2#how-i-make-an-impact');
        const stackOverflowText = document.querySelector('#make-impact .two-col > div:first-child');
        const stackOverflowImage = document.querySelector('#make-impact .two-col > div:last-child');
        gsap.set([stackOverflowH2, stackOverflowText, stackOverflowImage], {
            transform: 'translateY(250px)',
            opacity: 0,
        })
        gsap.to(stackOverflowH2, {
            scrollTrigger: stackOverflowH2,
            opacity: 1,
            y: 0,
        });
        gsap.to(stackOverflowText, {
            scrollTrigger: stackOverflowText,
            opacity: 1,
            y: 0,
        });
        gsap.to(stackOverflowImage, {
            scrollTrigger: stackOverflowImage,
            opacity: 1,
            y: 0,
        });

        const reputationVal = document.querySelector('#reputation-val');
        const rankVal = document.querySelector('#rank-val');
        const answersVal = document.querySelector('#answers-val');
        const questionsVal = document.querySelector('#questions-val');
        const reachedVal = document.querySelector('#reached-val');
        gsap.set([reputationVal, rankVal, answersVal, questionsVal, reachedVal], {
            innerText: '',
        })
        gsap.to(reputationVal, {
            scrollTrigger: reputationVal,
            innerText: 4085,
            snap: { innerText: 1 },
            stagger: {
                onUpdate: function() {
                    this.targets()[0].innerText = numberWithCommas(Math.ceil(this.targets()[0].innerText));
                },
            }
        });
        gsap.to(rankVal, {
            scrollTrigger: rankVal,
            innerText: 9.3,
            snap: { innerText: 0.1 },
        });
        gsap.to(answersVal, {
            scrollTrigger: answersVal,
            innerText: 174,
            snap: "innerText",
        });
        gsap.to(questionsVal, {
            scrollTrigger: questionsVal,
            innerText: 3,
            snap: "innerText",
        });
        gsap.to(reachedVal, {
            scrollTrigger: reachedVal,
            innerText: 284000,
            snap: { innerText: 1 },
            stagger: {
                onUpdate: function() {
                    this.targets()[0].innerText = numberWithCommas(Math.ceil(this.targets()[0].innerText));
                },
            }
        });

        const gitSectionElements = document.querySelectorAll('#open-source .grid-two-col > div');
        for (let element of gitSectionElements) {
            gsap.set(element, {
                transform: 'translateY(250px)',
                opacity: 0,
            })
            gsap.to(element, {
                scrollTrigger: element,
                opacity: 1,
                y: 0,
            });
        }

        const calypShippedVal = document.querySelector('#calyp-shipped-val > div.content');
        const calypReviewedVal = document.querySelector('#calyp-reviewed-val > div.content');
        const calypOpenVal = document.querySelector('#calyp-open-val > div.content');
        const jetpackShippedVal = document.querySelector('#jetpack-shipped-val > div.content');
        const jetpackReviewedVal = document.querySelector('#jetpack-reviewed-val > div.content');
        gsap.set([calypShippedVal, calypReviewedVal, calypOpenVal, jetpackShippedVal, jetpackReviewedVal], {
            innerText: '',
        })
        gsap.to(calypShippedVal, {
            scrollTrigger: calypShippedVal,
            innerText: 215,
            snap: { innerText: 1 },
            stagger: {
                onUpdate: function() {
                    this.targets()[0].innerText = numberWithCommas(Math.ceil(this.targets()[0].innerText));
                },
            }
        });
        gsap.to(calypReviewedVal, {
            scrollTrigger: calypReviewedVal,
            innerText: 342,
            snap: { innerText: 1 },
        });

        gsap.to(jetpackShippedVal, {
            scrollTrigger: jetpackShippedVal,
            innerText: 67,
            snap: "innerText",
        });
        gsap.to(jetpackReviewedVal, {
            scrollTrigger: jetpackReviewedVal,
            innerText: 133,
            snap: { innerText: 1 },
            stagger: {
                onUpdate: function() {
                    this.targets()[0].innerText = numberWithCommas(Math.ceil(this.targets()[0].innerText));
                },
            }
        });

        let writer1;

        function main() {
            const target = document.querySelector('.logo');

            const options = {
                typeColor: 'white',
                animateCursor: false
            };
            
            writer1 = new Typewriter(target, options);
            writer1.type("elliottprogrammer.com").start();

            setTimeout( () => {
                showAtomizer()
            }, 800)
        }

        const handleTypewriterRestart = debounce( () => {
            writer1.clear().start();
        }, 200);

        
        function showAtomizer() {
            var logoImgSrc;
            var deviceType = getDeviceType();
            switch(deviceType) {
                case 'phone':
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-phone.png';
                    break;
                case 'mobile':
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-mobile.png';
                    break;
                case 'tablet':
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-tablet.png';
                    break;
                case 'desktop':
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-desktop.png';
                    break;
                default:
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-desktop.png';
                    logoImgSrc = './images/bryan-elliott-portfolio-headshot-desktop.png';
            }

            const navHeight = 58
            const headingHeight = deviceType === 'phone' ? 150: 229;
            const viewportHeight = window.innerHeight;
            const canvasHeight = viewportHeight - navHeight;
            const canvasCenterHeight = canvasHeight / 2;
            const adjustedCanvasCenterHeight = ( canvasHeight - headingHeight ) / 2;
            const offsetY = canvasCenterHeight - adjustedCanvasCenterHeight;
            
            var atomizer = new ImageAtomizer(logoImgSrc, {
                particleGap: 2, //getDeviceType() == 'phone' ? 3 : 0,
                particleSize: 3, //getDeviceType() == 'phone' ? 3 : 1,
                restless: false,
                offsetY: offsetY,
            });

            const atomizerCanvas = document.querySelector('canvas.atomizer');
            
            atomizerCanvas.addEventListener('click', function(){atomizer.init()})
        }

        const gitSlides = [
            { width: 1245, height: 196 },
            { width: 1270, height: 196 },
            { width: 1246, height: 196 },
            { width: 1245, height: 196 },
            { width: 813, height: 196 },
        ];

        const sliderViewport = slider.querySelector('.slider-viewport');
        const sliderContent = slider.querySelector('.slider-content');
        const slides = slider.querySelectorAll('.slide');
            
        // Image Slider functionality
        function initImageSlider() {
            
            let currentSlide = 4;
            const totalSlides = slides.length;
            const maxScrollPos = sliderContent.clientWidth - sliderViewport.clientWidth;
            
            // Set initial state
            sliderViewport.scrollLeft = maxScrollPos;

            sliderViewport.addEventListener('scroll', (e) => {
                prevBtn.disabled = sliderViewport.scrollLeft === 0;
                nextBtn.disabled = sliderViewport.scrollLeft === maxScrollPos;
                // let reduceVal = Array.from(slides).reduce((accum, slide, index) => {
                //     const slideWidth = slide.clientWidth;
                //     if (e.target.scrollLeft >= accum && e.target.scrollLeft < accum + slideWidth ) {
                //         currentSlide = index;
                //     }
                //     return accum + slideWidth;
                // }, 0);
                //console.log('scrollLeft: %d', sliderViewport.scrollLeft);
            });
            
            
            // Event listeners for navigation buttons
            prevBtn.addEventListener('click', () => {
                if (sliderViewport.scrollLeft > 0) {
                    if (sliderTl) {
                        sliderTl.pause();
                        isGitSliderPlaying = false;
                        pauseBtn.style.visibility = 'hidden';
                        playBtn.style.visibility = 'visible';
                    }
                    // get "prev" scrollLeft position
                    let prevSlidePos;
                    Array.from(slides).reduce((accum, slide, index) => {
                        const slideWidth = slide.clientWidth;
                        if (sliderViewport.scrollLeft >= accum && sliderViewport.scrollLeft < accum + slideWidth ) {
                            if (sliderViewport.scrollLeft - accum < 10) {
                                prevSlidePos = accum - slides[index - 1].clientWidth; 
                            } else {
                                prevSlidePos = accum;
                            }
                        }
                        return accum + slideWidth;
                    }, 0);
                    sliderDirection = 'forward';
                    // Then gsap animate to that position.
                    gsap.to(sliderViewport, {
                        scrollLeft: prevSlidePos,
                        onComplete: () => {
                            sliderViewport.scrollLeft = prevSlidePos;
                        }
                    });
                }
            });
            
            nextBtn.addEventListener('click', () => {
                if (sliderViewport.scrollLeft < maxScrollPos) {
                    if (sliderTl) {
                        sliderTl.pause();
                        isGitSliderPlaying = false;
                        pauseBtn.style.visibility = 'hidden';
                        playBtn.style.visibility = 'visible';
                    }
                    // Get "next" scrollLeft position
                    let nextSlidePos;
                    Array.from(slides).reduce((accum, slide, index) => {
                        const slideWidth = slide.clientWidth;
                        if (sliderViewport.scrollLeft >= accum && sliderViewport.scrollLeft <= accum + slideWidth ) {
                            nextSlidePos = accum + slideWidth;
                        }
                        return accum + slideWidth;
                    }, 0);
                    sliderDirection = 'reverse';
                    // Then gsap animate to that position.
                    gsap.to(sliderViewport, {
                        scrollLeft: nextSlidePos,
                    });
                }
            });

            playBtn.addEventListener('click', () => {
                if (sliderTl) {
                    const scrollPos = sliderViewport.scrollLeft;
                    const scrollAmtPerSecond = maxScrollPos / sliderScrollDuration;
                    const timeAtScrollPos = (maxScrollPos - scrollPos) / scrollAmtPerSecond;
                    sliderTl.seek(timeAtScrollPos);
                    if (sliderDirection) {
                        sliderDirection === 'reverse' ? sliderTl.reverse() : sliderTl.play();
                    } else {
                        sliderTl.reversed() ? sliderTl.reverse() : sliderTl.play();
                    }
                    isGitSliderPlaying = true;
                    playBtn.style.visibility = 'hidden';
                    pauseBtn.style.visibility = 'visible';
                }
            });

            pauseBtn.addEventListener('click', () => {
                if (sliderTl) {
                    sliderDirection = sliderTl.reversed() ? 'reverse' : 'forward';
                    sliderTl.pause();
                    isGitSliderPlaying = false;
                    pauseBtn.style.visibility = 'hidden';
                    playBtn.style.visibility = 'visible';
                }
            });
            
            // Handle window resize to recalculate positions
            window.addEventListener('resize', () => {
                
            });
        }

        (window.addEventListener
        ? window.addEventListener('load', main, false)
        : window.onload = main);

        // Initialize the image slider after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            initImageSlider();
            gitSlider = document.querySelector('#git-contribution-slider .slider-viewport');
            sliderTl = gsap.timeline({
                scrollTrigger: {
                    trigger: gitSlider,
                    scrub: false,
                    start: "top bottom",
                    end: "top top",
                    //markers: true,
                    onEnter: ({isActive}) => {
                        isGitSliderPlaying = isActive;
                        playBtn.style.visibility = 'hidden';
                        pauseBtn.style.visibility = 'visible';
                    },
                    toggleActions: 'play pause resume pause',
                },
            });
            sliderTl.to(gitSlider, {
                scrollLeft: 0,
                duration: sliderScrollDuration,
                repeat: -1,
                yoyo: true,
                ease: 'none',
            });
            
            [slides[0], slides[1], slides[2], slides[3], slides[4]].forEach((slide, index) => {
                const year = slide.querySelector('.year');
                const yearTimeline = gsap.timeline();
                const leftEnd = sliderViewport.clientWidth - year.clientWidth;

                ScrollTrigger.create({
                    trigger: year,
                    toggleClass: 'active',
                    start: `left left`,
                    end: `right left+=100`,
                    horizontal: true,
                    scroller: sliderViewport,
                    pin: true,
                    //markers: true,
                });
            })
        });
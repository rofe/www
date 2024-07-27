/**
 * Carousel displays a series of slides with navigation, full screen mode and autoplay.
 */
class Carousel {
  #slides = [];

  #cfg = {};

  #root = undefined;

  #currentSlide = 0;

  #navLinks = [];

  #autoplayer = undefined;

  #lastMouseMove = 0;

  #mouseTracker = undefined;

  #isFullScreen = false;

  #touchstart = 0;

  /**
   * Creates a new Carousel.
   * @param {Iterable<HTMLElement>} slides The slides to show
   * @param {Object} [opts] The options
   * @param {boolean} [opts.nav=true] Has a navigation bar
   * @param {boolean} [opts.arrows=true] Has arrows to go back and forth
   * @param {boolean} [opts.fullscreen=true Has full screen mode
   * @param {boolean} [opts.autoplay=true] Plays automatically
   * @param {number} [opts.interval=7000] Milliseconds to show each slide
   * @param {number} [opts.idleness=3000] Milliseconds to wait before hiding controls (0 to disable)
   */
  constructor(slides = [], opts = {}) {
    this.#slides = [...slides];
    this.#cfg = {
      nav: slides.length < 12,
      arrows: true,
      fullscreen: true,
      autoplay: true,
      interval: 7000,
      idleness: 3000,
      ...opts,
    };
    this.#root = document.createElement('div');
    this.#root.classList.add('carousel');
  }

  async draw(elem) {
    this.#createDeck();
    this.#createNav();
    this.#createArrows();
    this.#createFullScreenMode();
    this.#manageControls();
    this.#detectUserInput();
    this.#navHandler(0);
    elem.append(this.#root);
  }

  stop() {
    if (this.#autoplayer) {
      clearInterval(this.#autoplayer);
      this.#autoplayer = undefined;
    }
  }

  start() {
    this.stop();
    this.#autoplayer = setInterval(() => this.nextSlide(), this.#cfg.interval);
  }

  nextSlide(userAction = false) {
    if (this.#currentSlide < this.#slides.length - 1) {
      this.showSlide(this.#currentSlide + 1);
    } else {
      this.showSlide(0);
    }
    if (userAction && this.#autoplayer) {
      this.start();
    }
  }

  previousSlide(userAction = false) {
    if (this.#currentSlide > 0) {
      this.showSlide(this.#currentSlide - 1);
    } else {
      this.showSlide(this.#slides.length - 1);
    }
    if (userAction && this.#autoplayer) {
      this.start();
    }
  }

  showSlide(index) {
    const prevSlide = this.#currentSlide;
    this.#currentSlide = index;
    this.#slides[prevSlide]?.classList.remove('active');
    this.#slides[this.#currentSlide]?.classList.add('active');
    this.#navLinks[prevSlide]?.classList.remove('active');
    this.#navLinks[this.#currentSlide]?.classList.add('active');
  }

  #createDeck() {
    this.#slides.forEach((slide) => slide.classList.add('carousel-slide'));
    this.#root.append(...this.#slides);
  }

  #navHandler(index) {
    this.showSlide(index);
    if (this.#cfg.autoplay) {
      // (re)start carousel
      this.start();
    }
  }

  #createNav() {
    if (this.#cfg.nav) {
      const nav = document.createElement('ol');
      nav.classList.add('carousel-nav');
      this.#slides.forEach((_, i) => {
        const li = document.createElement('li');
        li.classList.add('carousel-navlink');
        if (i === 0) {
          li.classList.add('active');
        }
        li.addEventListener('click', () => this.#navHandler(i));
        nav.appendChild(li);
        this.#navLinks.push(li);
      });
      this.#root.append(nav);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  #createButton(title, cls, click = () => {}) {
    const icon = document.createElement('i');
    const btn = document.createElement('button');
    btn.title = title;
    btn.classList.add(cls);
    btn.addEventListener('click', click);
    btn.append(icon);
    return btn;
  }

  #createArrows() {
    if (this.#cfg.arrows) {
      // add arrow buttons
      this.#root.append(this.#createButton('Previous Image', 'carousel-previous', () => this.previousSlide(true)));
      this.#root.append(this.#createButton('Next Image', 'carousel-next', () => this.nextSlide(true)));
    }
  }

  #swipeHandler(touchend = 0) {
    if (touchend < this.#touchstart) {
      this.previousSlide(true);
    } else if (touchend > this.#touchstart) {
      this.nextSlide(true);
    }
    this.#touchstart = 0;
  }

  #createFullScreenMode() {
    if (this.#cfg.fullscreen) {
      // fullscreen button
      const title = (fullscreen) => `${fullscreen ? 'Exit' : 'Enter'} Full Screen Mode`;
      const fsButton = this.#createButton(title(false), 'carousel-fullscreen-toggle', () => {
        this.#root.classList.toggle('fullscreen');
        if (!this.#isFullScreen) {
          this.#isFullScreen = true;
          if (this.#cfg.autoplay) {
            this.stop();
          }
        } else {
          this.#isFullScreen = false;
          if (this.#cfg.autoplay) {
            this.start();
          }
        }
        fsButton.title = title(this.#isFullScreen);
      });
      this.#root.append(fsButton);
    }
  }

  #stopMouseTracker() {
    this.#root.classList.add('carousel-hide-controls');
    if (this.#mouseTracker) {
      clearInterval(this.#mouseTracker);
      this.#mouseTracker = undefined;
    }
  }

  #startMouseTracker() {
    this.#lastMouseMove = Date.now();
    if (!this.#mouseTracker) {
      this.#root.classList.remove('carousel-hide-controls');
      // check mouse idle time every second
      this.#mouseTracker = setInterval(() => {
        if (this.#mouseTracker && this.#lastMouseMove
          && Date.now() > this.#lastMouseMove + this.#cfg.idleness) {
          this.#stopMouseTracker();
        }
      }, 1000);
    }
  }

  #manageControls() {
    const {
      idleness,
    } = this.#cfg;
    if (idleness > 0) {
      // show controls when mouse is in range and hide when idle for 5s
      this.#root.classList.add('carousel-hide-controls');
      this.#root.addEventListener('mouseleave', () => {
        this.#stopMouseTracker();
      }, { passive: true });
      this.#root.addEventListener('mousemove', () => {
        this.#startMouseTracker();
      }, { passive: true });
    }
  }

  #detectUserInput() {
    // detect horizontal swiping
    this.#root.addEventListener('touchstart', ({ changedTouches }) => {
      this.touchstart = changedTouches[0].screenX;
    }, { passive: true });
    this.#root.addEventListener('touchend', ({ changedTouches }) => {
      this.#swipeHandler(changedTouches[0].screenX);
    }, { passive: true });

    // detect arrow and esc keys
    document.addEventListener('keyup', ({ key }) => {
      if (this.#isFullScreen) {
        if (key === 'ArrowLeft') {
          this.previousSlide(true);
        } else if (key === 'ArrowRight') {
          this.nextSlide(true);
        } else if (key === 'Escape' && this.#isFullScreen) {
          this.#root.querySelector('.carousel-fullscreen-toggle').click();
        }
      }
    }, { passive: true });
  }
}

export default function decorate(block) {
  const slides = [...block.querySelectorAll('picture')].map((pic) => {
    const slide = document.createElement('div');
    slide.append(pic);
    return slide;
  });
  block.innerHTML = '';

  // draw carousel
  const carousel = new Carousel(slides, {
  });
  carousel.draw(block);
}

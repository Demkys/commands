const CONFIG = {
  animations: {
    duration: 300,
    easing: "ease-out",
    stagger: 100,
  },

  scroll: {
    throttleDelay: 16,
    offsetThreshold: 300,
  },

  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },
}

const Utils = {
  throttle(func, delay) {
    let timeoutId
    let lastExecTime = 0
    return function (...args) {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args)
        lastExecTime = currentTime
      } else {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(
          () => {
            func.apply(this, args)
            lastExecTime = Date.now()
          },
          delay - (currentTime - lastExecTime),
        )
      }
    }
  },

  debounce(func, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  supports: {
    intersectionObserver: "IntersectionObserver" in window,
    requestIdleCallback: "requestIdleCallback" in window,
    passiveEvents: (() => {
      let supportsPassive = false
      try {
        const opts = Object.defineProperty({}, "passive", {
          get() {
            supportsPassive = true
            return true
          },
        })
        window.addEventListener("testPassive", null, opts)
        window.removeEventListener("testPassive", null, opts)
      } catch (e) {}
      return supportsPassive
    })(),
  },

  device: {
    isMobile: () => window.innerWidth <= CONFIG.breakpoints.mobile,
    isTablet: () => window.innerWidth <= CONFIG.breakpoints.tablet && window.innerWidth > CONFIG.breakpoints.mobile,
    isDesktop: () => window.innerWidth > CONFIG.breakpoints.tablet,
    isTouchDevice: () => "ontouchstart" in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  },

  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    })
  },

  random(min, max) {
    return Math.random() * (max - min) + min
  },
}

class CommandsApp {
  constructor() {
    this.elements = {}
    this.observers = {}
    this.isInitialized = false
    this.commandsData = []

    this.init()
  }

  init() {
    if (this.isInitialized) return

    this.loadCommandsData()
    this.cacheElements()
    this.setupEventListeners()
    this.initializeComponents()
    this.setupAnimations()

    this.isInitialized = true
    console.log("✅ CommandsApp initialized successfully")
  }

  loadCommandsData() {
    this.commandsData = [
      {
        category: "tracking",
        icon: "📊",
        title: "Отслеживание воздержания",
        commands: [
          {
            triggers: ["/begin"],
            description: "Начать отсчет воздержания. Можно указать произвольную дату начала.",
            isAdmin: false,
          },
          {
            triggers: ["/sliv"],
            description: "Сбросить счетчик воздержания после рецидива.",
            isAdmin: false,
          },
          {
            triggers: ["кто я", "хто я", "кто я?"],
            description: "Проверить текущий статус воздержания и бейдж.",
            isAdmin: false,
          },
          {
            triggers: ["обо мне"],
            description: "Показать информацию о воздержании со стилизованным изображением.",
            isAdmin: false,
          },
          {
            triggers: ["/progress", "прогресс [число]"],
            description: "Показать прогресс за указанное количество дней.",
            isAdmin: false,
          },
          {
            triggers: ["/streak"],
            description: "Показать серию воздержания с изображением огня.",
            isAdmin: false,
          },
          {
            triggers: ["ранг", "топ", "/top"],
            description: "Показать топ пользователей по длительности воздержания в текущем чате.",
            isAdmin: false,
          },
          {
            triggers: ["Сливы = число"],
            description: "Установить количество рецидивов на указанное число.",
            isAdmin: false,
          },
          {
            triggers: ["Рекорд = число"],
            description: "Установить рекорд воздержания на указанное число дней.",
            isAdmin: false,
          },
        ],
      },
      {
        category: "admin",
        icon: "🛡️",
        title: "Команды администратора",
        commands: [
          {
            triggers: ["бан @username", "/ban @username"],
            description: "Забанить пользователя в чате.",
            isAdmin: true,
          },
          {
            triggers: ["мут @username", "/mute @username"],
            description: "Заглушить пользователя на указанное время.",
            isAdmin: true,
          },
          {
            triggers: ["разбан @username", "/unban @username"],
            description: "Разбанить пользователя в чате.",
            isAdmin: true,
          },
          {
            triggers: ["/warn", "нова варн", "нова предупредить", "предупредить"],
            description: "Выдать предупреждение пользователю.",
            isAdmin: true,
          },
          {
            triggers: ["предупреждения", "чекнуть предупреждения", "/checkwarn"],
            description: "Проверить предупреждения пользователя.",
            isAdmin: false,
          },
          {
            triggers: [
              "сбросить предупреждения",
              "сброс предупреждений",
              "убрать предупреждения",
              "удалить предупреждения",
            ],
            description: "Сбросить все предупреждения пользователя.",
            isAdmin: true,
          },
          {
            triggers: ["закреп", "закрепить", "pin"],
            description: "Закрепить сообщение в чате.",
            isAdmin: true,
          },
          {
            triggers: ["открепить", "unpin"],
            description: "Открепить сообщение в чате.",
            isAdmin: true,
          },
          {
            triggers: ["нова удалить"],
            description: "Удалить сообщение, на которое был дан ответ.",
            isAdmin: true,
          },
        ],
      },
      {
        category: "utility",
        icon: "🔧",
        title: "Полезные команды",
        commands: [
          {
            triggers: ["бот", "нова"],
            description: "Проверить, работает ли бот.",
            isAdmin: false,
          },
          {
            triggers: ["команды", "нова команды", "/cm"],
            description: "Показать список доступных команд.",
            isAdmin: false,
          },
          {
            triggers: ["правила", "/rules", "нова правила"],
            description: "Показать правила чата.",
            isAdmin: false,
          },
          {
            triggers: ["/wiki [запрос]", "вики [запрос]"],
            description: "Искать информацию в Википедии.",
            isAdmin: false,
          },
          {
            triggers: ["/q"],
            description: "Создать стикер-цитату из сообщения.",
            isAdmin: false,
          },
          {
            triggers: ["/feedback"],
            description: "Отправить отзыв о боте администраторам.",
            isAdmin: false,
          },
        ],
      },
      {
        category: "fun",
        icon: "🎮",
        title: "Развлекательные команды",
        commands: [
          {
            triggers: ["бот инфа [вопрос]", "нова инфа [вопрос]"],
            description: "Получить случайный процентный ответ на ваш вопрос.",
            isAdmin: false,
          },
        ],
      },
      {
        category: "currency",
        icon: "💰",
        title: "Система валюты",
        commands: [
          {
            triggers: [
              "монеты",
              "монетки",
              "мешок",
              "мой мешок",
              "деньги",
              "баланс",
              "мой баланс",
              "мои монеты",
              "сбережения",
              "карман",
              "кошелек",
              "счёт",
              "мой счёт",
              "кошелёк",
            ],
            description: "Проверить баланс NFC монет.",
            isAdmin: false,
          },
          {
            triggers: ["/promo [код]"],
            description: "Активировать промокод для получения NFC монет.",
            isAdmin: false,
          },
          {
            triggers: ["передать [количество]"],
            description: "Передать NFC монеты другому пользователю.",
            isAdmin: false,
          },
          {
            triggers: ["магазин", "shop", "купить стили", "покупка", "приобрести стиль"],
            description: "Открыть магазин для покупки стилей за NFC монеты.",
            isAdmin: false,
          },
          {
            triggers: ["мои стили", "стили", "купленые стили", "купленные стили", "оформление", "оформления", "корман"],
            description: "Просмотреть и выбрать купленные стили.",
            isAdmin: false,
          },
        ],
      },
    ]
  }

  cacheElements() {
    this.elements = {
      navigation: document.getElementById("navigation"),
      navToggle: document.getElementById("navToggle"),
      navMenu: document.getElementById("navMenu"),
      navLinks: document.querySelectorAll(".nav-link"),

      progressBar: document.getElementById("progressBar"),
      scrollToTop: document.getElementById("scrollToTop"),

      search: document.getElementById("search"),
      commandsContainer: document.getElementById("commands-container"),
      noResults: document.getElementById("no-results"),
      categoryFilters: document.querySelectorAll(".category-filter"),

      sections: document.querySelectorAll(".category"),
      animatedElements: document.querySelectorAll('[class*="card"], [class*="item"], [class*="block"]'),

      gradientOrbs: document.querySelectorAll(".gradient-orb"),
      floatingShapes: document.querySelectorAll(".shape"),
    }
  }

  setupEventListeners() {
    const passiveOptions = Utils.supports.passiveEvents ? { passive: true } : false

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.handleScroll()
      }, CONFIG.scroll.throttleDelay),
      passiveOptions,
    )

    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        this.handleResize()
      }, 250),
      passiveOptions,
    )

    if (this.elements.navToggle) {
      this.elements.navToggle.addEventListener("click", () => {
        this.toggleMobileMenu()
      })
    }

    this.elements.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        this.handleNavClick(e, link)
      })
    })

    if (this.elements.scrollToTop) {
      this.elements.scrollToTop.addEventListener("click", () => {
        this.scrollToTop()
      })
    }

    if (this.elements.search) {
      this.elements.search.addEventListener("input", (e) => {
        const activeCategory = document.querySelector(".category-filter.active").dataset.category
        this.filterCommands(e.target.value, activeCategory)
      })
    }

    this.elements.categoryFilters.forEach((button) => {
      button.addEventListener("click", () => {
        this.elements.categoryFilters.forEach((btn) => {
          btn.classList.remove("active")
        })
        button.classList.add("active")

        const category = button.dataset.category
        const searchQuery = this.elements.search.value
        this.filterCommands(searchQuery, category)
      })
    })

    document.addEventListener("keydown", (e) => {
      this.handleKeydown(e)
    })

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault()
      return false
    })

    document.addEventListener(
      "dblclick",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )
  }

  initializeComponents() {
    this.setupProgressBar()
    this.setupSmoothScrolling()
    this.setupActiveNavigation()
    this.renderCommands()

    if (!Utils.device.prefersReducedMotion()) {
      this.animateBackground()
    }
  }

  setupAnimations() {
    if (Utils.device.prefersReducedMotion()) {
      console.log("🔇 Animations disabled due to user preference")
      return
    }

    if (Utils.supports.intersectionObserver) {
      this.setupIntersectionObserver()
    }

    this.animateOnLoad()
  }

  handleScroll() {
    const scrollY = window.pageYOffset

    this.updateProgressBar(scrollY)
    this.toggleScrollToTopButton(scrollY)
    this.updateActiveNavigation(scrollY)

    if (Utils.device.isDesktop() && !Utils.device.prefersReducedMotion()) {
      this.updateBackgroundParallax(scrollY)
    }
  }

  handleResize() {
    if (!Utils.device.isMobile() && this.elements.navMenu.classList.contains("active")) {
      this.closeMobileMenu()
    }

    this.recalculateNavPositions()
  }

  toggleMobileMenu() {
    const isActive = this.elements.navMenu.classList.contains("active")

    if (isActive) {
      this.closeMobileMenu()
    } else {
      this.openMobileMenu()
    }
  }

  openMobileMenu() {
    this.elements.navMenu.classList.add("active")
    this.elements.navToggle.classList.add("active")
    this.elements.navToggle.setAttribute("aria-expanded", "true")

    if (Utils.device.isMobile()) {
      document.body.style.overflow = "hidden"
    }
  }

  closeMobileMenu() {
    this.elements.navMenu.classList.remove("active")
    this.elements.navToggle.classList.remove("active")
    this.elements.navToggle.setAttribute("aria-expanded", "false")

    document.body.style.overflow = ""
  }

  handleNavClick(e, link) {
    e.preventDefault()

    const targetId = link.getAttribute("href")
    const targetElement = document.querySelector(targetId)

    if (targetElement) {
      const offset = this.elements.navigation.offsetHeight + 20
      Utils.smoothScrollTo(targetElement, offset)

      if (Utils.device.isMobile()) {
        this.closeMobileMenu()
      }

      this.setActiveNavLink(link)
    }
  }

  handleKeydown(e) {
    if (e.key === "Escape" && this.elements.navMenu.classList.contains("active")) {
      this.closeMobileMenu()
    }

    if (e.key === "Home" && e.ctrlKey) {
      e.preventDefault()
      this.scrollToTop()
    }

    if (e.key === "F12") {
      e.preventDefault()
      return false
    }

    if (
      e.ctrlKey &&
      e.shiftKey &&
      (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")
    ) {
      e.preventDefault()
      return false
    }

    if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
      e.preventDefault()
      return false
    }
  }

  setupProgressBar() {
    if (!this.elements.progressBar) return
    this.elements.progressBar.style.width = "0%"
  }

  updateProgressBar(scrollY) {
    if (!this.elements.progressBar) return

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = Math.min((scrollY / documentHeight) * 100, 100)

    this.elements.progressBar.style.width = `${progress}%`
  }

  toggleScrollToTopButton(scrollY) {
    if (!this.elements.scrollToTop) return

    const shouldShow = scrollY > CONFIG.scroll.offsetThreshold

    if (shouldShow && !this.elements.scrollToTop.classList.contains("visible")) {
      this.elements.scrollToTop.classList.add("visible")
    } else if (!shouldShow && this.elements.scrollToTop.classList.contains("visible")) {
      this.elements.scrollToTop.classList.remove("visible")
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  setupSmoothScrolling() {}

  setupActiveNavigation() {
    this.sectionPositions = []
    this.recalculateNavPositions()
  }

  recalculateNavPositions() {
    this.sectionPositions = Array.from(this.elements.sections).map((section) => ({
      id: section.id,
      offsetTop: section.offsetTop,
      offsetBottom: section.offsetTop + section.offsetHeight,
    }))
  }

  updateActiveNavigation(scrollY) {
    const offset = this.elements.navigation.offsetHeight + 50
    const currentPosition = scrollY + offset

    let activeSection = null

    for (const section of this.sectionPositions) {
      if (currentPosition >= section.offsetTop && currentPosition < section.offsetBottom) {
        activeSection = section.id
        break
      }
    }

    if (activeSection) {
      const activeLink = document.querySelector(`.nav-link[href="#${activeSection}"]`)
      if (activeLink) {
        this.setActiveNavLink(activeLink)
      }
    }
  }

  setActiveNavLink(activeLink) {
    this.elements.navLinks.forEach((link) => {
      link.classList.remove("active")
    })

    activeLink.classList.add("active")
  }

  updateBackgroundParallax(scrollY) {
    const parallaxSpeed = 0.5
    const offset = scrollY * parallaxSpeed

    this.elements.gradientOrbs.forEach((orb, index) => {
      const speed = 0.3 + index * 0.1
      orb.style.transform = `translateY(${offset * speed}px)`
    })
  }

  animateBackground() {
    if (Utils.device.isMobile()) return

    this.elements.gradientOrbs.forEach((orb, index) => {
      const delay = index * 2000
      const duration = 20000 + index * 5000

      orb.style.animationDelay = `${delay}ms`
      orb.style.animationDuration = `${duration}ms`
    })

    this.elements.floatingShapes.forEach((shape, index) => {
      const delay = index * 1000
      const duration = 15000 + index * 2000

      shape.style.animationDelay = `${delay}ms`
      shape.style.animationDuration = `${duration}ms`
    })
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    this.observers.main = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")
          this.observers.main.unobserve(entry.target)
        }
      })
    }, observerOptions)

    this.elements.animatedElements.forEach((element) => {
      this.observers.main.observe(element)
    })
  }

  animateOnLoad() {
    document.body.classList.add("loaded")

    this.elements.sections.forEach((section, index) => {
      section.style.opacity = "0"
      section.style.transform = "translateY(20px)"
      section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`
      setTimeout(() => {
        section.style.opacity = "1"
        section.style.transform = "translateY(0)"
      }, index * CONFIG.animations.stagger)
    })
  }

  renderCommands(filteredCommands = null, categoryFilter = "all") {
    const container = this.elements.commandsContainer
    const noResults = this.elements.noResults
    container.innerHTML = ""

    const commandsToRender = filteredCommands || this.commandsData
    let hasResults = false

    for (const category of commandsToRender) {
      if (categoryFilter !== "all" && category.category !== categoryFilter) continue
      if (category.commands.length === 0) continue

      hasResults = true

      const categorySection = document.createElement("section")
      categorySection.className = "category"
      categorySection.id = category.category

      const categoryHeader = document.createElement("div")
      categoryHeader.className = "category-header"

      const categoryIcon = document.createElement("div")
      categoryIcon.className = "category-icon"
      categoryIcon.textContent = category.icon

      const categoryTitle = document.createElement("h2")
      categoryTitle.className = "category-title"
      categoryTitle.textContent = category.title

      categoryHeader.appendChild(categoryIcon)
      categoryHeader.appendChild(categoryTitle)
      categorySection.appendChild(categoryHeader)

      const commandsGrid = document.createElement("div")
      commandsGrid.className = "commands-grid"

      category.commands.forEach((cmd) => {
        const card = document.createElement("div")
        card.className = "command-card"

        const triggers = document.createElement("div")
        triggers.className = "command-triggers"

        cmd.triggers.forEach((trigger) => {
          const triggerSpan = document.createElement("span")
          triggerSpan.className = "command-trigger"
          triggerSpan.textContent = trigger
          triggers.appendChild(triggerSpan)
        })

        const description = document.createElement("p")
        description.className = "command-description"
        description.textContent = cmd.description

        if (cmd.isAdmin) {
          const adminBadge = document.createElement("span")
          adminBadge.className = "admin-badge"
          adminBadge.textContent = "АДМИН"
          description.appendChild(adminBadge)
        }

        card.appendChild(triggers)
        card.appendChild(description)
        commandsGrid.appendChild(card)
      })

      categorySection.appendChild(commandsGrid)
      container.appendChild(categorySection)
    }

    noResults.style.display = hasResults ? "none" : "block"

    // Update cached elements after rendering
    this.elements.sections = document.querySelectorAll(".category")
    this.elements.animatedElements = document.querySelectorAll('[class*="card"], [class*="item"], [class*="block"]')

    // Re-setup animations for new elements
    if (Utils.supports.intersectionObserver && !Utils.device.prefersReducedMotion()) {
      this.setupIntersectionObserver()
    }
  }

  filterCommands(query, categoryFilter = "all") {
    if (!query && categoryFilter === "all") {
      this.renderCommands(null, "all")
      return
    }

    query = query.toLowerCase()

    const filtered = this.commandsData.map((category) => {
      const filteredCommands = category.commands.filter((cmd) => {
        const matchesQuery =
          !query ||
          cmd.triggers.some((t) => t.toLowerCase().includes(query)) ||
          cmd.description.toLowerCase().includes(query)

        const matchesCategory = categoryFilter === "all" || category.category === categoryFilter

        return matchesQuery && matchesCategory
      })

      return {
        ...category,
        commands: filteredCommands,
      }
    })

    this.renderCommands(filtered, categoryFilter)
  }

  destroy() {
    window.removeEventListener("scroll", this.handleScroll)
    window.removeEventListener("resize", this.handleResize)

    Object.values(this.observers).forEach((observer) => {
      if (observer && observer.disconnect) {
        observer.disconnect()
      }
    })

    this.isInitialized = false
    console.log("🧹 CommandsApp destroyed")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.requestAnimationFrame) {
    console.warn("⚠️ RequestAnimationFrame not supported")
    return
  }

  window.commandsApp = new CommandsApp()

  if (Utils.supports.requestIdleCallback) {
    requestIdleCallback(() => {
      console.log("🚀 Background tasks completed")
    })
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {})
  }
})

window.addEventListener("error", (e) => {
  console.error("❌ JavaScript Error:", e.error)
})

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CommandsApp, Utils, CONFIG }
}

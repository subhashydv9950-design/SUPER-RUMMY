
/* =========================================================
   SUPER RUMMY — FILE 79
   File: js/ui/notification-manager.js
   Purpose: Central Notification Manager
   ========================================================= */

export class NotificationManager {
  constructor(options = {}) {
    this.container =
      options.container ||
      document.querySelector("#notification-container");

    this.duration = options.duration ?? 3000;
    this.maxVisible = options.maxVisible ?? 4;
    this.notifications = [];
    this.nextId = 1;

    this.onNotification = options.onNotification || (() => {});

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "notification-container";
      document.body.appendChild(this.container);
    }

    this.container.classList.add("sr-notification-container");
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("aria-atomic", "false");
  }

  show(message, options = {}) {
    const text = String(message ?? "").trim();

    if (!text) return null;

    const notification = {
      id: this.nextId++,
      message: text,
      type: this.getType(options.type),
      duration: Math.max(0, options.duration ?? this.duration),
      title: String(options.title || ""),
      createdAt: Date.now(),
      timer: null,
      element: null
    };

    this.notifications.push(notification);

    while (this.notifications.length > this.maxVisible) {
      this.remove(this.notifications[0].id);
    }

    this.renderNotification(notification);

    try {
      this.onNotification({
        id: notification.id,
        message: notification.message,
        type: notification.type
      });
    } catch {
      // Notification display should not fail
      // because an optional callback failed.
    }

    return notification.id;
  }

  getType(type) {
    const allowed = [
      "success",
      "error",
      "warning",
      "info"
    ];

    return allowed.includes(type) ? type : "info";
  }

  renderNotification(notification) {
    const element = document.createElement("div");

    element.className =
      `sr-notification sr-notification-${notification.type}`;

    element.dataset.notificationId = String(notification.id);
    element.setAttribute("role", "status");

    const iconMap = {
      success: "✓",
      error: "!",
      warning: "⚠",
      info: "i"
    };

    const icon = document.createElement("span");
    icon.className = "sr-notification-icon";
    icon.textContent = iconMap[notification.type];

    const content = document.createElement("div");
    content.className = "sr-notification-content";

    if (notification.title) {
      const title = document.createElement("strong");
      title.className = "sr-notification-title";
      title.textContent = notification.title;
      content.appendChild(title);
    }

    const message = document.createElement("span");
    message.className = "sr-notification-message";
    message.textContent = notification.message;

    content.appendChild(message);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "sr-notification-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Dismiss notification");

    closeButton.addEventListener("click", () => {
      this.remove(notification.id);
    });

    element.append(icon, content, closeButton);
    notification.element = element;

    this.container.appendChild(element);

    requestAnimationFrame(() => {
      element.classList.add("is-visible");
    });

    if (notification.duration > 0) {
      notification.timer = setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  success(message, options = {}) {
    return this.show(message, {
      ...options,
      type: "success"
    });
  }

  error(message, options = {}) {
    return this.show(message, {
      ...options,
      type: "error"
    });
  }

  warning(message, options = {}) {
    return this.show(message, {
      ...options,
      type: "warning"
    });
  }

  info(message, options = {}) {
    return this.show(message, {
      ...options,
      type: "info"
    });
  }

  remove(id) {
    const index = this.notifications.findIndex(
      item => item.id === id
    );

    if (index === -1) return false;

    const [notification] = this.notifications.splice(index, 1);

    if (notification.timer) {
      clearTimeout(notification.timer);
    }

    if (notification.element) {
      notification.element.classList.remove("is-visible");

      const element = notification.element;

      setTimeout(() => {
        element.remove();
      }, 200);
    }

    return true;
  }

  clear() {
    for (const notification of [...this.notifications]) {
      this.remove(notification.id);
    }
  }

  destroy() {
    this.clear();

    if (this.container) {
      this.container.replaceChildren();
    }
  }
}

/* ================= FILE 79 END ================= */

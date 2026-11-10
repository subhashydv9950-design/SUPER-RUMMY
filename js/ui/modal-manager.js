
/* =========================================================
   SUPER RUMMY — FILE 82
   File: js/ui/modal-manager.js
   Purpose: Central Modal and Dialog Manager
   ========================================================= */

export class ModalManager {
  constructor(options = {}) {
    this.container =
      options.container ||
      document.querySelector("#modal-container");

    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "modal-container";
      document.body.appendChild(this.container);
    }

    this.activeModal = null;
    this.previousFocus = null;

    this.handleKeydown = this.handleKeydown.bind(this);
    document.addEventListener("keydown", this.handleKeydown);
  }

  open(options = {}) {
    if (this.activeModal) {
      this.close();
    }

    const title = String(options.title || "SUPER RUMMY");
    const content = String(options.content || "");
    const confirmText = String(options.confirmText || "OK");
    const cancelText = String(options.cancelText || "Cancel");

    this.previousFocus = document.activeElement;

    const backdrop = document.createElement("div");
    backdrop.className = "sr-modal-backdrop";
    backdrop.setAttribute("role", "presentation");

    const dialog = document.createElement("section");
    dialog.className = "sr-modal-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", title);

    const heading = document.createElement("h2");
    heading.className = "sr-modal-title";
    heading.textContent = title;

    const body = document.createElement("div");
    body.className = "sr-modal-content";
    body.textContent = content;

    const actions = document.createElement("div");
    actions.className = "sr-modal-actions";

    if (options.showCancel !== false) {
      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "sr-modal-cancel";
      cancelButton.textContent = cancelText;

      cancelButton.addEventListener("click", () => {
        this.close("cancel");
        options.onCancel?.();
      });

      actions.appendChild(cancelButton);
    }

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "sr-modal-confirm";
    confirmButton.textContent = confirmText;

    confirmButton.addEventListener("click", () => {
      this.close("confirm");
      options.onConfirm?.();
    });

    actions.appendChild(confirmButton);

    dialog.append(heading, body, actions);
    backdrop.appendChild(dialog);
    this.container.appendChild(backdrop);

    this.activeModal = {
      backdrop,
      dialog,
      options
    };

    if (options.closeOnBackdrop !== false) {
      backdrop.addEventListener("click", event => {
        if (event.target === backdrop) {
          this.close("backdrop");
          options.onCancel?.();
        }
      });
    }

    confirmButton.focus();

    return dialog;
  }

  confirm(message, options = {}) {
    return this.open({
      ...options,
      title: options.title || "Confirm",
      content: message,
      confirmText: options.confirmText || "Yes",
      cancelText: options.cancelText || "No",
      showCancel: true
    });
  }

  alert(message, options = {}) {
    return this.open({
      ...options,
      title: options.title || "Notice",
      content: message,
      confirmText: options.confirmText || "OK",
      showCancel: false
    });
  }

  handleKeydown(event) {
    if (!this.activeModal) return;

    if (event.key === "Escape") {
      if (this.activeModal.options.closeOnEscape !== false) {
        this.close("escape");
        this.activeModal?.options.onCancel?.();
      }
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = this.activeModal.dialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), ' +
      'textarea:not([disabled]), select:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  close(reason = "close") {
    if (!this.activeModal) return false;

    const modal = this.activeModal;
    this.activeModal = null;

    modal.backdrop.remove();

    if (this.previousFocus?.isConnected) {
      this.previousFocus.focus();
    }

    this.previousFocus = null;

    return reason;
  }

  isOpen() {
    return Boolean(this.activeModal);
  }

  destroy() {
    this.close("destroy");
    document.removeEventListener("keydown", this.handleKeydown);
    this.container.replaceChildren();
  }
}

/* ================= FILE 82 END ================= */

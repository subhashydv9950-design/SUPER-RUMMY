
/* =========================================================
   SUPER RUMMY — FILE 77
   File: js/ui/profile-edit-screen.js
   Purpose: Player Profile Edit Screen
   ========================================================= */

export class ProfileEditScreen {
  constructor(options = {}) {
    this.container = options.container || null;
    this.profile = {
      name: options.profile?.name || "Guest Player",
      avatar: options.profile?.avatar || "",
      bio: options.profile?.bio || ""
    };

    this.onSave = options.onSave || (() => {});
    this.onBack = options.onBack || (() => {});

    this.element = null;
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleBack = this.handleBack.bind(this);
  }

  escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  render() {
    if (!this.container) {
      throw new Error("ProfileEditScreen requires a container.");
    }

    this.element = document.createElement("section");
    this.element.className = "sr-profile-edit-screen";

    this.element.innerHTML = `
      <div class="sr-profile-edit-header">
        <button type="button" class="sr-profile-edit-back">
          ← Back
        </button>
        <h2>Edit Profile</h2>
      </div>

      <form class="sr-profile-edit-form">
        <div class="sr-profile-edit-avatar">
          <div class="sr-profile-edit-avatar-preview">
            ${
              this.profile.avatar
                ? `<img src="${this.escapeHTML(this.profile.avatar)}"
                    alt="Profile avatar">`
                : `<span>👤</span>`
            }
          </div>
          <label for="sr-profile-avatar">Avatar Image URL</label>
          <input
            id="sr-profile-avatar"
            name="avatar"
            type="url"
            maxlength="1000"
            placeholder="https://example.com/avatar.jpg"
            value="${this.escapeHTML(this.profile.avatar)}"
          >
        </div>

        <div class="sr-profile-edit-field">
          <label for="sr-profile-name">Player Name</label>
          <input
            id="sr-profile-name"
            name="name"
            type="text"
            minlength="2"
            maxlength="24"
            required
            autocomplete="nickname"
            value="${this.escapeHTML(this.profile.name)}"
          >
        </div>

        <div class="sr-profile-edit-field">
          <label for="sr-profile-bio">About Me</label>
          <textarea
            id="sr-profile-bio"
            name="bio"
            maxlength="120"
            rows="3"
            placeholder="Write something about yourself..."
          >${this.escapeHTML(this.profile.bio)}</textarea>
        </div>

        <p class="sr-profile-edit-message" aria-live="polite"></p>

        <div class="sr-profile-edit-actions">
          <button type="button" class="sr-profile-edit-cancel">
            Cancel
          </button>
          <button type="submit" class="sr-profile-edit-save">
            Save Profile
          </button>
        </div>
      </form>
    `;

    this.container.replaceChildren(this.element);
    this.bindEvents();

    return this.element;
  }

  bindEvents() {
    const form = this.element.querySelector(".sr-profile-edit-form");

    form.addEventListener("submit", this.handleSubmit);

    this.element
      .querySelector(".sr-profile-edit-back")
      .addEventListener("click", this.handleBack);

    this.element
      .querySelector(".sr-profile-edit-cancel")
      .addEventListener("click", this.handleBack);

    this.element
      .querySelector("#sr-profile-avatar")
      .addEventListener("input", event => {
        this.updateAvatarPreview(event.target.value);
      });
  }

  updateAvatarPreview(url) {
    const preview = this.element.querySelector(
      ".sr-profile-edit-avatar-preview"
    );

    preview.replaceChildren();

    if (!url.trim()) {
      const placeholder = document.createElement("span");
      placeholder.textContent = "👤";
      preview.appendChild(placeholder);
      return;
    }

    try {
      const parsed = new URL(url);

      if (!["https:", "http:"].includes(parsed.protocol)) {
        throw new Error("Invalid image URL");
      }

      const image = document.createElement("img");
      image.src = parsed.href;
      image.alt = "Profile avatar";

      image.onerror = () => {
        preview.textContent = "👤";
      };

      preview.appendChild(image);
    } catch {
      preview.textContent = "👤";
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const avatar = String(formData.get("avatar") || "").trim();
    const bio = String(formData.get("bio") || "").trim();

    const message = this.element.querySelector(
      ".sr-profile-edit-message"
    );

    if (name.length < 2 || name.length > 24) {
      message.textContent = "Name must contain 2–24 characters.";
      return;
    }

    if (bio.length > 120) {
      message.textContent = "Bio cannot exceed 120 characters.";
      return;
    }

    if (avatar) {
      try {
        const parsed = new URL(avatar);

        if (!["https:", "http:"].includes(parsed.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        message.textContent = "Please enter a valid avatar image URL.";
        return;
      }
    }

    const updatedProfile = {
      ...this.profile,
      name,
      avatar,
      bio,
      updatedAt: Date.now()
    };

    try {
      this.onSave(updatedProfile);
      this.profile = updatedProfile;
      message.textContent = "Profile saved successfully.";
    } catch (error) {
      message.textContent =
        error?.message || "Unable to save profile.";
    }
  }

  handleBack() {
    this.onBack();
  }

  updateProfile(profile = {}) {
    this.profile = {
      ...this.profile,
      ...profile
    };

    this.render();
  }

  destroy() {
    if (this.element) {
      const form = this.element.querySelector(
        ".sr-profile-edit-form"
      );

      form?.removeEventListener("submit", this.handleSubmit);
      this.element.remove();
      this.element = null;
    }

    this.container = null;
  }
}

/* ================= FILE 77 END ================= */

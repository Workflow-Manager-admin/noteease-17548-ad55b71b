//
// NoteEase Main Container (Vite - Vanilla JS/ES6+)
// Features: search, filter chips, notes list, add/edit/delete, FAB, basic text formatting
// No frameworks, pure DOM, CSS variables for theming
//
// PUBLIC_INTERFACE
export class NoteEaseMain {
  /**
   * Initialize and mount the main container for NoteEase.
   * @param {HTMLElement} root - The root element to mount app in.
   */
  constructor(root) {
    /** Internal state */
    this.notes = [];      // Array of notes: { id, title, content, categories }
    this.filters = [];    // Array of active filter/category strings
    this.categories = []; // All categories (unique)
    this.search = "";     // Current search keyword
    this.editId = null;   // If not null, note id currently being edited
    this._noteIdCounter = 1;
    this.root = root;
    this._setupTheme();
    this.render();
  }

  // PUBLIC_INTERFACE
  /** Main render method. */
  render() {
    this.root.innerHTML = "";
    this._renderStyles();

    const app = document.createElement('div');
    app.className = "ne-container";

    // Search bar
    app.appendChild(this._renderSearchBar());

    // Filter chips
    if (this.categories.length) app.appendChild(this._renderFilterChips());

    // Notes list
    if (this.notes.length) app.appendChild(this._renderNotesList());
    else app.appendChild(this._renderEmptyState());

    // Floating action button
    app.appendChild(this._renderFAB());

    // If creating or editing a note, render modal
    if (this._showNoteModal) {
      app.appendChild(this._renderNoteModal());
    }

    this.root.appendChild(app);
  }

  // ========== Render component methods =============

  _renderStyles() {
    // Add theme (light) and color palette
    if (document.getElementById('ne-theme-style')) return;
    const style = document.createElement('style');
    style.id = 'ne-theme-style';
    style.innerHTML = `
      :root {
        --ne-primary: #4A90E2;
        --ne-secondary: #FFFFFF;
        --ne-accent: #F5A623;
        --ne-bg: #f7f8fa;
        --ne-text: #212529;
        --ne-faint: #e9eef5;
      }
      .ne-container {
        background: var(--ne-bg);
        color: var(--ne-text);
        max-width: 520px;
        min-height: 90vh;
        margin: 2rem auto;
        border-radius: 16px;
        box-shadow: 0 4px 32px #23272f09;
        position: relative;
        padding: 2rem 1.5rem 3.8rem 1.5rem;
        font-family: system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }
      .ne-searchbar {
        display: flex;
        align-items: center;
        background: var(--ne-secondary);
        border-radius: 8px;
        box-shadow: 0 2px 8px #12334710;
        padding: 0.5rem 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--ne-faint);
      }
      .ne-search-input {
        border: none;
        background: transparent;
        outline: none;
        flex: 1;
        font-size: 1.1rem;
        color: var(--ne-text);
      }
      .ne-filter-chips {
        display: flex;
        gap: 0.5rem;
        margin: 2px 0 1.1rem 0;
        flex-wrap: wrap;
      }
      .ne-chip {
        font-size: 0.98rem;
        background: var(--ne-faint);
        color: var(--ne-primary);
        border: none;
        border-radius: 16px;
        padding: 0.4em 1.1em;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }
      .ne-chip.selected, .ne-chip:hover {
        background: var(--ne-primary);
        color: #fff;
      }
      .ne-list {
        flex: 1 1 auto;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-height: 120px;
      }
      .ne-note-item {
        background: var(--ne-secondary);
        border-radius: 12px;
        padding: 1rem 1.2rem 1rem 1rem;
        border: 1px solid var(--ne-faint);
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
        box-shadow: 0 2px 12px #466da408;
        transition: box-shadow 0.18s;
      }
      .ne-note-main {
        flex: 1;
        cursor: pointer;
        text-align: left;
      }
      .ne-note-title {
        font-size: 1.11em;
        font-weight: 700;
        color: var(--ne-primary);
        margin-bottom: 0.1em;
      }
      .ne-note-snippet {
        font-size: 1.01em;
        color: #444;
        opacity: 0.87;
      }
      .ne-note-taglist {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35em;
        margin: 0.28em 0 0 0;
      }
      .ne-note-tag {
        background: var(--ne-faint);
        color: var(--ne-accent);
        border-radius: 6px;
        padding: 1px 7px;
        font-size: 0.86em;
      }
      .ne-note-actions {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-left: 1.11rem;
      }
      .ne-action-btn {
        border: none;
        background: transparent;
        color: var(--ne-accent);
        font-size: 1.26em;
        cursor: pointer;
        padding: 0.2em;
        transition: color 0.18s;
      }
      .ne-action-btn:hover {
        color: #E3500C;
      }
      .ne-fab {
        position: fixed;
        bottom: 2.1rem;
        right: 2.6rem;
        background: var(--ne-primary);
        color: #fff;
        border-radius: 50%;
        padding: 0.7em 0.9em 0.7em 0.95em;
        font-size: 2em;
        cursor: pointer;
        box-shadow: 0 10px 32px #357ad81c;
        border: none;
        z-index: 9;
        outline: none;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .ne-fab:hover {
        background: var(--ne-accent);
        color: #fff;
        box-shadow: 0 8px 28px #f5a62324;
      }
      .ne-modal {
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100dvh;
        z-index: 2000;
        background: #0005;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .ne-modal-card {
        background: var(--ne-secondary);
        border-radius: 13px;
        padding: 2rem 1.4rem 1.3rem 1.4rem;
        min-width: 320px;
        max-width: 95vw;
        width: 390px;
        box-shadow: 0 6px 46px #0004, 0 1px 6px #1233470a;
        position: relative;
        display: flex;
        flex-direction: column;
      }
      .ne-modal-title {
        font-size: 1.23em;
        font-weight: bold;
        color: var(--ne-primary);
        margin-bottom: 0.3rem;
      }
      .ne-edit-title-input {
        background: var(--ne-faint);
        color: var(--ne-text);
        font-weight: 600;
        border: none;
        border-radius: 8px;
        padding: 0.6em 0.8em;
        font-size: 1.08em;
        margin: 6px 0 8px 0;
        outline: none;
        margin-bottom: 0.5rem;
      }
      .ne-edit-content-input {
        background: var(--ne-faint);
        color: var(--ne-text);
        min-height: 80px;
        resize: vertical;
        border: none;
        border-radius: 8px;
        padding: 0.7em 0.8em;
        font-size: 1em;
        margin-bottom: 0.6rem;
        outline: none;
      }
      .ne-modal-row {
        display: flex;
        align-items: center;
        gap: 0.3em;
        margin-top: 0.6em;
      }
      .ne-edit-categories-input {
        flex: 1;
        border: none;
        background: var(--ne-faint);
        color: var(--ne-text);
        border-radius: 6px;
        padding: 0.4em 0.7em;
      }
      .ne-edit-toolbar {
        display: flex;
        gap: 0.5em;
        margin-bottom: 0.4em;
      }
      .ne-edit-toolbar-btn {
        background: var(--ne-faint);
        color: var(--ne-primary);
        border: none;
        border-radius: 6px;
        font-size: 1.13em;
        padding: 0.27em 0.58em;
        cursor: pointer;
        transition: background 0.18s;
      }
      .ne-edit-toolbar-btn:hover {
        background: var(--ne-primary);
        color: #fff;
      }
      .ne-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1em;
        margin-top: 1.11rem;
      }
      .ne-modal-actions button {
        font-size: 1em;
        font-weight: 600;
        padding: 0.54em 1.45em;
        border-radius: 8px;
        border: none;
        cursor: pointer;
      }
      .ne-modal-actions .close-btn {
        background: #cccccc44;
        color: var(--ne-text);
      }
      .ne-modal-actions .confirm-btn {
        background: var(--ne-primary);
        color: #fff;
      }
      .ne-empty-state {
        text-align: center;
        color: #bfc1c7;
        font-size: 1.13em;
        margin-top: 2.6rem;
      }
      @media (max-width: 600px) {
        .ne-container {
          margin: 0;
          max-width: 99vw;
          min-height: 100vh;
          border-radius: 0;
          box-shadow: none;
          padding: 1.4rem 0.3rem 5rem 0.3rem;
        }
        .ne-fab {
          right: 1.5rem;
          bottom: 1.2rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  _renderSearchBar() {
    const wrap = document.createElement('div');
    wrap.className = 'ne-searchbar';

    const searchIcon = document.createElement('span');
    searchIcon.innerHTML = '🔍';
    searchIcon.style.marginRight = '0.7em';

    const input = document.createElement('input');
    input.className = 'ne-search-input';
    input.type = 'text';
    input.placeholder = 'Search notes...';
    input.value = this.search;
    input.autocomplete = 'off';
    input.addEventListener('input', (e) => {
      this.search = e.target.value;
      this.render();
    });

    wrap.appendChild(searchIcon);
    wrap.appendChild(input);
    return wrap;
  }

  _renderFilterChips() {
    const wrap = document.createElement('div');
    wrap.className = "ne-filter-chips";
    // "All" category chip
    const chipAll = document.createElement('button');
    chipAll.className = 'ne-chip' + (this.filters.length === 0 ? ' selected' : '');
    chipAll.textContent = "All";
    chipAll.onclick = () => { this.filters = []; this.render(); };
    wrap.appendChild(chipAll);

    // Render each chip
    for (const cat of this.categories) {
      const chip = document.createElement('button');
      chip.className = "ne-chip" + (this.filters.includes(cat) ? " selected" : "");
      chip.textContent = cat;
      chip.onclick = () => {
        if (this.filters.includes(cat)) {
          // Remove filter
          this.filters = this.filters.filter(f => f !== cat); 
        } else {
          // Add filter, single filter at a time for now
          this.filters = [cat];
        }
        this.render();
      };
      wrap.appendChild(chip);
    }
    return wrap;
  }

  _renderNotesList() {
    // Filtered & searched list
    let filtered = this.notes;
    if (this.filters.length)
      filtered = filtered.filter(note => note.categories.some(cat => this.filters.includes(cat)));
    if (this.search)
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(this.search.toLowerCase()) ||
        note.content.toLowerCase().includes(this.search.toLowerCase())
      );

    const list = document.createElement('div');
    list.className = "ne-list";
    for (const note of filtered) {
      const item = document.createElement('div');
      item.className = "ne-note-item";
      // Main click area: title, snippet, tags
      const main = document.createElement('div');
      main.className = "ne-note-main";
      main.onclick = () => this._openEditNote(note.id);
      // Title
      const title = document.createElement('div');
      title.className = "ne-note-title";
      title.textContent = note.title || "Untitled";
      // Content snippet (strip tags, first 120 chars)
      const snippet = document.createElement('div');
      snippet.className = "ne-note-snippet";
      snippet.textContent = (note.content ? this._stripHtml(note.content).slice(0,120) : "");
      // Tag list
      const taglist = document.createElement('div');
      taglist.className = "ne-note-taglist";
      for (const tag of note.categories) {
        const chip = document.createElement('span');
        chip.className = "ne-note-tag";
        chip.textContent = tag;
        taglist.appendChild(chip);
      }
      main.appendChild(title);
      main.appendChild(snippet);
      if (note.categories.length) main.appendChild(taglist);

      // Actions: Edit & Delete
      const actions = document.createElement('div');
      actions.className = "ne-note-actions";
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = "ne-action-btn";
      editBtn.title = "Edit";
      editBtn.innerHTML = "✏️";
      editBtn.onclick = (e) => { e.stopPropagation(); this._openEditNote(note.id); };
      actions.appendChild(editBtn);
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = "ne-action-btn";
      delBtn.title = "Delete";
      delBtn.innerHTML = "🗑️";
      delBtn.onclick = (e) => { e.stopPropagation(); this._deleteNote(note.id); };
      actions.appendChild(delBtn);

      item.appendChild(main);
      item.appendChild(actions);
      list.appendChild(item);
    }
    if (!filtered.length) {
      // Show no results message
      const none = document.createElement('div');
      none.className = 'ne-empty-state';
      none.textContent = "No notes found for this search/filter.";
      list.appendChild(none);
    }
    return list;
  }

  _renderEmptyState() {
    const gap = document.createElement('div');
    gap.className = 'ne-empty-state';
    gap.textContent = "No notes yet. Click the ➕ button to add your first note!";
    return gap;
  }

  _renderFAB() {
    const btn = document.createElement('button');
    btn.className = "ne-fab";
    btn.type = "button";
    btn.setAttribute('aria-label', 'Add Note');
    btn.innerHTML = '➕';
    btn.onclick = () => this._openCreateNote();
    return btn;
  }

  _renderNoteModal() {
    // Modal covers the whole screen
    const modal = document.createElement('div');
    modal.className = "ne-modal";
    modal.onclick = (e) => { if (e.target === modal) this._closeModal(); };

    // Card
    const card = document.createElement('div');
    card.className = "ne-modal-card";
    // Title
    const titleEl = document.createElement('div');
    titleEl.className = "ne-modal-title";
    titleEl.textContent = this.editId ? "Edit Note" : "Add Note";
    card.appendChild(titleEl);

    // Note fields (title, formatting, content, categories)
    // Title input
    const titleInput = document.createElement('input');
    titleInput.type = "text";
    titleInput.className = "ne-edit-title-input";
    titleInput.placeholder = "Title";
    titleInput.value = this._modalState.title;
    titleInput.oninput = (e) => { this._modalState.title = e.target.value.slice(0,72); };

    card.appendChild(titleInput);

    // Formatting Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'ne-edit-toolbar';
    [
      {icon: "B", label:"Bold", tag:"b"},
      {icon: "I", label:"Italic", tag:"i"},
      {icon:"U",label:"Underline",tag:"u"},
      {icon:"•",label:"Bullet",action:"list"}
    ].forEach(tool => {
      const btn = document.createElement('button');
      btn.className = 'ne-edit-toolbar-btn';
      btn.innerHTML = tool.icon;
      btn.title = tool.label;
      btn.onclick = (e) => { e.preventDefault(); this._applyFormat(tool); };
      toolbar.appendChild(btn);
    });
    card.appendChild(toolbar);

    // Content input (as rich text area)
    const content = document.createElement('div');
    content.className = 'ne-edit-content-input';
    content.contentEditable = "true";
    content.innerHTML = this._modalState.content;
    content.oninput = (e) => { this._modalState.content = content.innerHTML; };
    card.appendChild(content);

    // Category input as comma-separated chip list
    const catRow = document.createElement('div');
    catRow.className = "ne-modal-row";
    const catInput = document.createElement('input');
    catInput.type = "text";
    catInput.className = "ne-edit-categories-input";
    catInput.placeholder = "Categories (comma separated)";
    catInput.value = this._modalState.categories.join(", ");
    catInput.oninput = (e) => {
      this._modalState.categories = e.target.value.split(",").map(x => x.trim()).filter(Boolean)
    };
    catRow.appendChild(catInput);
    card.appendChild(catRow);

    // Modal actions
    const actions = document.createElement('div');
    actions.className = "ne-modal-actions";
    // Cancel/Close
    const closeBtn = document.createElement('button');
    closeBtn.className = "close-btn";
    closeBtn.onclick = () => this._closeModal();
    closeBtn.textContent = "Cancel";
    actions.appendChild(closeBtn);

    // Confirm
    const saveBtn = document.createElement('button');
    saveBtn.className = "confirm-btn";
    saveBtn.onclick = () => this._saveNote();
    saveBtn.textContent = this.editId ? "Save" : "Add";
    actions.appendChild(saveBtn);

    card.appendChild(actions);
    modal.appendChild(card);
    return modal;
  }

  // =============== UI Logic Methods & State ===============

  get _showNoteModal() {
    return !!this._modalState;
  }

  _openCreateNote() {
    this.editId = null;
    this._modalState = { title: "", content: "", categories: [] };
    this.render();
  }

  _openEditNote(id) {
    const n = this.notes.find(n => n.id === id);
    if (!n) return;
    this.editId = n.id;
    this._modalState = {
      title: n.title,
      content: n.content,
      categories: [...n.categories],
    };
    this.render();
  }

  _closeModal() {
    this.editId = null;
    this._modalState = null;
    this.render();
  }

  _saveNote() {
    let { title, content, categories } = this._modalState;
    title = (title || "").trim();
    content = content || "";
    categories = (categories || []).map(t => t.trim()).filter(Boolean);

    if (!title && !content) {
      this._showCustomDialog("Please add a title or content for your note.");
      return;
    }
    if (this.editId) {
      // Edit existing
      const idx = this.notes.findIndex(n => n.id === this.editId);
      if (idx !== -1) {
        this.notes[idx] = {
          ...this.notes[idx],
          title,
          content,
          categories,
        };
      }
    } else {
      // New note
      this.notes.push({
        id: this._noteIdCounter++,
        title,
        content,
        categories,
        createdAt: Date.now(),
      });
    }
    // Update categories
    this._updateCategories();
    this._closeModal();
  }

  _deleteNote(id) {
    this._showConfirmDialog(
      "Delete this note? This can’t be undone.",
      () => {
        this.notes = this.notes.filter(n => n.id !== id);
        this._updateCategories();
        this.render();
      }
    );
  }

  _updateCategories() {
    // Collect unique categories
    const all = new Set();
    for (const n of this.notes) for (const c of n.categories) if (c) all.add(c);
    this.categories = Array.from(all).sort((a, b) => a.localeCompare(b));
    // Clean filter if category gone
    this.filters = this.filters.filter(f => this.categories.includes(f));
  }

  _applyFormat(tool) {
    // Apply formatting (bold, italic, underline) or bullet to contentEditable div
    const content = document.querySelector('.ne-edit-content-input');
    if (!content) return;
    content.focus();
    if (tool.tag) {
      document.execCommand(tool.tag, false, null); // may be deprecated but works in most browsers
    } else if (tool.action === "list") {
      document.execCommand("insertUnorderedList", false, null);
    }
    this._modalState.content = content.innerHTML;
  }

  _stripHtml(html) {
    // Basic conversion to plain text (no tags)
    const div = document.createElement('div');
    div.innerHTML = html || "";
    return div.textContent || div.innerText || "";
  }

  // ========== Utilities ===========

  _setupTheme() {
    document.body.style.background = '#f7f8fa';
  }
}

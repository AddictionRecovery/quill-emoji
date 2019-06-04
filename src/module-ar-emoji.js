import Quill from 'quill'
import emojiList from './emoji-list.js'

const Module = Quill.import('core/module');

/**
 * Sort emoji properly.
 */
emojiList.sort(function (a, b) {
  return a.emoji_order - b.emoji_order;
});

/**
 * Provides toolbar button and emoji dropdown with ability to filter emoji.
 */
class ArEmoji extends Module {

  constructor(quill, options) {
    super(quill, options);

    /**
     * Toolbar module instance.
     *
     * @type {Module}
     */
    const toolbar = quill.getModule('toolbar');

    // Initialize emoji toolbar button.
    if (typeof toolbar !== 'undefined') {

      /**
       * Emoji palette.
       *
       * @type {EmojiPalette}
       */
      const palette = new EmojiPalette(quill, toolbar);

      // Add click handler to the emoji button.
      toolbar.addHandler('emoji', palette.toggle);

      // Set emoji button picture.
      const btn = toolbar.container.querySelector('.ql-emoji');
      if (btn) {
        btn.innerHTML = options.buttonIcon;
      }

      // Close emoji palette when user starts typing.
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          palette.close();
        }
      });
    }
  }

}

/**
 * Module's default options.
 *
 * @type {{}}
 */
ArEmoji.DEFAULTS = {
  buttonIcon: '<svg viewbox="0 0 18 18"><circle class="ql-fill" cx="7" cy="7" r="1"></circle><circle class="ql-fill" cx="11" cy="7" r="1"></circle><path class="ql-stroke" d="M7,10a2,2,0,0,0,4,0H7Z"></path><circle class="ql-stroke" cx="9" cy="9" r="6"></circle></svg>'
};

/**
 * List of emoji categories.
 *
 * @type {*[]}
 */
const emojiTypes = [
  { type: 'p', name: 'people' },
  { type: 'n', name: 'nature' },
  { type: 'd', name: 'food' },
  { type: 's', name: 'symbols'},
  { type: 'a', name: 'activity'},
  { type: 't', name: 'travel' },
  { type: 'o', name: 'objects' },
  { type: 'f', name: 'flags' }
];

/**
 * Represents emoji palette element.
 */
class EmojiPalette {

  constructor (quill, toolbar) {

    /**
     * Quill instance.
     *
     * @type {Quill}
     * @private
     */
    this._quill = quill;

    /**
     * Quill toolbar.
     *
     * @type {{}}
     * @private
     */
    this._toolbar = toolbar;

    /**
     * Emoji palette element.
     *
     * @type {Element}
     * @private
     */
    this._palette = null;

    /**
     * Overlay to close emoji palette by clicking outside.
     *
     * @type {Element}
     * @private
     */
    this._overlay = null;

    // Bind methods.
    this.create  = this.create.bind(this);
    this.toggle  = this.toggle.bind(this);
    this.open    = this.open.bind(this);
    this.close   = this.close.bind(this);
    this.filter  = this.filter.bind(this);
    this.render  = this.render.bind(this);
    this.onClick = this.onClick.bind(this);
    this.clear   = this.clear.bind(this);

    // Create emoji palette.
    this.create();
  }

  /**
   * Creates emoji palette and overlay.
   */
  create() {
    // Create emoji palette and add it to the Quill container.
    const palette = document.createElement('div');
    palette.style.top = this._toolbar.container.offsetHeight + 'px';
    palette.style.right = '0';
    palette.classList.add('emoji-palette');
    palette.style.display = 'none';
    this._toolbar.container.appendChild(palette);

    // Save created palette locally.
    this._palette = palette;

    // Create emoji category tabs wrapper and add it to the emoji palette.
    const tabs = document.createElement('ul');
    tabs.classList.add('emoji-tabs');
    palette.appendChild(tabs);

    // Create emoji category tabs and add them to the tabs wrapper.
    emojiTypes.forEach((emojiType) => {
      const tab = document.createElement('li');
      tab.classList.add('emoji-tab', 'emoji-tab-' + emojiType.name);
      tab.dataset.category = emojiType.type;
      tab.addEventListener('click', () => {
        this.filter(emojiType.type);
      });
      tabs.appendChild(tab);
    });

    // Create emoji search wrapper and add it to the palette.
    const search = document.createElement('div');
    search.classList.add('emoji-search');
    palette.appendChild(search);

    // Create emoji search input and add it to the search wrapper.
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    input.setAttribute('placeholder', 'Search emoji...');
    input.addEventListener('input', this.filter);
    search.appendChild(input);

    // Create emoji search clear button and add it to the search wrapper.
    const clear = document.createElement('span');
    clear.classList.add('emoji-search-clear');
    clear.innerHTML = '&times;';
    clear.addEventListener('click', () => {
      this.clear();
      this.filter('p');
    });
    search.appendChild(clear);

    // Create emoji wrapper and add it to the palette.
    const emojiWrapper = document.createElement('div');
    emojiWrapper.classList.add('emoji-list');
    palette.appendChild(emojiWrapper);

    // Show first tab by default.
    this.filter('p');

    // Create emoji overlay and add it to the Quill container.
    const overlay = document.createElement('div');
    overlay.classList.add('emoji-overlay');
    overlay.addEventListener('click', this.close, false);
    overlay.style.display = 'none';
    this._quill.container.appendChild(overlay);

    // Save overlay locally.
    this._overlay = overlay;
  }

  /**
   * Shows or hides emoji palette.
   */
  toggle() {
    if (this._palette.style.display === 'none') {
      this.open();
    }
    else {
      this.close();
    }
  }

  /**
   * Opens emoji palette.
   */
  open() {
    this._palette.style.display = 'block';
    this._overlay.style.display = 'block';
  }

  /**
   * Closes emoji palette.
   */
  close() {
    this._palette.style.display = 'none';
    this._overlay.style.display = 'none';
  }

  /**
   * Filters emoji list.
   *
   * @param {{}|String} e
   *   Filter event or emoji category type.
   */
  filter(e) {
    const tabs = this._palette.querySelector('.emoji-tabs'),
          activeTab = tabs.querySelector('.active');

    // Remove active tab, if any.
    if (activeTab) {
      activeTab.classList.remove('active');
    }

    // Filter emoji by category.
    if (typeof e === 'string') {
      // Set new active tab.
      tabs.querySelector('[data-category="' + e + '"]').classList.add('active');

      // Clear search query.
      this.clear();

      // Do filter emoji by category.
      this.render(emojiList.filter((emoji) => emoji.category === e));
    }
    // Filter emoji by search query.
    else {
      this.render(emojiList.filter((emoji) => emoji.name.includes(e.target.value)));
    }
  }

  /**
   * Adds set of emoji to the emoji palette.
   *
   * @param {[]} emojiList
   *   Array of emoji to add.
   */
  render(emojiList) {
    const wrapper = this._palette.querySelector('.emoji-list');

    // Remove old emoji from the palette.
    while (wrapper.firstChild) {
      wrapper.removeChild(wrapper.firstChild);
    }

    // Add new emoji to the palette.
    emojiList.forEach((data) => {
      const emoji = document.createElement('span');
      emoji.classList.add('bem', 'bem-' + data.name, 'ap', 'ap-' + data.name);
      emoji.innerHTML = '' + data.code_decimal + '';
      emoji.addEventListener('click', this.onClick(data));
      wrapper.appendChild(emoji);
    });
  }

  /**
   * Factory for emoji click handlers.
   */
  onClick(data) {
    return () => {
      this._quill.focus();

      const quill = this._quill,
            range = quill.getSelection();

      // Insert emoji.
      quill.insertEmbed(range.index, 'emoji', data, Quill.sources.USER);

      // Move cursor after insert.
      setTimeout(() => quill.setSelection(range.index + 1), 0);

      // Close emoji palette.
      this.close();
    }
  }

  /**
   * Clears emoji search input.
   */
  clear() {
    this._palette.querySelector('.emoji-search > input').value = '';
  }

}

export default ArEmoji;

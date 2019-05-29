import Quill from 'quill'
import Fuse from 'fuse.js'
import emojiList from './emoji-list.js'

const Module = Quill.import('core/module');

/**
 * Provides toolbar button and emoji dropdown with ability to filter emoji.
 */
class ArEmoji extends Module {

  constructor(quill, options) {
    super(quill, options);

    // Bind methods.
    this.togglePalette = this.togglePalette.bind(this);
    this.closePalette  = this.closePalette.bind(this);
    this.openPalette   = this.openPalette.bind(this);
    this.onFilterEmoji = this.onFilterEmoji.bind(this);

    /**
     * Currently active emoji tab.
     *
     * @type {string}
     * @private
     */
    this._activeTab = 'p';

    /**
     * Reference to Quill instance.
     *
     * @type {Quill}
     * @private
     */
    this._quill = quill;

    /**
     * Reference to the Toolbar module instance.
     *
     * @type {Module}
     * @private
     */
    this._toolbar = quill.getModule('toolbar');

    // Initialize emoji toolbar button.
    if (typeof this._toolbar !== 'undefined') {
      // Add click handler to the emoji button.
      this._toolbar.addHandler('emoji', this.togglePalette);

      // Set emoji button picture.
      const btn = this._toolbar.container.querySelector('.ql-emoji');
      if (btn) {
        btn.innerHTML = options.buttonIcon;
      }

      // Close emoji palette when user starts typing.
      quill.on('text-change', (delta, oldDelta, source) => {
        if (source === 'user') {
          this.closePalette();
        }
      });
    }
  }

  /**
   * Shows or hides emoji palette.
   */
  togglePalette() {
    if (!this.closePalette()) {
      this.openPalette();
    }
  }

  /**
   * Closes emoji palette if it's open.
   *
   * @return {boolean}
   *   TRUE if open palette was closed, FALSE otherwise.
   */
  closePalette() {
    const quill = this._quill,
          palette = quill.container.getElementsByClassName("emoji-palette");

    if (palette) {
      palette.remove();
      return true;
    }

    return false;
  }

  /**
   * Opens emoji palette.
   */
  openPalette() {
    const quill = this._quill,
          palette = document.createElement('div'),
          range = quill.getSelection(),
          bounds = quill.getBounds(range.index);

    // Add emoji palette to the Quill container.
    palette.classList.add('emoji-palette');
    quill.container.appendChild(palette);

    // Adjust emoji palette position.
    const paletteMaxPos = bounds.left + 250; //palette max width is 250
    palette.style.top = 10 + bounds.top + bounds.height + "px";
    if (paletteMaxPos > quill.container.offsetWidth) {
      palette.style.left = (bounds.left - 250)+ "px";
    }
    else{
      palette.style.left = bounds.left + "px";
    }

    // Emoji category tabs.
    const tabs = document.createElement('div');
    tabs.classList.add('emoji-tabs');
    palette.appendChild(tabs);

    // Emoji search input.
    const search = document.createElement('div');
    search.classList.add('emoji-search');
    palette.appendChild(search);
    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'text');
    searchInput.classList.add('emoji-search-input');
    searchInput.addEventListener('input', this.onFilterEmoji);
    search.appendChild(searchInput);

    // Emoji list.
    let list = document.createElement('div');
    list.classList.add('emoji-list');
    palette.appendChild(list);

    const tabElementHolder = document.createElement('ul');
    tabs.appendChild(tabElementHolder);

    if (document.getElementById('emoji-close-div') === null) {
      let closeDiv = document.createElement('div');
      closeDiv.id = 'emoji-close-div';
      closeDiv.addEventListener("click", this.closePalette, false);
      document.getElementsByTagName('body')[0].appendChild(closeDiv);
    }
    else{
      document.getElementById('emoji-close-div').style.display = "block";
    }


    emojiType.map(function(emojiType) {
      //add tab bar
      let tabElement = document.createElement('li');
      tabElement.classList.add('emoji-tab');
      tabElement.classList.add('filter-'+emojiType.name);
      tabElement.innerHTML = emojiType.content;
      tabElement.dataset.filter = emojiType.type;
      tabElementHolder.appendChild(tabElement);

      let emojiFilter = document.querySelector('.filter-'+emojiType.name);
      emojiFilter.addEventListener('click',function(){
        let tab = document.querySelector('.active');
        if (tab) {
          tab.classList.remove('active');
        }
        emojiFilter.classList.toggle('active');
        fn_updateEmojiContainer(emojiFilter,list,quill);
      })
    });
    fn_emojiPanelInit(list,quill);
  }

  onFilterEmoji(e) {
    console.error(e)
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
const emojiType = [
  { type: 'p', name: 'people' },
  { type: 'n', name: 'nature' },
  { type: 'd', name: 'food' },
  { type: 's', name: 'symbols'},
  { type: 'a', name: 'activity'},
  { type: 't', name: 'travel' },
  { type: 'o', name: 'objects' },
  { type: 'f', name: 'flags' }
];


function fn_close(){
  const ele_emoji_plate = document.getElementById('emoji-palette');
  document.getElementById('emoji-close-div').style.display = "none";
  if (ele_emoji_plate) {ele_emoji_plate.remove()}
}

function fn_updateRange(quill){
  return quill.getSelection();
}

function fn_emojiPanelInit(panel,quill){
  fn_emojiElementsToPanel('p', panel, quill);
  document.querySelector('.filter-people').classList.add('active');
}

function fn_emojiElementsToPanel(type,panel,quill){
  let fuseOptions = {
    shouldSort: true,
    matchAllTokens: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: [
      "category"
    ]
  };
  let fuse = new Fuse(emojiList, fuseOptions);
  let result = fuse.search(type);
  result.sort(function (a, b) {
    return a.emoji_order - b.emoji_order;
  });

  quill.focus();
  let range = fn_updateRange(quill);

  result.map(function(emoji) {
    let span = document.createElement('span');
    let t = document.createTextNode(emoji.shortname);
    span.appendChild(t);
    span.classList.add('bem');
    span.classList.add('bem-' + emoji.name);
    span.classList.add('ap');
    span.classList.add('ap-' + emoji.name);
    let output = '' + emoji.code_decimal + '';
    span.innerHTML = output + ' ';
    panel.appendChild(span);

    let customButton = document.querySelector('.bem-' + emoji.name);
    if (customButton) {
      customButton.addEventListener('click', function() {
        quill.insertEmbed(range.index, 'emoji', emoji, Quill.sources.USER);
        setTimeout(() => quill.setSelection(range.index + 1), 0);
        fn_close();
      });
    }
  });
}

function fn_updateEmojiContainer(emojiFilter,panel,quill){
  while (panel.firstChild) {
    panel.removeChild(panel.firstChild);
  }
  const type = emojiFilter.dataset.filter;
  fn_emojiElementsToPanel(type,panel,quill);
}

export default ArEmoji;

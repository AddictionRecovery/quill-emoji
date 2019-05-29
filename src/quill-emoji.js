import Quill from 'quill';
import EmojiBlot from './format-emoji-blot-img';
import ArEmoji from './module-ar-emoji';
import './scss/quill-emoji.scss';

Quill.register({
    'formats/emoji': EmojiBlot,
    'modules/emoji-ar': ArEmoji
  }, true);

export default { EmojiBlot, ArEmoji };

import Quill from 'quill';
import emojiMap from "./emoji-map";

const Embed = Quill.import('formats/image');

const onePixelImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

class EmojiBlot extends Embed {

  static create(value) {
    let node = super.create();

    if (typeof value === 'object') {
      EmojiBlot.buildImage(value, node);
    }
    else if (typeof value === "string") {
      const valueObj = emojiMap[value];
      if (valueObj) {
        EmojiBlot.buildImage(valueObj, node);
      }
    }

    return node;
  }

  static value(node) {
    return node.getAttribute('alt');
  }

  static buildImage(value, node) {
    node.setAttribute('src', onePixelImageData);
    node.setAttribute('alt', String.fromCodePoint(...EmojiBlot.parseUnicode(value.unicode)));
    node.classList.add(this.emojiClass);
    node.classList.add(this.emojiClass + '-' + value.name);
  }

  static parseUnicode(string) {
    return string.split('-').map(str => parseInt(str, 16));
  }
}

EmojiBlot.blotName = 'emoji';
EmojiBlot.className = 'emoji';
EmojiBlot.emojiClass = 'ap';

export default EmojiBlot;

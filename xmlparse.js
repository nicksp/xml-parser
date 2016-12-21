const xmlFile = require('./sample.xml');

// 01. Detect named attribute `name="value"``
const name = rgx(/[a-z]+/i).then(s => s.toLowerCase());
const char = rgx(/[^"&]/i);
const quoted = seq(txt('"'), rep(char), txt('"')).then(r => r[1].join(''));
const attr = seq(name, txt('='), quoted).then(r => { name: r[0], value: r[2] });

assert.deepEqual(
  attr.exec('title="Chapter 1"', 0),
  { res: { name: 'title', value: 'Chapter 1' }, end: 17 }
);

// 02. Detect `<?xml… ?>` header
const wsp = rgx(/\s+/);

const attrs = rep(attr, wsp).then(r => {
  const map = {};
  r.forEach(a => (m[a.name] = a.value));
  return m;
});

const header = seq(txt('<?xml'), wsp, attrs, txt('?>')).then(r => r[2]);

assert.deepEqual(
  header.exec('<?xml version="1.0" encoding="utf-8"?>', 0),
  { res: { version: '1.0', encoding: 'utf-8' }, end: ... }
);

// 03. Detect `<node...>...` contructions
const text = rep(char).then(r => r.join(''));
const subnode = new Pattern((str, pos) => node.exec(str, pos));
const node = seq(
  txt('<'), name, wsp, attrs, txt('>'),
  rep(any(text, subnode), opt(wsp)),
  txt('</'), name, txt('>')
).then(r => ({
  name: r[1],
  attrs: r[3],
  nodes: r[5]
}));

// 04. Detect the whole xml file along with the header
const xml = seq(header, node).then(r => ({ root: r[1], attrs: r[0] }));

assert.deepEqual(
  xml.exec(xmlFile),
  {
    attrs: { version: '1.0', encoding: 'utf-8' },
    root: {
      name: 'book',
      attrs: { title: 'Book 1' },
      nodes: [
        {
          name: 'chapter',
          attrs: { title: 'Chapter 1' },
          nodes: [...]
        },
        //...
      ]
    }
  }
);

// Constructor
function Pattern(name, exec) {
  this.exec = function(str, pos) {
    const r = exec(str, pos || 0);
    return pos >= 0 ? r : !r ? null : r.end !== str.length ? null : r.res;
  };

  this.then = function(transform) {
    return new Pattern((str, pos) => {
      const r = exec(str, pos);
      return r && { res: transform(r.res), end: r.end };
    });
  };
}

// Parse fixed defined text string
// assert.deepEqual(txt("abc").exec("abc", 0), { res: "abc", end: 3 });
// assert.deepEqual(txt("abc").exec("def", 0), void 0);
function txt(text) {
  return new Pattern((str, pos) => {
    if (str.substr(pos, text.length) === text) {
      return {
        res: text,
        end: pos + text.length
      };
    }
  });
}

// Parse reg exps
// assert.deepEqual(rgx(/\d+/).exec("123", 0), { res: "123", end: 3 });
// assert.deepEqual(rgx(/\d+/).exec("abc", 0), void 0);
function rgx(regexp) {
  return new Pattern((str, pos) => {
    const m = regexp.exec(str.slice(pos));
    if (m && m.index === 0) {
      return {
        res: m[0],
        end: pos + m[0].length
      }
    }
  });
}

// Optional pattern
// assert.deepEqual(opt(txt("abc")).exec("abc"), { res: "abc", end: 3 });
// assert.deepEqual(opt(txt("abc")).exec("123"), { res: void 0, end: 0 });
function opt(pattern) {
  return new Pattern((str, pos) => {
    return pattern.exec(str, pos) || { res: void 0, end: pos };
  });
}

// Example: Parse all capitals except 'H'
// const p = exc(rgx(/[A-Z]/), txt('H'));
// assert.deepEqual(p.exec("R", 0), { res: "R", end: 1 });
// assert.deepEqual(p.exec("H", 0), void 0);
function exc(pattern, except) {
  return new Pattern((str, pos) => {
    return !except.exec(str, pos) && pattern.exec(str, pos);
  });
}

// Constructs new Pattern out of input patterns and parses what the first parser parses
// Example:
// const p = any(txt('abc'), txt('def'))
// assert.deepEqual(p.exec("abc", 0), { res: "abc", end: 3 });
// assert.deepEqual(p.exec("def", 0), { res: "def", end: 3 });
// assert.deepEqual(p.exec("ABC", 0), void 0);
function any(...patterns) {
  return new Pattern((str, pos) => {
    for (let r, i = 0, len = patterns.length; i < len; i++) {
      if (r = patterns[i].exec(str, pos)) {
        return r;
      }
    }
  });
}

// Sequantially parse text with input patterns and returns an array os results
// Example:
// const p = seq(txt('abc'), txt('def'));
// assert.deepEqual(p.exec("abcdef"), { res: ["abc", "def"], end: 6 });
// assert.deepEqual(p.exec("abcde7"), void 0);
function seq(...patterns) {
  return new Pattern((str, pos) => {
    let i, r, end = pos, res = [];

    for (i = 0; i < patterns.length; i++) {
      r = patterns[i].exec(str, end);
      if (!r) {
        return;
      }
      res.push(r.res);
      end = r.end;
    }

    return {
      res
      end
    };
  });
}

// Repeat pattern execution on the text and returns an array of results
// Example:
// const p = rep(rgx(/\d+/), txt(','));
// assert.deepEqual(p.exec("1,23,456", 0), { res: ["1", "23", "456"], end: 8 });
// assert.deepEqual(p.exec("123ABC", 0), { res: ["123"], end: 3 });
// assert.deepEqual(p.exec("ABC", 0), void 0);
function rep(pattern, separator) {
  let separated = !separator ? pattern : seq(separator, pattern).then(r => r[1]);

  return new Pattern((str, pos) => {
    let res = [], end = pos, r = pattern.exec(str, end);

    while(r && r.end > end) {
      res.push(r.res);
      end = r.end;
      r = separated.exec(str, end);
    }

    return {
      res,
      end
    };
  });
}

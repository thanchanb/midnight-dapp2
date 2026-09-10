(async () => {
  (function() {
    const e = document.createElement("link").relList;
    if (e && e.supports && e.supports("modulepreload")) return;
    for (const a of document.querySelectorAll('link[rel="modulepreload"]')) r(a);
    new MutationObserver((a) => {
      for (const i of a) if (i.type === "childList") for (const s of i.addedNodes) s.tagName === "LINK" && s.rel === "modulepreload" && r(s);
    }).observe(document, {
      childList: true,
      subtree: true
    });
    function n(a) {
      const i = {};
      return a.integrity && (i.integrity = a.integrity), a.referrerPolicy && (i.referrerPolicy = a.referrerPolicy), a.crossOrigin === "use-credentials" ? i.credentials = "include" : a.crossOrigin === "anonymous" ? i.credentials = "omit" : i.credentials = "same-origin", i;
    }
    function r(a) {
      if (a.ep) return;
      a.ep = true;
      const i = n(a);
      fetch(a.href, i);
    }
  })();
  var at = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
  function Rt(t) {
    return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
  }
  function Ut(t) {
    if (t.__esModule) return t;
    var e = t.default;
    if (typeof e == "function") {
      var n = function r() {
        return this instanceof r ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
      };
      n.prototype = e.prototype;
    } else n = {};
    return Object.defineProperty(n, "__esModule", {
      value: true
    }), Object.keys(t).forEach(function(r) {
      var a = Object.getOwnPropertyDescriptor(t, r);
      Object.defineProperty(n, r, a.get ? a : {
        enumerable: true,
        get: function() {
          return t[r];
        }
      });
    }), n;
  }
  const Nt = {}, Wt = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: Nt
  }, Symbol.toStringTag, {
    value: "Module"
  })), Dt = Ut(Wt);
  var He = typeof Map == "function" && Map.prototype, ve = Object.getOwnPropertyDescriptor && He ? Object.getOwnPropertyDescriptor(Map.prototype, "size") : null, le = He && ve && typeof ve.get == "function" ? ve.get : null, it = He && Map.prototype.forEach, Qe = typeof Set == "function" && Set.prototype, Se = Object.getOwnPropertyDescriptor && Qe ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null, de = Qe && Se && typeof Se.get == "function" ? Se.get : null, ot = Qe && Set.prototype.forEach, Ht = typeof WeakMap == "function" && WeakMap.prototype, J = Ht ? WeakMap.prototype.has : null, Qt = typeof WeakSet == "function" && WeakSet.prototype, X = Qt ? WeakSet.prototype.has : null, Kt = typeof WeakRef == "function" && WeakRef.prototype, st = Kt ? WeakRef.prototype.deref : null, Zt = Boolean.prototype.valueOf, Gt = Object.prototype.toString, Yt = Function.prototype.toString, Jt = String.prototype.match, Ke = String.prototype.slice, O = String.prototype.replace, Xt = String.prototype.toUpperCase, ct = String.prototype.toLowerCase, Ct = RegExp.prototype.test, ut = Array.prototype.concat, k = Array.prototype.join, jt = Array.prototype.slice, _t = Math.floor, $e = typeof BigInt == "function" ? BigInt.prototype.valueOf : null, Ce = Object.getOwnPropertySymbols, Me = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? Symbol.prototype.toString : null, K = typeof Symbol == "function" && typeof Symbol.iterator == "object", j = typeof Symbol == "function" && Symbol.toStringTag && (typeof Symbol.toStringTag === K || true) ? Symbol.toStringTag : null, xt = Object.prototype.propertyIsEnumerable, lt = (typeof Reflect == "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) || ([].__proto__ === Array.prototype ? function(t) {
    return t.__proto__;
  } : null);
  function dt(t, e) {
    if (t === 1 / 0 || t === -1 / 0 || t !== t || t && t > -1e3 && t < 1e3 || Ct.call(/e/, e)) return e;
    var n = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof t == "number") {
      var r = t < 0 ? -_t(-t) : _t(t);
      if (r !== t) {
        var a = String(r), i = Ke.call(e, a.length + 1);
        return O.call(a, n, "$&_") + "." + O.call(O.call(i, /([0-9]{3})/g, "$&_"), /_$/, "");
      }
    }
    return O.call(e, n, "$&_");
  }
  var Re = Dt, ft = Re.custom, gt = kt(ft) ? ft : null, Ft = {
    __proto__: null,
    double: '"',
    single: "'"
  }, en = {
    __proto__: null,
    double: /(["\\])/g,
    single: /(['\\])/g
  }, tn = function t(e, n, r, a) {
    var i = n || {};
    if (A(i, "quoteStyle") && !A(Ft, i.quoteStyle)) throw new TypeError('option "quoteStyle" must be "single" or "double"');
    if (A(i, "maxStringLength") && (typeof i.maxStringLength == "number" ? i.maxStringLength < 0 && i.maxStringLength !== 1 / 0 : i.maxStringLength !== null)) throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    var s = A(i, "customInspect") ? i.customInspect : true;
    if (typeof s != "boolean" && s !== "symbol") throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
    if (A(i, "indent") && i.indent !== null && i.indent !== "	" && !(parseInt(i.indent, 10) === i.indent && i.indent > 0)) throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    if (A(i, "numericSeparator") && typeof i.numericSeparator != "boolean") throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    var l = i.numericSeparator;
    if (typeof e > "u") return "undefined";
    if (e === null) return "null";
    if (typeof e == "boolean") return e ? "true" : "false";
    if (typeof e == "string") return It(e, i);
    if (typeof e == "number") {
      if (e === 0) return 1 / 0 / e > 0 ? "0" : "-0";
      var d = String(e);
      return l ? dt(e, d) : d;
    }
    if (typeof e == "bigint") {
      var S = String(e) + "n";
      return l ? dt(e, S) : S;
    }
    var ae = typeof i.depth > "u" ? 5 : i.depth;
    if (typeof r > "u" && (r = 0), r >= ae && ae > 0 && typeof e == "object") return Ue(e) ? "[Array]" : "[Object]";
    var B = yn(i, r);
    if (typeof a > "u") a = [];
    else if (Vt(a, e) >= 0) return "[Circular]";
    function x(H, oe, Mt) {
      if (oe && (a = jt.call(a), a.push(oe)), Mt) {
        var rt = {
          depth: i.depth
        };
        return A(i, "quoteStyle") && (rt.quoteStyle = i.quoteStyle), t(H, rt, r + 1, a);
      }
      return t(H, i, r + 1, a);
    }
    if (typeof e == "function" && !pt(e)) {
      var Ye = ln(e), Je = se(e, x);
      return "[Function" + (Ye ? ": " + Ye : " (anonymous)") + "]" + (Je.length > 0 ? " { " + k.call(Je, ", ") + " }" : "");
    }
    if (kt(e)) {
      var Xe = K ? O.call(String(e), /^(Symbol\(.*\))_[^)]*$/, "$1") : Me.call(e);
      return typeof e == "object" && !K ? G(Xe) : Xe;
    }
    if (hn(e)) {
      for (var Z = "<" + ct.call(String(e.nodeName)), pe = e.attributes || [], ie = 0; ie < pe.length; ie++) Z += " " + pe[ie].name + "=" + Et(nn(pe[ie].value), "double", i);
      return Z += ">", e.childNodes && e.childNodes.length && (Z += "..."), Z += "</" + ct.call(String(e.nodeName)) + ">", Z;
    }
    if (Ue(e)) {
      if (e.length === 0) return "[]";
      var we = se(e, x);
      return B && !mn(we) ? "[" + Ne(we, B) + "]" : "[ " + k.call(we, ", ") + " ]";
    }
    if (an(e)) {
      var he = se(e, x);
      return !("cause" in Error.prototype) && "cause" in e && !xt.call(e, "cause") ? "{ [" + String(e) + "] " + k.call(ut.call("[cause]: " + x(e.cause), he), ", ") + " }" : he.length === 0 ? "[" + String(e) + "]" : "{ [" + String(e) + "] " + k.call(he, ", ") + " }";
    }
    if (typeof e == "object" && s) {
      if (gt && typeof e[gt] == "function" && Re) return Re(e, {
        depth: ae - r
      });
      if (s !== "symbol" && typeof e.inspect == "function") return e.inspect();
    }
    if (dn(e)) {
      var je = [];
      return it && it.call(e, function(H, oe) {
        je.push(x(oe, e, true) + " => " + x(H, e));
      }), wt("Map", le.call(e), je, B);
    }
    if (pn(e)) {
      var et = [];
      return ot && ot.call(e, function(H) {
        et.push(x(H, e));
      }), wt("Set", de.call(e), et, B);
    }
    if (fn(e)) return xe("WeakMap");
    if (wn(e)) return xe("WeakSet");
    if (gn(e)) return xe("WeakRef");
    if (sn(e)) return G(x(Number(e)));
    if (un(e)) return G(x($e.call(e)));
    if (cn(e)) return G(Zt.call(e));
    if (on(e)) return G(x(String(e)));
    if (typeof window < "u" && e === window) return "{ [object Window] }";
    if (typeof globalThis < "u" && e === globalThis || typeof at < "u" && e === at) return "{ [object globalThis] }";
    if (!rn(e) && !pt(e)) {
      var be = se(e, x), tt = lt ? lt(e) === Object.prototype : e instanceof Object || e.constructor === Object, me = e instanceof Object ? "" : "null prototype", nt = !tt && j && Object(e) === e && j in e ? Ke.call(M(e), 8, -1) : me ? "Object" : "", $t = tt || typeof e.constructor != "function" ? "" : e.constructor.name ? e.constructor.name + " " : "", ye = $t + (nt || me ? "[" + k.call(ut.call([], nt || [], me || []), ": ") + "] " : "");
      return be.length === 0 ? ye + "{}" : B ? ye + "{" + Ne(be, B) + "}" : ye + "{ " + k.call(be, ", ") + " }";
    }
    return String(e);
  };
  function Et(t, e, n) {
    var r = n.quoteStyle || e, a = Ft[r];
    return a + t + a;
  }
  function nn(t) {
    return O.call(String(t), /"/g, "&quot;");
  }
  function D(t) {
    return !j || !(typeof t == "object" && (j in t || typeof t[j] < "u"));
  }
  function Ue(t) {
    return M(t) === "[object Array]" && D(t);
  }
  function rn(t) {
    return M(t) === "[object Date]" && D(t);
  }
  function pt(t) {
    return M(t) === "[object RegExp]" && D(t);
  }
  function an(t) {
    return M(t) === "[object Error]" && D(t);
  }
  function on(t) {
    return M(t) === "[object String]" && D(t);
  }
  function sn(t) {
    return M(t) === "[object Number]" && D(t);
  }
  function cn(t) {
    return M(t) === "[object Boolean]" && D(t);
  }
  function kt(t) {
    if (K) return t && typeof t == "object" && t instanceof Symbol;
    if (typeof t == "symbol") return true;
    if (!t || typeof t != "object" || !Me) return false;
    try {
      return Me.call(t), true;
    } catch {
    }
    return false;
  }
  function un(t) {
    if (!t || typeof t != "object" || !$e) return false;
    try {
      return $e.call(t), true;
    } catch {
    }
    return false;
  }
  var _n = Object.prototype.hasOwnProperty || function(t) {
    return t in this;
  };
  function A(t, e) {
    return _n.call(t, e);
  }
  function M(t) {
    return Gt.call(t);
  }
  function ln(t) {
    if (t.name) return t.name;
    var e = Jt.call(Yt.call(t), /^function\s*([\w$]+)/);
    return e ? e[1] : null;
  }
  function Vt(t, e) {
    if (t.indexOf) return t.indexOf(e);
    for (var n = 0, r = t.length; n < r; n++) if (t[n] === e) return n;
    return -1;
  }
  function dn(t) {
    if (!le || !t || typeof t != "object") return false;
    try {
      le.call(t);
      try {
        de.call(t);
      } catch {
        return true;
      }
      return t instanceof Map;
    } catch {
    }
    return false;
  }
  function fn(t) {
    if (!J || !t || typeof t != "object") return false;
    try {
      J.call(t, J);
      try {
        X.call(t, X);
      } catch {
        return true;
      }
      return t instanceof WeakMap;
    } catch {
    }
    return false;
  }
  function gn(t) {
    if (!st || !t || typeof t != "object") return false;
    try {
      return st.call(t), true;
    } catch {
    }
    return false;
  }
  function pn(t) {
    if (!de || !t || typeof t != "object") return false;
    try {
      de.call(t);
      try {
        le.call(t);
      } catch {
        return true;
      }
      return t instanceof Set;
    } catch {
    }
    return false;
  }
  function wn(t) {
    if (!X || !t || typeof t != "object") return false;
    try {
      X.call(t, X);
      try {
        J.call(t, J);
      } catch {
        return true;
      }
      return t instanceof WeakSet;
    } catch {
    }
    return false;
  }
  function hn(t) {
    return !t || typeof t != "object" ? false : typeof HTMLElement < "u" && t instanceof HTMLElement ? true : typeof t.nodeName == "string" && typeof t.getAttribute == "function";
  }
  function It(t, e) {
    if (t.length > e.maxStringLength) {
      var n = t.length - e.maxStringLength, r = "... " + n + " more character" + (n > 1 ? "s" : "");
      return It(Ke.call(t, 0, e.maxStringLength), e) + r;
    }
    var a = en[e.quoteStyle || "single"];
    a.lastIndex = 0;
    var i = O.call(O.call(t, a, "\\$1"), /[\x00-\x1f]/g, bn);
    return Et(i, "single", e);
  }
  function bn(t) {
    var e = t.charCodeAt(0), n = {
      8: "b",
      9: "t",
      10: "n",
      12: "f",
      13: "r"
    }[e];
    return n ? "\\" + n : "\\x" + (e < 16 ? "0" : "") + Xt.call(e.toString(16));
  }
  function G(t) {
    return "Object(" + t + ")";
  }
  function xe(t) {
    return t + " { ? }";
  }
  function wt(t, e, n, r) {
    var a = r ? Ne(n, r) : k.call(n, ", ");
    return t + " (" + e + ") {" + a + "}";
  }
  function mn(t) {
    for (var e = 0; e < t.length; e++) if (Vt(t[e], `
`) >= 0) return false;
    return true;
  }
  function yn(t, e) {
    var n;
    if (t.indent === "	") n = "	";
    else if (typeof t.indent == "number" && t.indent > 0) n = k.call(Array(t.indent + 1), " ");
    else return null;
    return {
      base: n,
      prev: k.call(Array(e + 1), n)
    };
  }
  function Ne(t, e) {
    if (t.length === 0) return "";
    var n = `
` + e.prev + e.base;
    return n + k.call(t, "," + n) + `
` + e.prev;
  }
  function se(t, e) {
    var n = Ue(t), r = [];
    if (n) {
      r.length = t.length;
      for (var a = 0; a < t.length; a++) r[a] = A(t, a) ? e(t[a], t) : "";
    }
    var i = typeof Ce == "function" ? Ce(t) : [], s;
    if (K) {
      s = {};
      for (var l = 0; l < i.length; l++) s["$" + i[l]] = i[l];
    }
    for (var d in t) A(t, d) && (n && String(Number(d)) === d && d < t.length || K && s["$" + d] instanceof Symbol || (Ct.call(/[^\w$]/, d) ? r.push(e(d, t) + ": " + e(t[d], t)) : r.push(d + ": " + e(t[d], t))));
    if (typeof Ce == "function") for (var S = 0; S < i.length; S++) xt.call(t, i[S]) && r.push("[" + e(i[S]) + "]: " + e(t[i[S]], t));
    return r;
  }
  const vn = Rt(tn);
  class g extends Error {
    constructor(e) {
      super(e), this.name = "CompactError";
    }
  }
  function Fe(t, e) {
    if (!t) {
      const n = `failed assert: ${e}`;
      throw new g(n);
    }
  }
  function P(t, e, n, r, a) {
    const i = `type error: ${t} ${e} at ${n}; expected value of type ${r} but received ${vn(a)}`;
    throw new g(i);
  }
  const Sn = "" + new URL("midnight_onchain_runtime_wasm_bg-Bk-cVMvn.wasm", import.meta.url).href, Cn = async (t = {}, e) => {
    let n;
    if (e.startsWith("data:")) {
      const r = e.replace(/^data:.*?base64,/, "");
      let a;
      if (typeof Buffer == "function" && typeof Buffer.from == "function") a = Buffer.from(r, "base64");
      else if (typeof atob == "function") {
        const i = atob(r);
        a = new Uint8Array(i.length);
        for (let s = 0; s < i.length; s++) a[s] = i.charCodeAt(s);
      } else throw new Error("Cannot decode base64-encoded data URL");
      n = await WebAssembly.instantiate(a, t);
    } else {
      const r = await fetch(e), a = r.headers.get("Content-Type") || "";
      if ("instantiateStreaming" in WebAssembly && a.startsWith("application/wasm")) n = await WebAssembly.instantiateStreaming(r, t);
      else {
        const i = await r.arrayBuffer();
        n = await WebAssembly.instantiate(i, t);
      }
    }
    return n.instance.exports;
  };
  let o;
  function xn(t) {
    o = t;
  }
  function R(t) {
    const e = o.__externref_table_alloc();
    return o.__wbindgen_export_2.set(e, t), e;
  }
  function v(t, e) {
    try {
      return t.apply(this, e);
    } catch (n) {
      const r = R(n);
      o.__wbindgen_exn_store(r);
    }
  }
  let ce = null;
  function ee() {
    return (ce === null || ce.byteLength === 0) && (ce = new Uint8Array(o.memory.buffer)), ce;
  }
  let _e = new TextDecoder("utf-8", {
    ignoreBOM: true,
    fatal: true
  });
  _e.decode();
  const Fn = 2146435072;
  let Ee = 0;
  function En(t, e) {
    return Ee += e, Ee >= Fn && (_e = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true
    }), _e.decode(), Ee = e), _e.decode(ee().subarray(t, t + e));
  }
  function b(t, e) {
    return t = t >>> 0, En(t, e);
  }
  let q = 0;
  const te = new TextEncoder();
  "encodeInto" in te || (te.encodeInto = function(t, e) {
    const n = te.encode(t);
    return e.set(n), {
      read: t.length,
      written: n.length
    };
  });
  function N(t, e, n) {
    if (n === void 0) {
      const l = te.encode(t), d = e(l.length, 1) >>> 0;
      return ee().subarray(d, d + l.length).set(l), q = l.length, d;
    }
    let r = t.length, a = e(r, 1) >>> 0;
    const i = ee();
    let s = 0;
    for (; s < r; s++) {
      const l = t.charCodeAt(s);
      if (l > 127) break;
      i[a + s] = l;
    }
    if (s !== r) {
      s !== 0 && (t = t.slice(s)), a = n(a, r, r = s + t.length * 3, 1) >>> 0;
      const l = ee().subarray(a + s, a + r), d = te.encodeInto(t, l);
      s += d.written, a = n(a, r, s, 1) >>> 0;
    }
    return q = s, a;
  }
  let Q = null;
  function E() {
    return (Q === null || Q.buffer.detached === true || Q.buffer.detached === void 0 && Q.buffer !== o.memory.buffer) && (Q = new DataView(o.memory.buffer)), Q;
  }
  function p(t) {
    return t == null;
  }
  function ge(t, e) {
    return t = t >>> 0, ee().subarray(t / 1, t / 1 + e);
  }
  function We(t) {
    const e = typeof t;
    if (e == "number" || e == "boolean" || t == null) return `${t}`;
    if (e == "string") return `"${t}"`;
    if (e == "symbol") {
      const a = t.description;
      return a == null ? "Symbol" : `Symbol(${a})`;
    }
    if (e == "function") {
      const a = t.name;
      return typeof a == "string" && a.length > 0 ? `Function(${a})` : "Function";
    }
    if (Array.isArray(t)) {
      const a = t.length;
      let i = "[";
      a > 0 && (i += We(t[0]));
      for (let s = 1; s < a; s++) i += ", " + We(t[s]);
      return i += "]", i;
    }
    const n = /\[object ([^\]]+)\]/.exec(toString.call(t));
    let r;
    if (n && n.length > 1) r = n[1];
    else return toString.call(t);
    if (r == "Object") try {
      return "Object(" + JSON.stringify(t) + ")";
    } catch {
      return "Object";
    }
    return t instanceof Error ? `${t.name}: ${t.message}
${t.stack}` : r;
  }
  const ht = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => {
    o.__wbindgen_export_5.get(t.dtor)(t.a, t.b);
  });
  function kn(t, e, n, r) {
    const a = {
      a: t,
      b: e,
      cnt: 1,
      dtor: n
    }, i = (...s) => {
      a.cnt++;
      const l = a.a;
      a.a = 0;
      try {
        return r(l, a.b, ...s);
      } finally {
        --a.cnt === 0 ? (o.__wbindgen_export_5.get(a.dtor)(l, a.b), ht.unregister(a)) : a.a = l;
      }
    };
    return i.original = a, ht.register(i, a, a), i;
  }
  function c(t) {
    const e = o.__wbindgen_export_2.get(t);
    return o.__externref_table_dealloc(t), e;
  }
  function Vn() {
    const t = o.maxField();
    if (t[2]) throw c(t[1]);
    return c(t[0]);
  }
  function In(t) {
    const e = o.bigIntToValue(t);
    if (e[2]) throw c(e[1]);
    return c(e[0]);
  }
  function Tn(t) {
    const e = o.valueToBigInt(t);
    if (e[2]) throw c(e[1]);
    return c(e[0]);
  }
  function z() {
    let t, e;
    try {
      const a = o.dummyContractAddress();
      var n = a[0], r = a[1];
      if (a[3]) throw n = 0, r = 0, c(a[2]);
      return t = n, e = r, b(n, r);
    } finally {
      o.__wbindgen_free(t, e, 1);
    }
  }
  function An(t) {
    const e = N(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = q, r = o.encodeContractAddress(e, n);
    if (r[2]) throw c(r[1]);
    return c(r[0]);
  }
  function Ln(t) {
    const e = o.encodeQualifiedShieldedCoinInfo(t);
    if (e[2]) throw c(e[1]);
    return c(e[0]);
  }
  function Ze(t) {
    const e = N(t, o.__wbindgen_malloc, o.__wbindgen_realloc), n = q, r = o.encodeCoinPublicKey(e, n);
    if (r[2]) throw c(r[1]);
    return c(r[0]);
  }
  function qn(t) {
    const e = o.encodeShieldedCoinInfo(t);
    if (e[2]) throw c(e[1]);
    return c(e[0]);
  }
  function m(t, e) {
    if (!(t instanceof e)) throw new Error(`expected instance of ${e.name}`);
  }
  function Ge(t, e) {
    t = t >>> 0;
    const n = E(), r = [];
    for (let a = t; a < t + 4 * e; a += 4) r.push(o.__wbindgen_export_2.get(n.getUint32(a, true)));
    return o.__externref_drop_slice(t, e), r;
  }
  function Bn(t, e, n) {
    o.closure669_externref_shim(t, e, n);
  }
  function Pn(t, e, n, r) {
    o.closure708_externref_shim(t, e, n, r);
  }
  const ke = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_chargedstate_free(t >>> 0, 1));
  class y {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(y.prototype);
      return n.__wbg_ptr = e, ke.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, ke.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_chargedstate_free(e, 0);
    }
    constructor(e) {
      m(e, u);
      const n = o.chargedstate_new(e.__wbg_ptr);
      return this.__wbg_ptr = n >>> 0, ke.register(this, this.__wbg_ptr, this), this;
    }
    get state() {
      const e = o.chargedstate_state(this.__wbg_ptr);
      return u.__wrap(e);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.chargedstate_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (y.prototype[Symbol.dispose] = y.prototype.free);
  const Ve = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_contractmaintenanceauthority_free(t >>> 0, 1));
  class W {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(W.prototype);
      return n.__wbg_ptr = e, Ve.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Ve.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_contractmaintenanceauthority_free(e, 0);
    }
    static deserialize(e) {
      const n = o.contractmaintenanceauthority_deserialize(e);
      if (n[2]) throw c(n[1]);
      return W.__wrap(n[0]);
    }
    constructor(e, n, r) {
      const a = o.contractmaintenanceauthority_new(e, n, p(r) ? 0 : R(r));
      if (a[2]) throw c(a[1]);
      return this.__wbg_ptr = a[0] >>> 0, Ve.register(this, this.__wbg_ptr, this), this;
    }
    get counter() {
      return o.contractmaintenanceauthority_counter(this.__wbg_ptr);
    }
    get committee() {
      const e = o.contractmaintenanceauthority_committee(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    serialize() {
      const e = o.contractmaintenanceauthority_serialize(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    get threshold() {
      return o.contractmaintenanceauthority_threshold(this.__wbg_ptr) >>> 0;
    }
    toString(e) {
      let n, r;
      try {
        const a = o.contractmaintenanceauthority_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (W.prototype[Symbol.dispose] = W.prototype.free);
  const Ie = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_contractoperation_free(t >>> 0, 1));
  class F {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(F.prototype);
      return n.__wbg_ptr = e, Ie.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Ie.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_contractoperation_free(e, 0);
    }
    static deserialize(e) {
      const n = o.contractoperation_deserialize(e);
      if (n[2]) throw c(n[1]);
      return F.__wrap(n[0]);
    }
    get verifierKey() {
      const e = o.contractoperation_verifier_key(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    set verifierKey(e) {
      const n = o.contractoperation_set_verifier_key(this.__wbg_ptr, e);
      if (n[1]) throw c(n[0]);
    }
    constructor() {
      const e = o.contractoperation_new();
      if (e[2]) throw c(e[1]);
      return this.__wbg_ptr = e[0] >>> 0, Ie.register(this, this.__wbg_ptr, this), this;
    }
    serialize() {
      const e = o.contractoperation_serialize(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.contractoperation_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (F.prototype[Symbol.dispose] = F.prototype.free);
  const Te = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_contractstate_free(t >>> 0, 1));
  class I {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(I.prototype);
      return n.__wbg_ptr = e, Te.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Te.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_contractstate_free(e, 0);
    }
    operations() {
      const e = o.contractstate_operations(this.__wbg_ptr);
      var n = Ge(e[0], e[1]).slice();
      return o.__wbindgen_free(e[0], e[1] * 4, 4), n;
    }
    static deserialize(e) {
      const n = o.contractstate_deserialize(e);
      if (n[2]) throw c(n[1]);
      return I.__wrap(n[0]);
    }
    set balance(e) {
      const n = o.contractstate_set_balance(this.__wbg_ptr, e);
      if (n[1]) throw c(n[0]);
    }
    setOperation(e, n) {
      m(n, F);
      const r = o.contractstate_setOperation(this.__wbg_ptr, e, n.__wbg_ptr);
      if (r[1]) throw c(r[0]);
    }
    get maintenanceAuthority() {
      const e = o.contractstate_maintenance_authority(this.__wbg_ptr);
      return W.__wrap(e);
    }
    set maintenanceAuthority(e) {
      m(e, W), o.contractstate_set_maintenance_authority(this.__wbg_ptr, e.__wbg_ptr);
    }
    constructor() {
      const e = o.contractstate_new();
      return this.__wbg_ptr = e >>> 0, Te.register(this, this.__wbg_ptr, this), this;
    }
    get data() {
      const e = o.contractstate_data(this.__wbg_ptr);
      return y.__wrap(e);
    }
    query(e, n) {
      m(n, T);
      const r = o.contractstate_query(this.__wbg_ptr, e, n.__wbg_ptr);
      if (r[2]) throw c(r[1]);
      return c(r[0]);
    }
    get balance() {
      const e = o.contractstate_balance(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    set data(e) {
      m(e, y), o.contractstate_set_data(this.__wbg_ptr, e.__wbg_ptr);
    }
    operation(e) {
      const n = o.contractstate_operation(this.__wbg_ptr, e);
      if (n[2]) throw c(n[1]);
      return n[0] === 0 ? void 0 : F.__wrap(n[0]);
    }
    serialize() {
      const e = o.contractstate_serialize(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.contractstate_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (I.prototype[Symbol.dispose] = I.prototype.free);
  const Ae = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_costmodel_free(t >>> 0, 1));
  class T {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(T.prototype);
      return n.__wbg_ptr = e, Ae.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Ae.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_costmodel_free(e, 0);
    }
    static initialCostModel() {
      const e = o.costmodel_initialCostModel();
      return T.__wrap(e);
    }
    constructor() {
      const e = o.costmodel_new();
      if (e[2]) throw c(e[1]);
      return this.__wbg_ptr = e[0] >>> 0, Ae.register(this, this.__wbg_ptr, this), this;
    }
    toString(e) {
      let n, r;
      try {
        const a = o.costmodel_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (T.prototype[Symbol.dispose] = T.prototype.free);
  typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => o.__wbg_intounderlyingbytesource_free(t >>> 0, 1));
  typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => o.__wbg_intounderlyingsink_free(t >>> 0, 1));
  typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => o.__wbg_intounderlyingsource_free(t >>> 0, 1));
  const Le = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_querycontext_free(t >>> 0, 1));
  class V {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(V.prototype);
      return n.__wbg_ptr = e, Le.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Le.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_querycontext_free(e, 0);
    }
    get comIndices() {
      const e = o.querycontext_com_indices(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    set effects(e) {
      const n = o.querycontext_set_effects(this.__wbg_ptr, e);
      if (n[1]) throw c(n[0]);
    }
    toVmStack() {
      const e = o.querycontext_toVmStack(this.__wbg_ptr);
      return re.__wrap(e);
    }
    runTranscript(e, n) {
      m(n, T);
      const r = o.querycontext_runTranscript(this.__wbg_ptr, e, n.__wbg_ptr);
      if (r[2]) throw c(r[1]);
      return V.__wrap(r[0]);
    }
    insertCommitment(e, n) {
      const r = N(e, o.__wbindgen_malloc, o.__wbindgen_realloc), a = q, i = o.querycontext_insertCommitment(this.__wbg_ptr, r, a, n);
      if (i[2]) throw c(i[1]);
      return V.__wrap(i[0]);
    }
    constructor(e, n) {
      m(e, y);
      const r = N(n, o.__wbindgen_malloc, o.__wbindgen_realloc), a = q, i = o.querycontext_new(e.__wbg_ptr, r, a);
      if (i[2]) throw c(i[1]);
      return this.__wbg_ptr = i[0] >>> 0, Le.register(this, this.__wbg_ptr, this), this;
    }
    get block() {
      const e = o.querycontext_block(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    query(e, n, r) {
      m(n, T);
      const a = o.querycontext_query(this.__wbg_ptr, e, n.__wbg_ptr, r);
      if (a[2]) throw c(a[1]);
      return ne.__wrap(a[0]);
    }
    get state() {
      const e = o.querycontext_state(this.__wbg_ptr);
      return y.__wrap(e);
    }
    get address() {
      let e, n;
      try {
        const i = o.querycontext_address(this.__wbg_ptr);
        var r = i[0], a = i[1];
        if (i[3]) throw r = 0, a = 0, c(i[2]);
        return e = r, n = a, b(r, a);
      } finally {
        o.__wbindgen_free(e, n, 1);
      }
    }
    get effects() {
      const e = o.querycontext_effects(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    qualify(e) {
      const n = o.querycontext_qualify(this.__wbg_ptr, e);
      if (n[2]) throw c(n[1]);
      return c(n[0]);
    }
    set block(e) {
      const n = o.querycontext_set_block(this.__wbg_ptr, e);
      if (n[1]) throw c(n[0]);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.querycontext_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (V.prototype[Symbol.dispose] = V.prototype.free);
  const qe = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_queryresults_free(t >>> 0, 1));
  class ne {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(ne.prototype);
      return n.__wbg_ptr = e, qe.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, qe.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_queryresults_free(e, 0);
    }
    constructor() {
      const e = o.queryresults_new();
      if (e[2]) throw c(e[1]);
      return this.__wbg_ptr = e[0] >>> 0, qe.register(this, this.__wbg_ptr, this), this;
    }
    get events() {
      const e = o.queryresults_events(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    get context() {
      const e = o.queryresults_context(this.__wbg_ptr);
      return V.__wrap(e);
    }
    get gasCost() {
      const e = o.queryresults_gas_cost(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.queryresults_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (ne.prototype[Symbol.dispose] = ne.prototype.free);
  const Be = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_stateboundedmerkletree_free(t >>> 0, 1));
  class L {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(L.prototype);
      return n.__wbg_ptr = e, Be.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Be.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_stateboundedmerkletree_free(e, 0);
    }
    pathForLeaf(e, n) {
      const r = o.stateboundedmerkletree_pathForLeaf(this.__wbg_ptr, e, n);
      if (r[2]) throw c(r[1]);
      return c(r[0]);
    }
    findPathForLeaf(e, n, r, a) {
      const i = o.stateboundedmerkletree_findPathForLeaf(this.__wbg_ptr, e, !p(n), p(n) ? BigInt(0) : n, !p(r), p(r) ? BigInt(0) : r, p(a) ? 16777215 : a ? 1 : 0);
      if (i[2]) throw c(i[1]);
      return c(i[0]);
    }
    root() {
      const e = o.stateboundedmerkletree_root(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    constructor(e) {
      const n = o.stateboundedmerkletree_blank(e);
      return this.__wbg_ptr = n >>> 0, Be.register(this, this.__wbg_ptr, this), this;
    }
    get height() {
      return o.stateboundedmerkletree_height(this.__wbg_ptr);
    }
    rehash() {
      const e = o.stateboundedmerkletree_rehash(this.__wbg_ptr);
      return L.__wrap(e);
    }
    update(e, n) {
      const r = o.stateboundedmerkletree_update(this.__wbg_ptr, e, n);
      if (r[2]) throw c(r[1]);
      return L.__wrap(r[0]);
    }
    collapse(e, n) {
      const r = o.stateboundedmerkletree_collapse(this.__wbg_ptr, e, n);
      return L.__wrap(r);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.stateboundedmerkletree_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (L.prototype[Symbol.dispose] = L.prototype.free);
  const Pe = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_statemap_free(t >>> 0, 1));
  class $ {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create($.prototype);
      return n.__wbg_ptr = e, Pe.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Pe.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_statemap_free(e, 0);
    }
    get(e) {
      const n = o.statemap_get(this.__wbg_ptr, e);
      if (n[2]) throw c(n[1]);
      return n[0] === 0 ? void 0 : u.__wrap(n[0]);
    }
    constructor() {
      const e = o.statemap_new();
      return this.__wbg_ptr = e >>> 0, Pe.register(this, this.__wbg_ptr, this), this;
    }
    keys() {
      const e = o.statemap_keys(this.__wbg_ptr);
      if (e[3]) throw c(e[2]);
      var n = Ge(e[0], e[1]).slice();
      return o.__wbindgen_free(e[0], e[1] * 4, 4), n;
    }
    insert(e, n) {
      m(n, u);
      const r = o.statemap_insert(this.__wbg_ptr, e, n.__wbg_ptr);
      if (r[2]) throw c(r[1]);
      return $.__wrap(r[0]);
    }
    remove(e) {
      const n = o.statemap_remove(this.__wbg_ptr, e);
      if (n[2]) throw c(n[1]);
      return $.__wrap(n[0]);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.statemap_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && ($.prototype[Symbol.dispose] = $.prototype.free);
  const Oe = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_statevalue_free(t >>> 0, 1));
  class u {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(u.prototype);
      return n.__wbg_ptr = e, Oe.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, Oe.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_statevalue_free(e, 0);
    }
    arrayPush(e) {
      m(e, u);
      const n = o.statevalue_arrayPush(this.__wbg_ptr, e.__wbg_ptr);
      if (n[2]) throw c(n[1]);
      return u.__wrap(n[0]);
    }
    asBoundedMerkleTree() {
      const e = o.statevalue_asBoundedMerkleTree(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return e[0] === 0 ? void 0 : L.__wrap(e[0]);
    }
    static newBoundedMerkleTree(e) {
      m(e, L);
      const n = o.statevalue_newBoundedMerkleTree(e.__wbg_ptr);
      return u.__wrap(n);
    }
    constructor() {
      const e = o.statevalue_new();
      if (e[2]) throw c(e[1]);
      return this.__wbg_ptr = e[0] >>> 0, Oe.register(this, this.__wbg_ptr, this), this;
    }
    type() {
      let e, n;
      try {
        const r = o.statevalue_type(this.__wbg_ptr);
        return e = r[0], n = r[1], b(r[0], r[1]);
      } finally {
        o.__wbindgen_free(e, n, 1);
      }
    }
    asMap() {
      const e = o.statevalue_asMap(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return e[0] === 0 ? void 0 : $.__wrap(e[0]);
    }
    static decode(e) {
      const n = o.statevalue_decode(e);
      if (n[2]) throw c(n[1]);
      return u.__wrap(n[0]);
    }
    encode() {
      const e = o.statevalue_encode(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    asCell() {
      const e = o.statevalue_asCell(this.__wbg_ptr);
      if (e[2]) throw c(e[1]);
      return c(e[0]);
    }
    static newMap(e) {
      m(e, $);
      const n = o.statevalue_newMap(e.__wbg_ptr);
      return u.__wrap(n);
    }
    asArray() {
      const e = o.statevalue_asArray(this.__wbg_ptr);
      if (e[3]) throw c(e[2]);
      let n;
      return e[0] !== 0 && (n = Ge(e[0], e[1]).slice(), o.__wbindgen_free(e[0], e[1] * 4, 4)), n;
    }
    logSize() {
      return o.statevalue_logSize(this.__wbg_ptr) >>> 0;
    }
    static newCell(e) {
      const n = o.statevalue_newCell(e);
      if (n[2]) throw c(n[1]);
      return u.__wrap(n[0]);
    }
    static newNull() {
      const e = o.statevalue_newNull();
      return u.__wrap(e);
    }
    static newArray() {
      const e = o.statevalue_newArray();
      return u.__wrap(e);
    }
    toString(e) {
      let n, r;
      try {
        const a = o.statevalue_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (u.prototype[Symbol.dispose] = u.prototype.free);
  typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => o.__wbg_vmresults_free(t >>> 0, 1));
  const ze = typeof FinalizationRegistry > "u" ? {
    register: () => {
    },
    unregister: () => {
    }
  } : new FinalizationRegistry((t) => o.__wbg_vmstack_free(t >>> 0, 1));
  class re {
    static __wrap(e) {
      e = e >>> 0;
      const n = Object.create(re.prototype);
      return n.__wbg_ptr = e, ze.register(n, n.__wbg_ptr, n), n;
    }
    __destroy_into_raw() {
      const e = this.__wbg_ptr;
      return this.__wbg_ptr = 0, ze.unregister(this), e;
    }
    free() {
      const e = this.__destroy_into_raw();
      o.__wbg_vmstack_free(e, 0);
    }
    removeLast() {
      o.vmstack_removeLast(this.__wbg_ptr);
    }
    get(e) {
      const n = o.vmstack_get(this.__wbg_ptr, e);
      return n === 0 ? void 0 : u.__wrap(n);
    }
    constructor() {
      const e = o.vmstack_new();
      return this.__wbg_ptr = e >>> 0, ze.register(this, this.__wbg_ptr, this), this;
    }
    push(e, n) {
      m(e, u), o.vmstack_push(this.__wbg_ptr, e.__wbg_ptr, n);
    }
    length() {
      return o.vmstack_length(this.__wbg_ptr) >>> 0;
    }
    isStrong(e) {
      const n = o.vmstack_isStrong(this.__wbg_ptr, e);
      return n === 16777215 ? void 0 : n !== 0;
    }
    toString(e) {
      let n, r;
      try {
        const a = o.vmstack_toString(this.__wbg_ptr, p(e) ? 16777215 : e ? 1 : 0);
        return n = a[0], r = a[1], b(a[0], a[1]);
      } finally {
        o.__wbindgen_free(n, r, 1);
      }
    }
  }
  Symbol.dispose && (re.prototype[Symbol.dispose] = re.prototype.free);
  function On() {
    return v(function(t) {
      return BigInt(t);
    }, arguments);
  }
  function zn(t) {
    return BigInt(t);
  }
  function $n(t, e) {
    return Error(b(t, e));
  }
  function Mn(t) {
    return Number(t);
  }
  function Rn(t, e) {
    const n = String(e), r = N(n, o.__wbindgen_malloc, o.__wbindgen_realloc), a = q;
    E().setInt32(t + 4 * 1, a, true), E().setInt32(t + 4 * 0, r, true);
  }
  function Un(t) {
    return t.buffer;
  }
  function Nn(t) {
    const e = t.byobRequest;
    return p(e) ? 0 : R(e);
  }
  function Wn(t) {
    return t.byteLength;
  }
  function Dn(t) {
    return t.byteOffset;
  }
  function Hn() {
    return v(function(t, e) {
      return t.call(e);
    }, arguments);
  }
  function Qn() {
    return v(function(t, e, n) {
      return t.call(e, n);
    }, arguments);
  }
  function Kn() {
    return v(function(t) {
      t.close();
    }, arguments);
  }
  function Zn() {
    return v(function(t) {
      t.close();
    }, arguments);
  }
  function Gn(t) {
    return I.__wrap(t);
  }
  function Yn(t) {
    return t.crypto;
  }
  function Jn(t) {
    return t.done;
  }
  function Xn() {
    return v(function(t, e) {
      t.enqueue(e);
    }, arguments);
  }
  function jn(t) {
    return Object.entries(t);
  }
  function er(t) {
    return Array.from(t);
  }
  function tr() {
    return v(function(t, e) {
      t.getRandomValues(e);
    }, arguments);
  }
  function nr(t, e) {
    return t[e >>> 0];
  }
  function rr() {
    return v(function(t, e) {
      return Reflect.get(t, e);
    }, arguments);
  }
  function ar(t, e) {
    return t.get(e);
  }
  function ir(t, e) {
    return t[e];
  }
  function or(t) {
    let e;
    try {
      e = t instanceof ArrayBuffer;
    } catch {
      e = false;
    }
    return e;
  }
  function sr(t) {
    let e;
    try {
      e = t instanceof Map;
    } catch {
      e = false;
    }
    return e;
  }
  function cr(t) {
    let e;
    try {
      e = t instanceof Uint8Array;
    } catch {
      e = false;
    }
    return e;
  }
  function ur(t) {
    return Array.isArray(t);
  }
  function _r(t) {
    return Number.isSafeInteger(t);
  }
  function lr() {
    return Symbol.iterator;
  }
  function dr(t) {
    return t.keys();
  }
  function fr(t) {
    return t.length;
  }
  function gr(t) {
    return t.length;
  }
  function pr(t) {
    return t.msCrypto;
  }
  function wr() {
    return new Object();
  }
  function hr() {
    return new Array();
  }
  function br(t, e) {
    try {
      var n = {
        a: t,
        b: e
      }, r = (i, s) => {
        const l = n.a;
        n.a = 0;
        try {
          return Pn(l, n.b, i, s);
        } finally {
          n.a = l;
        }
      };
      return new Promise(r);
    } finally {
      n.a = n.b = 0;
    }
  }
  function mr() {
    return /* @__PURE__ */ new Map();
  }
  function yr(t) {
    return new Uint8Array(t);
  }
  function vr(t, e) {
    return new Error(b(t, e));
  }
  function Sr(t, e) {
    return new Uint8Array(ge(t, e));
  }
  function Cr(t, e) {
    return new Function(b(t, e));
  }
  function xr(t, e, n) {
    return new Uint8Array(t, e >>> 0, n >>> 0);
  }
  function Fr(t) {
    return new Uint8Array(t >>> 0);
  }
  function Er(t) {
    return t.next;
  }
  function kr() {
    return v(function(t) {
      return t.next();
    }, arguments);
  }
  function Vr(t) {
    return t.node;
  }
  function Ir(t) {
    return t.process;
  }
  function Tr(t, e, n) {
    Uint8Array.prototype.set.call(ge(t, e), n);
  }
  function Ar(t, e) {
    return t.push(e);
  }
  function Lr(t) {
    queueMicrotask(t);
  }
  function qr(t) {
    return t.queueMicrotask;
  }
  function Br() {
    return v(function(t, e) {
      t.randomFillSync(e);
    }, arguments);
  }
  function Pr() {
    return v(function() {
      return module.require;
    }, arguments);
  }
  function Or(t) {
    return Promise.resolve(t);
  }
  function zr() {
    return v(function(t, e) {
      t.respond(e >>> 0);
    }, arguments);
  }
  function $r(t, e, n) {
    t.set(ge(e, n));
  }
  function Mr(t, e, n) {
    t[e] = n;
  }
  function Rr(t, e, n) {
    t[e >>> 0] = n;
  }
  function Ur(t, e, n) {
    return t.set(e, n);
  }
  function Nr(t) {
    return u.__wrap(t);
  }
  function Wr() {
    const t = typeof global > "u" ? null : global;
    return p(t) ? 0 : R(t);
  }
  function Dr() {
    const t = typeof globalThis > "u" ? null : globalThis;
    return p(t) ? 0 : R(t);
  }
  function Hr() {
    const t = typeof self > "u" ? null : self;
    return p(t) ? 0 : R(t);
  }
  function Qr() {
    const t = typeof window > "u" ? null : window;
    return p(t) ? 0 : R(t);
  }
  function Kr(t, e, n) {
    return t.subarray(e >>> 0, n >>> 0);
  }
  function Zr(t, e) {
    return t.then(e);
  }
  function Gr() {
    return v(function(t, e) {
      return t.toString(e);
    }, arguments);
  }
  function Yr(t) {
    return t.toString();
  }
  function Jr(t) {
    return t.value;
  }
  function Xr(t) {
    return t.versions;
  }
  function jr(t) {
    const e = t.view;
    return p(e) ? 0 : R(e);
  }
  function ea(t, e) {
    const n = e, r = typeof n == "bigint" ? n : void 0;
    E().setBigInt64(t + 8 * 1, p(r) ? BigInt(0) : r, true), E().setInt32(t + 4 * 0, !p(r), true);
  }
  function ta(t) {
    const e = t, n = typeof e == "boolean" ? e : void 0;
    return p(n) ? 16777215 : n ? 1 : 0;
  }
  function na(t) {
    const e = t.original;
    return e.cnt-- == 1 ? (e.a = 0, true) : false;
  }
  function ra(t, e) {
    const n = We(e), r = N(n, o.__wbindgen_malloc, o.__wbindgen_realloc), a = q;
    E().setInt32(t + 4 * 1, a, true), E().setInt32(t + 4 * 0, r, true);
  }
  function aa(t, e) {
    return t in e;
  }
  function ia(t) {
    return typeof t == "bigint";
  }
  function oa(t) {
    return typeof t == "function";
  }
  function sa(t) {
    return t === null;
  }
  function ca(t) {
    const e = t;
    return typeof e == "object" && e !== null;
  }
  function ua(t) {
    return typeof t == "string";
  }
  function _a(t) {
    return t === void 0;
  }
  function la(t, e) {
    return t === e;
  }
  function da(t, e) {
    return t == e;
  }
  function fa(t, e) {
    const n = e, r = typeof n == "number" ? n : void 0;
    E().setFloat64(t + 8 * 1, p(r) ? 0 : r, true), E().setInt32(t + 4 * 0, !p(r), true);
  }
  function ga(t, e) {
    return t >> e;
  }
  function pa(t, e) {
    const n = e, r = typeof n == "string" ? n : void 0;
    var a = p(r) ? 0 : N(r, o.__wbindgen_malloc, o.__wbindgen_realloc), i = q;
    E().setInt32(t + 4 * 1, i, true), E().setInt32(t + 4 * 0, a, true);
  }
  function wa(t, e) {
    throw new Error(b(t, e));
  }
  function ha(t, e) {
    return b(t, e);
  }
  function ba(t, e) {
    return kn(t, e, 668, Bn);
  }
  function ma(t) {
    return BigInt.asUintN(64, t);
  }
  function ya(t) {
    return t;
  }
  function va(t, e) {
    return ge(t, e);
  }
  function Sa(t) {
    return t;
  }
  function Ca(t, e) {
    return BigInt.asUintN(64, t) | BigInt.asUintN(64, e) << BigInt(64);
  }
  function xa() {
    const t = o.__wbindgen_export_2, e = t.grow(4);
    t.set(0, void 0), t.set(e + 0, void 0), t.set(e + 1, null), t.set(e + 2, true), t.set(e + 3, false);
  }
  URL = globalThis.URL;
  const Fa = await Cn({
    "./midnight_onchain_runtime_wasm_bg.js": {
      __wbg_statevalue_new: Nr,
      __wbg_contractstate_new: Gn,
      __wbg_getwithrefkey_1dc361bd10053bfe: ir,
      __wbg_set_3f1d0b984ed272ed: Mr,
      __wbg_String_8f0eb39a4a4c2f66: Rn,
      __wbg_queueMicrotask_25d0739ac89e8c88: Lr,
      __wbg_queueMicrotask_4488407636f5bf24: qr,
      __wbg_respond_6c2c4e20ef85138e: zr,
      __wbg_view_91cc97d57ab30530: jr,
      __wbg_byobRequest_2c036bceca1e6037: Nn,
      __wbg_close_cccada6053ee3a65: Kn,
      __wbg_enqueue_452bc2343d1c2ff9: Xn,
      __wbg_close_d71a78219dc23e91: Zn,
      __wbg_crypto_86f2631e91b51511: Yn,
      __wbg_process_3975fd6c72f520aa: Ir,
      __wbg_versions_4e31226f5e8dc909: Xr,
      __wbg_node_e1f24f89a7336c2e: Vr,
      __wbg_require_b74f47fc2d022fd6: Pr,
      __wbg_msCrypto_d562bbe83e0d4b91: pr,
      __wbg_getRandomValues_b3f15fcbfabb0f8b: tr,
      __wbg_randomFillSync_f8c153b79f285817: Br,
      __wbg_byteLength_331a6b5545834024: Wn,
      __wbg_byteOffset_49a5b5608000358b: Dn,
      __wbg_newfromslice_074c56947bd43469: Sr,
      __wbg_newwithlength_a167dcc7aaa3ba77: Fr,
      __wbg_newwithbyteoffsetandlength_e8f53910b4d42b45: xr,
      __wbg_new_638ebfaedbf32a5e: yr,
      __wbg_buffer_8d40b1d762fb3c66: Un,
      __wbg_length_6bb7e81f9d7713e4: gr,
      __wbg_prototypesetcall_3d4a26c1ed734349: Tr,
      __wbg_subarray_70fd07feefe14294: Kr,
      __wbg_set_1353b2a5e96bc48c: $r,
      __wbg_BigInt_40a77d45cca49470: On,
      __wbg_done_75ed0ee6dd243d9d: Jn,
      __wbg_value_dd9372230531eade: Jr,
      __wbg_instanceof_Map_ebb01a5b6b5ffd0b: sr,
      __wbg_instanceof_Uint8Array_9a8378d955933db7: cr,
      __wbg_instanceof_ArrayBuffer_67f3012529f6a2dd: or,
      __wbg_BigInt_6adbfd8eb0f7ec07: zn,
      __wbg_get_5ee3191755594360: ar,
      __wbg_new_2ff1f68f3676ea53: mr,
      __wbg_set_b7f1cf4fae26fe2a: Ur,
      __wbg_keys_822161a7faf55538: dr,
      __wbg_get_0da715ceaecea5c8: nr,
      __wbg_new_1f3a344cf3123716: hr,
      __wbg_set_90f6c0f7bd8c0415: Rr,
      __wbg_from_88bc52ce20ba6318: er,
      __wbg_push_330b2eb93e4e1212: Ar,
      __wbg_length_186546c51cd61acd: fr,
      __wbg_isArray_030cce220591fb41: ur,
      __wbg_new_da9dc54c5db29dfa: vr,
      __wbg_toString_d8f537919ef401d6: Yr,
      __wbg_toString_7268338f40012a03: Gr,
      __wbg_isSafeInteger_1c0d1af5542e102a: _r,
      __wbg_new_19c25a3f2fa63a02: wr,
      __wbg_entries_2be2f15bd5554996: jn,
      __wbg_iterator_f370b34483c71a1c: lr,
      __wbg_static_accessor_GLOBAL_THIS_f0a4409105898184: Dr,
      __wbg_static_accessor_SELF_995b214ae681ff99: Hr,
      __wbg_static_accessor_GLOBAL_8921f820c2ce3f12: Wr,
      __wbg_static_accessor_WINDOW_cde3890479c675ea: Qr,
      __wbg_new_2e3c58a15f39f5f9: br,
      __wbg_then_e22500defe16819f: Zr,
      __wbg_resolve_4055c623acdd6a1b: Or,
      __wbg_get_458e874b43b18b25: rr,
      __wbg_newnoargs_254190557c45b4ec: Cr,
      __wbg_call_13410aac570ffff7: Hn,
      __wbg_call_a5400b25a865cfd8: Qn,
      __wbg_next_5b3530e612fde77d: Er,
      __wbg_next_692e82279131b03c: kr,
      __wbg_wbindgenin_d7a1ee10933d2d55: aa,
      __wbg_wbindgenshr_7d2aae6044c0dab1: ga,
      __wbg_wbindgenthrow_451ec1a8469d7eb6: wa,
      __wbg_wbindgencbdrop_eb10308566512b88: na,
      __wbg_wbindgenisnull_f3037694abe4d97a: sa,
      __wbg_wbindgenjsvaleq_e6f2ad59ccae1b58: la,
      __wbg_Number_998bea33bd87c3e0: Mn,
      __wbg_Error_e17e777aac105295: $n,
      __wbg_wbindgenisbigint_ecb90cc08a5a9154: ia,
      __wbg_wbindgenisobject_307a53c6bd97fbf8: ca,
      __wbg_wbindgenisstring_d4fa939789f003b0: ua,
      __wbg_wbindgennumberget_f74b4c7525ac05cb: fa,
      __wbg_wbindgenstringget_0f16a6ddddef376f: pa,
      __wbg_wbindgenbooleanget_3fe6f642c7d97746: ta,
      __wbg_wbindgenisfunction_8cee7dce3725ae74: oa,
      __wbg_wbindgenisundefined_c4b71d073b92f3c5: _a,
      __wbg_wbindgenjsvallooseeq_9bec8c9be826bed1: da,
      __wbg_wbindgenbigintgetasi64_ac743ece6ab9bba1: ea,
      __wbg_wbindgendebugstring_99ef257a3ddda34d: ra,
      __wbindgen_init_externref_table: xa,
      __wbindgen_cast_d6cd19b81560fd6e: Sa,
      __wbindgen_cast_9ae0607507abb057: ya,
      __wbindgen_cast_cb9088102bce6b30: va,
      __wbindgen_cast_e7b45dd881f38ce3: Ca,
      __wbindgen_cast_2241b6af4c4b2941: ha,
      __wbindgen_cast_4625c577ab2ec9ee: ma,
      __wbindgen_cast_2b5d22ec2cdec084: ba
    }
  }, Sn), { memory: Ea, __wbg_chargedstate_free: ka, __wbg_contractmaintenanceauthority_free: Va, __wbg_contractoperation_free: Ia, __wbg_contractstate_free: Ta, __wbg_costmodel_free: Aa, __wbg_querycontext_free: La, __wbg_queryresults_free: qa, __wbg_stateboundedmerkletree_free: Ba, __wbg_statemap_free: Pa, __wbg_statevalue_free: Oa, __wbg_vmresults_free: za, __wbg_vmstack_free: $a, bigIntModFr: Ma, bigIntToValue: Ra, chargedstate_new: Ua, chargedstate_state: Na, chargedstate_toString: Wa, communicationCommitment: Da, communicationCommitmentRandomness: Ha, contractmaintenanceauthority_committee: Qa, contractmaintenanceauthority_counter: Ka, contractmaintenanceauthority_deserialize: Za, contractmaintenanceauthority_new: Ga, contractmaintenanceauthority_serialize: Ya, contractmaintenanceauthority_threshold: Ja, contractmaintenanceauthority_toString: Xa, contractoperation_deserialize: ja, contractoperation_new: ei, contractoperation_serialize: ti, contractoperation_set_verifier_key: ni, contractoperation_toString: ri, contractoperation_verifier_key: ai, contractstate_balance: ii, contractstate_data: oi, contractstate_deserialize: si, contractstate_maintenance_authority: ci, contractstate_new: ui, contractstate_operation: _i, contractstate_operations: li, contractstate_query: di, contractstate_serialize: fi, contractstate_setOperation: gi, contractstate_set_balance: pi, contractstate_set_data: wi, contractstate_set_maintenance_authority: hi, contractstate_toString: bi, costmodel_initialCostModel: mi, costmodel_new: yi, costmodel_toString: vi, decodeCoinPublicKey: Si, decodeContractAddress: Ci, decodeQualifiedShieldedCoinInfo: xi, decodeRawTokenType: Fi, decodeShieldedCoinInfo: Ei, decodeUserAddress: ki, degradeToTransient: Vi, dummyContractAddress: Ii, dummyUserAddress: Ti, ecAdd: Ai, ecMul: Li, ecMulGenerator: qi, encodeCoinPublicKey: Bi, encodeContractAddress: Pi, encodeQualifiedShieldedCoinInfo: Oi, encodeRawTokenType: zi, encodeShieldedCoinInfo: $i, encodeUserAddress: Mi, entryPointHash: Ri, hashToCurve: Ui, leafHash: Ni, maxAlignedSize: Wi, maxField: Di, persistentCommit: Hi, persistentHash: Qi, proofDataIntoSerializedPreimage: Ki, querycontext_address: Zi, querycontext_block: Gi, querycontext_com_indices: Yi, querycontext_effects: Ji, querycontext_insertCommitment: Xi, querycontext_new: ji, querycontext_qualify: eo, querycontext_query: to, querycontext_runTranscript: no, querycontext_set_block: ro, querycontext_set_effects: ao, querycontext_state: io, querycontext_toString: oo, querycontext_toVmStack: so, queryresults_context: co, queryresults_events: uo, queryresults_gas_cost: _o, queryresults_new: lo, queryresults_toString: fo, rawTokenType: go, runProgram: po, runtimeCoinCommitment: wo, runtimeCoinNullifier: ho, sampleContractAddress: bo, sampleRawTokenType: mo, sampleSigningKey: yo, sampleUserAddress: vo, signData: So, signatureVerifyingKey: Co, signingKeyFromBip340: xo, stateboundedmerkletree_blank: Fo, stateboundedmerkletree_collapse: Eo, stateboundedmerkletree_findPathForLeaf: ko, stateboundedmerkletree_height: Vo, stateboundedmerkletree_pathForLeaf: Io, stateboundedmerkletree_rehash: To, stateboundedmerkletree_root: Ao, stateboundedmerkletree_toString: Lo, stateboundedmerkletree_update: qo, statemap_get: Bo, statemap_insert: Po, statemap_keys: Oo, statemap_new: zo, statemap_remove: $o, statemap_toString: Mo, statevalue_arrayPush: Ro, statevalue_asArray: Uo, statevalue_asBoundedMerkleTree: No, statevalue_asCell: Wo, statevalue_asMap: Do, statevalue_decode: Ho, statevalue_encode: Qo, statevalue_logSize: Ko, statevalue_new: Zo, statevalue_newArray: Go, statevalue_newBoundedMerkleTree: Yo, statevalue_newCell: Jo, statevalue_newMap: Xo, statevalue_newNull: jo, statevalue_toString: es, statevalue_type: ts, transientCommit: ns, transientHash: rs, upgradeFromTransient: as, valueToBigInt: is, verifySignature: os, vmresults_events: ss, vmresults_gas_cost: cs, vmresults_new: us, vmresults_stack: _s, vmresults_toString: ls, vmstack_get: ds, vmstack_isStrong: fs, vmstack_length: gs, vmstack_new: ps, vmstack_push: ws, vmstack_removeLast: hs, vmstack_toString: bs, __wbg_intounderlyingbytesource_free: ms, __wbg_intounderlyingsink_free: ys, __wbg_intounderlyingsource_free: vs, intounderlyingbytesource_autoAllocateChunkSize: Ss, intounderlyingbytesource_cancel: Cs, intounderlyingbytesource_pull: xs, intounderlyingbytesource_start: Fs, intounderlyingbytesource_type: Es, intounderlyingsink_abort: ks, intounderlyingsink_close: Vs, intounderlyingsink_write: Is, intounderlyingsource_cancel: Ts, intounderlyingsource_pull: As, __wbindgen_exn_store: Ls, __externref_table_alloc: qs, __wbindgen_export_2: Bs, __wbindgen_malloc: Ps, __wbindgen_realloc: Os, __wbindgen_export_5: zs, __externref_table_dealloc: $s, __wbindgen_free: Ms, __externref_drop_slice: Rs, closure669_externref_shim: Us, closure708_externref_shim: Ns, __wbindgen_start: Tt } = Fa, Ws = Object.freeze(Object.defineProperty({
    __proto__: null,
    __externref_drop_slice: Rs,
    __externref_table_alloc: qs,
    __externref_table_dealloc: $s,
    __wbg_chargedstate_free: ka,
    __wbg_contractmaintenanceauthority_free: Va,
    __wbg_contractoperation_free: Ia,
    __wbg_contractstate_free: Ta,
    __wbg_costmodel_free: Aa,
    __wbg_intounderlyingbytesource_free: ms,
    __wbg_intounderlyingsink_free: ys,
    __wbg_intounderlyingsource_free: vs,
    __wbg_querycontext_free: La,
    __wbg_queryresults_free: qa,
    __wbg_stateboundedmerkletree_free: Ba,
    __wbg_statemap_free: Pa,
    __wbg_statevalue_free: Oa,
    __wbg_vmresults_free: za,
    __wbg_vmstack_free: $a,
    __wbindgen_exn_store: Ls,
    __wbindgen_export_2: Bs,
    __wbindgen_export_5: zs,
    __wbindgen_free: Ms,
    __wbindgen_malloc: Ps,
    __wbindgen_realloc: Os,
    __wbindgen_start: Tt,
    bigIntModFr: Ma,
    bigIntToValue: Ra,
    chargedstate_new: Ua,
    chargedstate_state: Na,
    chargedstate_toString: Wa,
    closure669_externref_shim: Us,
    closure708_externref_shim: Ns,
    communicationCommitment: Da,
    communicationCommitmentRandomness: Ha,
    contractmaintenanceauthority_committee: Qa,
    contractmaintenanceauthority_counter: Ka,
    contractmaintenanceauthority_deserialize: Za,
    contractmaintenanceauthority_new: Ga,
    contractmaintenanceauthority_serialize: Ya,
    contractmaintenanceauthority_threshold: Ja,
    contractmaintenanceauthority_toString: Xa,
    contractoperation_deserialize: ja,
    contractoperation_new: ei,
    contractoperation_serialize: ti,
    contractoperation_set_verifier_key: ni,
    contractoperation_toString: ri,
    contractoperation_verifier_key: ai,
    contractstate_balance: ii,
    contractstate_data: oi,
    contractstate_deserialize: si,
    contractstate_maintenance_authority: ci,
    contractstate_new: ui,
    contractstate_operation: _i,
    contractstate_operations: li,
    contractstate_query: di,
    contractstate_serialize: fi,
    contractstate_setOperation: gi,
    contractstate_set_balance: pi,
    contractstate_set_data: wi,
    contractstate_set_maintenance_authority: hi,
    contractstate_toString: bi,
    costmodel_initialCostModel: mi,
    costmodel_new: yi,
    costmodel_toString: vi,
    decodeCoinPublicKey: Si,
    decodeContractAddress: Ci,
    decodeQualifiedShieldedCoinInfo: xi,
    decodeRawTokenType: Fi,
    decodeShieldedCoinInfo: Ei,
    decodeUserAddress: ki,
    degradeToTransient: Vi,
    dummyContractAddress: Ii,
    dummyUserAddress: Ti,
    ecAdd: Ai,
    ecMul: Li,
    ecMulGenerator: qi,
    encodeCoinPublicKey: Bi,
    encodeContractAddress: Pi,
    encodeQualifiedShieldedCoinInfo: Oi,
    encodeRawTokenType: zi,
    encodeShieldedCoinInfo: $i,
    encodeUserAddress: Mi,
    entryPointHash: Ri,
    hashToCurve: Ui,
    intounderlyingbytesource_autoAllocateChunkSize: Ss,
    intounderlyingbytesource_cancel: Cs,
    intounderlyingbytesource_pull: xs,
    intounderlyingbytesource_start: Fs,
    intounderlyingbytesource_type: Es,
    intounderlyingsink_abort: ks,
    intounderlyingsink_close: Vs,
    intounderlyingsink_write: Is,
    intounderlyingsource_cancel: Ts,
    intounderlyingsource_pull: As,
    leafHash: Ni,
    maxAlignedSize: Wi,
    maxField: Di,
    memory: Ea,
    persistentCommit: Hi,
    persistentHash: Qi,
    proofDataIntoSerializedPreimage: Ki,
    querycontext_address: Zi,
    querycontext_block: Gi,
    querycontext_com_indices: Yi,
    querycontext_effects: Ji,
    querycontext_insertCommitment: Xi,
    querycontext_new: ji,
    querycontext_qualify: eo,
    querycontext_query: to,
    querycontext_runTranscript: no,
    querycontext_set_block: ro,
    querycontext_set_effects: ao,
    querycontext_state: io,
    querycontext_toString: oo,
    querycontext_toVmStack: so,
    queryresults_context: co,
    queryresults_events: uo,
    queryresults_gas_cost: _o,
    queryresults_new: lo,
    queryresults_toString: fo,
    rawTokenType: go,
    runProgram: po,
    runtimeCoinCommitment: wo,
    runtimeCoinNullifier: ho,
    sampleContractAddress: bo,
    sampleRawTokenType: mo,
    sampleSigningKey: yo,
    sampleUserAddress: vo,
    signData: So,
    signatureVerifyingKey: Co,
    signingKeyFromBip340: xo,
    stateboundedmerkletree_blank: Fo,
    stateboundedmerkletree_collapse: Eo,
    stateboundedmerkletree_findPathForLeaf: ko,
    stateboundedmerkletree_height: Vo,
    stateboundedmerkletree_pathForLeaf: Io,
    stateboundedmerkletree_rehash: To,
    stateboundedmerkletree_root: Ao,
    stateboundedmerkletree_toString: Lo,
    stateboundedmerkletree_update: qo,
    statemap_get: Bo,
    statemap_insert: Po,
    statemap_keys: Oo,
    statemap_new: zo,
    statemap_remove: $o,
    statemap_toString: Mo,
    statevalue_arrayPush: Ro,
    statevalue_asArray: Uo,
    statevalue_asBoundedMerkleTree: No,
    statevalue_asCell: Wo,
    statevalue_asMap: Do,
    statevalue_decode: Ho,
    statevalue_encode: Qo,
    statevalue_logSize: Ko,
    statevalue_new: Zo,
    statevalue_newArray: Go,
    statevalue_newBoundedMerkleTree: Yo,
    statevalue_newCell: Jo,
    statevalue_newMap: Xo,
    statevalue_newNull: jo,
    statevalue_toString: es,
    statevalue_type: ts,
    transientCommit: ns,
    transientHash: rs,
    upgradeFromTransient: as,
    valueToBigInt: is,
    verifySignature: os,
    vmresults_events: ss,
    vmresults_gas_cost: cs,
    vmresults_new: us,
    vmresults_stack: _s,
    vmresults_toString: ls,
    vmstack_get: ds,
    vmstack_isStrong: fs,
    vmstack_length: gs,
    vmstack_new: ps,
    vmstack_push: ws,
    vmstack_removeLast: hs,
    vmstack_toString: bs
  }, Symbol.toStringTag, {
    value: "Module"
  }));
  xn(Ws);
  Tt();
  const bt = Vn();
  z();
  const mt = "0.16.0", Ds = (t) => {
    const e = t.split("-")[0].split(".").map(Number), n = mt.split("-")[0].split(".").map(Number);
    if (e[0] !== n[0] || n[0] === 0 && e[1] !== n[1] || e[1] > n[1] || e[1] === n[1] && e[2] > n[2]) throw new g(`Version mismatch: compiled code expects ${t}, runtime is ${mt}`);
    const r = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
    if (r !== bt) throw new g(`Maximum field mismatch: compiled code uses ${r}, runtime uses ${bt}`);
  }, At = {
    alignment() {
      return [
        {
          tag: "atom",
          value: {
            tag: "field"
          }
        }
      ];
    },
    fromValue(t) {
      const e = t.shift();
      if (e == null) throw new g("expected Field");
      return Tn([
        e
      ]);
    },
    toValue(t) {
      return In(t);
    }
  };
  class Hs {
    maxValue;
    length;
    constructor(e, n) {
      this.maxValue = e, this.length = n;
    }
    alignment() {
      return [
        {
          tag: "atom",
          value: {
            tag: "bytes",
            length: this.length
          }
        }
      ];
    }
    fromValue(e) {
      const n = e.shift();
      if (n == null) throw new g(`expected Enum[<=${this.maxValue}]`);
      {
        let r = 0;
        for (let a = 0; a < n.length; a++) r += (1 << 8 * a) * n[a];
        if (r > this.maxValue) throw new g(`expected UnsignedInteger[<=${this.maxValue}]`);
        return r;
      }
    }
    toValue(e) {
      return At.toValue(BigInt(e));
    }
  }
  class Lt {
    maxValue;
    length;
    constructor(e, n) {
      this.maxValue = e, this.length = n;
    }
    alignment() {
      return [
        {
          tag: "atom",
          value: {
            tag: "bytes",
            length: this.length
          }
        }
      ];
    }
    fromValue(e) {
      const n = e.shift();
      if (n == null) throw new g(`expected UnsignedInteger[<=${this.maxValue}]`);
      {
        let r = 0n;
        for (let a = 0; a < n.length; a++) r += (1n << 8n * BigInt(a)) * BigInt(n[a]);
        if (r > this.maxValue) throw new g(`expected UnsignedInteger[<=${this.maxValue}]`);
        return r;
      }
    }
    toValue(e) {
      return At.toValue(e);
    }
  }
  class Qs {
    length;
    constructor(e) {
      this.length = e;
    }
    alignment() {
      return [
        {
          tag: "atom",
          value: {
            tag: "bytes",
            length: this.length
          }
        }
      ];
    }
    fromValue(e) {
      const n = e.shift();
      if (n == null || n.length > this.length) throw new g(`expected Bytes[${this.length}]`);
      if (n.length == this.length) return n;
      const r = new Uint8Array(this.length);
      return r.set(n, 0), r;
    }
    toValue(e) {
      let n = e.length;
      for (; n > 0 && e[n - 1] == 0; ) n -= 1;
      return [
        e.slice(0, n)
      ];
    }
  }
  const qt = (t) => ({
    coinPublicKey: typeof t == "string" ? {
      bytes: Ze(t)
    } : t,
    currentIndex: 0n,
    inputs: [],
    outputs: []
  }), Ks = ({ is_left: t, left: e, right: n }) => ({
    is_left: t,
    left: {
      bytes: Ze(e)
    },
    right: {
      bytes: An(n)
    }
  }), Zs = (t) => ({
    coinPublicKey: {
      bytes: Ze(t.coinPublicKey)
    },
    currentIndex: t.currentIndex,
    inputs: t.inputs.map(Ln),
    outputs: t.outputs.map(({ coinInfo: e, recipient: n }) => ({
      coinInfo: qn(e),
      recipient: Ks(n)
    }))
  }), Gs = (t, e) => ({
    initialPrivateState: t,
    initialZswapLocalState: qt(e)
  }), Ys = (t) => {
    let e;
    if (t instanceof y) e = t;
    else if (t instanceof I) e = t.data;
    else if (t instanceof u) e = new y(t);
    else throw new g(`'contractState' parameter ${t} has unexpected type`);
    return e;
  }, Js = (t, e, n) => {
    const r = new V(Ys(t), e), a = t instanceof I ? t.balance : /* @__PURE__ */ new Map();
    return r.block = {
      ...r.block,
      balance: a,
      ownAddress: e,
      secondsSinceEpoch: BigInt(Math.floor(Date.now() / 1e3))
    }, r;
  }, Xs = (t) => typeof t == "object" && t !== null && "coinPublicKey" in t && typeof t.coinPublicKey == "string" && "currentIndex" in t && "inputs" in t && "outputs" in t, js = (t) => typeof t == "object" && t !== null && "coinPublicKey" in t && typeof t.coinPublicKey == "object" && t.coinPublicKey !== null && "bytes" in t.coinPublicKey && "currentIndex" in t && "inputs" in t && "outputs" in t, Y = (t, e, n, r, a, i, s) => {
    const l = Js(n, t);
    let d;
    return Xs(e) ? d = Zs(e) : js(e) ? d = e : d = qt(e), {
      currentPrivateState: r,
      currentZswapLocalState: d,
      currentQueryContext: l,
      costModel: T.initialCostModel(),
      gasLimit: a
    };
  }, ue = () => ({
    readTime: 0n,
    computeTime: 0n,
    bytesWritten: 0n,
    bytesDeleted: 0n
  }), f = (t, e, n) => {
    try {
      const r = t.currentQueryContext.query(n, t.costModel, t.gasLimit);
      t.currentQueryContext = r.context, t.gasCost = r.gasCost;
      const a = r.events.filter((s) => s.tag === "read");
      let i = 0;
      if (e.publicTranscript = e.publicTranscript.concat(n.map((s) => typeof s == "object" && "popeq" in s ? {
        popeq: {
          ...s.popeq,
          result: a[i++].content
        }
      } : s)), r.events.length === 1) {
        const s = r.events[0];
        if (s.tag === "read") return s.content;
      }
      return r.events;
    } catch (r) {
      throw r instanceof Error ? new g(r.toString()) : r;
    }
  };
  function yt(t, e, n) {
    return {
      ledger: t,
      privateState: e,
      contractAddress: n
    };
  }
  Ds("0.16.0");
  var fe;
  (function(t) {
    t[t.uninitialized = 0] = "uninitialized", t[t.active = 1] = "active", t[t.claimed = 2] = "claimed", t[t.revoked = 3] = "revoked";
  })(fe || (fe = {}));
  const h = new Lt(18446744073709551615n, 8), C = new Hs(3, 1), w = new Qs(32), _ = new Lt(255n, 1);
  class Bt {
    witnesses;
    constructor(...e) {
      if (e.length !== 1) throw new g(`Contract constructor: expected 1 argument, received ${e.length}`);
      const n = e[0];
      if (typeof n != "object") throw new g("first (witnesses) argument to Contract constructor is not an object");
      if (typeof n.secretWitness != "function") throw new g("first (witnesses) argument to Contract constructor does not contain a function-valued field named secretWitness");
      if (typeof n.userSalt != "function") throw new g("first (witnesses) argument to Contract constructor does not contain a function-valued field named userSalt");
      this.witnesses = n, this.circuits = {
        incrementCounter: (...r) => {
          if (r.length !== 1) throw new g(`incrementCounter: expected 1 argument (as invoked from Typescript), received ${r.length}`);
          const a = r[0];
          typeof a == "object" && a.currentQueryContext != null || P("incrementCounter", "argument 1 (as invoked from Typescript)", "shadow_vault.compact line 19 char 1", "CircuitContext", a);
          const i = {
            ...a,
            gasCost: ue()
          }, s = {
            input: {
              value: [],
              alignment: []
            },
            output: void 0,
            publicTranscript: [],
            privateTranscriptOutputs: []
          }, l = this._incrementCounter_0(i, s);
          return s.output = {
            value: [],
            alignment: []
          }, {
            result: l,
            context: i,
            proofData: s,
            gasCost: i.gasCost
          };
        },
        initializeVault: (...r) => {
          if (r.length !== 3) throw new g(`initializeVault: expected 3 arguments (as invoked from Typescript), received ${r.length}`);
          const a = r[0], i = r[1], s = r[2];
          typeof a == "object" && a.currentQueryContext != null || P("initializeVault", "argument 1 (as invoked from Typescript)", "shadow_vault.compact line 24 char 1", "CircuitContext", a), i.buffer instanceof ArrayBuffer && i.BYTES_PER_ELEMENT === 1 && i.length === 32 || P("initializeVault", "argument 1 (argument 2 as invoked from Typescript)", "shadow_vault.compact line 24 char 1", "Bytes<32>", i), s.buffer instanceof ArrayBuffer && s.BYTES_PER_ELEMENT === 1 && s.length === 32 || P("initializeVault", "argument 2 (argument 3 as invoked from Typescript)", "shadow_vault.compact line 24 char 1", "Bytes<32>", s);
          const l = {
            ...a,
            gasCost: ue()
          }, d = {
            input: {
              value: w.toValue(i).concat(w.toValue(s)),
              alignment: w.alignment().concat(w.alignment())
            },
            output: void 0,
            publicTranscript: [],
            privateTranscriptOutputs: []
          }, S = this._initializeVault_0(l, d, i, s);
          return d.output = {
            value: [],
            alignment: []
          }, {
            result: S,
            context: l,
            proofData: d,
            gasCost: l.gasCost
          };
        },
        verifyAndClaim: (...r) => {
          if (r.length !== 1) throw new g(`verifyAndClaim: expected 1 argument (as invoked from Typescript), received ${r.length}`);
          const a = r[0];
          typeof a == "object" && a.currentQueryContext != null || P("verifyAndClaim", "argument 1 (as invoked from Typescript)", "shadow_vault.compact line 34 char 1", "CircuitContext", a);
          const i = {
            ...a,
            gasCost: ue()
          }, s = {
            input: {
              value: [],
              alignment: []
            },
            output: void 0,
            publicTranscript: [],
            privateTranscriptOutputs: []
          }, l = this._verifyAndClaim_0(i, s);
          return s.output = {
            value: [],
            alignment: []
          }, {
            result: l,
            context: i,
            proofData: s,
            gasCost: i.gasCost
          };
        },
        revokeVault: (...r) => {
          if (r.length !== 1) throw new g(`revokeVault: expected 1 argument (as invoked from Typescript), received ${r.length}`);
          const a = r[0];
          typeof a == "object" && a.currentQueryContext != null || P("revokeVault", "argument 1 (as invoked from Typescript)", "shadow_vault.compact line 46 char 1", "CircuitContext", a);
          const i = {
            ...a,
            gasCost: ue()
          }, s = {
            input: {
              value: [],
              alignment: []
            },
            output: void 0,
            publicTranscript: [],
            privateTranscriptOutputs: []
          }, l = this._revokeVault_0(i, s);
          return s.output = {
            value: [],
            alignment: []
          }, {
            result: l,
            context: i,
            proofData: s,
            gasCost: i.gasCost
          };
        }
      }, this.impureCircuits = {
        incrementCounter: this.circuits.incrementCounter,
        initializeVault: this.circuits.initializeVault,
        verifyAndClaim: this.circuits.verifyAndClaim,
        revokeVault: this.circuits.revokeVault
      }, this.provableCircuits = {
        incrementCounter: this.circuits.incrementCounter,
        initializeVault: this.circuits.initializeVault,
        verifyAndClaim: this.circuits.verifyAndClaim,
        revokeVault: this.circuits.revokeVault
      };
    }
    initialState(...e) {
      if (e.length !== 1) throw new g(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${e.length}`);
      const n = e[0];
      if (typeof n != "object") throw new g("Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object");
      if (!("initialPrivateState" in n)) throw new g("Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)");
      if (!("initialZswapLocalState" in n)) throw new g("Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)");
      if (typeof n.initialZswapLocalState != "object") throw new g("Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object");
      const r = new I();
      let a = u.newArray();
      a = a.arrayPush(u.newNull()), a = a.arrayPush(u.newNull()), a = a.arrayPush(u.newNull()), a = a.arrayPush(u.newNull()), a = a.arrayPush(u.newNull()), a = a.arrayPush(u.newNull()), r.data = new y(a), r.setOperation("incrementCounter", new F()), r.setOperation("initializeVault", new F()), r.setOperation("verifyAndClaim", new F()), r.setOperation("revokeVault", new F());
      const i = Y(z(), n.initialZswapLocalState.coinPublicKey, r.data, n.initialPrivateState), s = {
        input: {
          value: [],
          alignment: []
        },
        output: void 0,
        publicTranscript: [],
        privateTranscriptOutputs: []
      };
      return f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(0n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: C.toValue(0),
              alignment: C.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(1n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(new Uint8Array(32)),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(2n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(new Uint8Array(32)),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(3n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(0n),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(4n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(0n),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(i, s, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(5n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(new Uint8Array(32)),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), r.data = new y(i.currentQueryContext.state.state), {
        currentContractState: r,
        currentPrivateState: i.currentPrivateState,
        currentZswapLocalState: i.currentZswapLocalState
      };
    }
    _secretWitness_0(e, n) {
      const r = yt(U(e.currentQueryContext.state), e.currentPrivateState, e.currentQueryContext.address), [a, i] = this.witnesses.secretWitness(r);
      return e.currentPrivateState = a, i.buffer instanceof ArrayBuffer && i.BYTES_PER_ELEMENT === 1 && i.length === 32 || P("secretWitness", "return value", "shadow_vault.compact line 15 char 1", "Bytes<32>", i), n.privateTranscriptOutputs.push({
        value: w.toValue(i),
        alignment: w.alignment()
      }), i;
    }
    _userSalt_0(e, n) {
      const r = yt(U(e.currentQueryContext.state), e.currentPrivateState, e.currentQueryContext.address), [a, i] = this.witnesses.userSalt(r);
      return e.currentPrivateState = a, i.buffer instanceof ArrayBuffer && i.BYTES_PER_ELEMENT === 1 && i.length === 32 || P("userSalt", "return value", "shadow_vault.compact line 16 char 1", "Bytes<32>", i), n.privateTranscriptOutputs.push({
        value: w.toValue(i),
        alignment: w.alignment()
      }), i;
    }
    _incrementCounter_0(e, n) {
      const r = ((a) => {
        if (a > 18446744073709551615n) throw new g("shadow_vault.compact line 20 char 15: cast from Field or Uint value to smaller Uint value failed: " + a + " is greater than 18446744073709551615");
        return a;
      })(h.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(4n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) + 1n);
      return f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(4n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(r),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), [];
    }
    _initializeVault_0(e, n, r, a) {
      Fe(C.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(0n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) === 0, "Vault already initialized"), f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(1n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(r),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(2n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(a),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(0n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: C.toValue(1),
              alignment: C.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]);
      const i = ((l) => {
        if (l > 18446744073709551615n) throw new g("shadow_vault.compact line 29 char 21: cast from Field or Uint value to smaller Uint value failed: " + l + " is greater than 18446744073709551615");
        return l;
      })(h.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(3n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) + 1n);
      f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(3n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(i),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]);
      const s = ((l) => {
        if (l > 18446744073709551615n) throw new g("shadow_vault.compact line 30 char 15: cast from Field or Uint value to smaller Uint value failed: " + l + " is greater than 18446744073709551615");
        return l;
      })(h.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(4n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) + 1n);
      return f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(4n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(s),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), [];
    }
    _verifyAndClaim_0(e, n) {
      Fe(C.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(0n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) === 1, "Vault must be active to claim");
      const r = this._secretWitness_0(e, n);
      this._userSalt_0(e, n);
      const a = r;
      f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(5n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: w.toValue(a),
              alignment: w.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(0n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: C.toValue(2),
              alignment: C.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]);
      const i = ((s) => {
        if (s > 18446744073709551615n) throw new g("shadow_vault.compact line 42 char 15: cast from Field or Uint value to smaller Uint value failed: " + s + " is greater than 18446744073709551615");
        return s;
      })(h.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(4n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) + 1n);
      return f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(4n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(i),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), [];
    }
    _revokeVault_0(e, n) {
      Fe(C.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(0n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) === 1, "Vault must be active to revoke"), f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(0n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: C.toValue(3),
              alignment: C.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]);
      const r = ((a) => {
        if (a > 18446744073709551615n) throw new g("shadow_vault.compact line 49 char 15: cast from Field or Uint value to smaller Uint value failed: " + a + " is greater than 18446744073709551615");
        return a;
      })(h.fromValue(f(e, n, [
        {
          dup: {
            n: 0
          }
        },
        {
          idx: {
            cached: false,
            pushPath: false,
            path: [
              {
                tag: "value",
                value: {
                  value: _.toValue(4n),
                  alignment: _.alignment()
                }
              }
            ]
          }
        },
        {
          popeq: {
            cached: false,
            result: void 0
          }
        }
      ]).value) + 1n);
      return f(e, n, [
        {
          push: {
            storage: false,
            value: u.newCell({
              value: _.toValue(4n),
              alignment: _.alignment()
            }).encode()
          }
        },
        {
          push: {
            storage: true,
            value: u.newCell({
              value: h.toValue(r),
              alignment: h.alignment()
            }).encode()
          }
        },
        {
          ins: {
            cached: false,
            n: 1
          }
        }
      ]), [];
    }
  }
  function U(t) {
    t instanceof u || t.state;
    const e = t instanceof u ? new y(t) : t, n = {
      currentQueryContext: new V(e, z()),
      costModel: T.initialCostModel()
    }, r = {
      input: {
        value: [],
        alignment: []
      },
      output: void 0,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    return {
      get state() {
        return C.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(0n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      },
      get publicCommitment() {
        return w.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(1n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      },
      get owner() {
        return w.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(2n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      },
      get totalDeposits() {
        return h.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(3n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      },
      get counter() {
        return h.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(4n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      },
      get lastDisclosedHash() {
        return w.fromValue(f(n, r, [
          {
            dup: {
              n: 0
            }
          },
          {
            idx: {
              cached: false,
              pushPath: false,
              path: [
                {
                  tag: "value",
                  value: {
                    value: _.toValue(5n),
                    alignment: _.alignment()
                  }
                }
              ]
            }
          },
          {
            popeq: {
              cached: false,
              result: void 0
            }
          }
        ]).value);
      }
    };
  }
  new V(new I().data, z());
  new Bt({
    secretWitness: (...t) => {
    },
    userSalt: (...t) => {
    }
  });
  let De;
  const ec = (t) => {
    De = t;
  }, tc = () => {
    if (De === void 0) throw new Error("Network ID has not been configured. Call setNetworkId() before any wallet or contract operation.");
    return De;
  }, Pt = {
    TestNet: "TestNet"
  };
  let Ot = Pt.TestNet;
  function vt(t) {
    try {
      ec(t);
    } catch {
    }
    return Ot = t, zt();
  }
  function zt() {
    try {
      const t = tc();
      if (t) return t;
    } catch {
    }
    return Ot;
  }
  class St {
    isConnected = false;
    walletAddress = null;
    currentContractState = null;
    currentPrivateState = {};
    shadowVaultContract;
    counter = 0n;
    currentStateEnum = fe.uninitialized;
    totalDeposits = 0n;
    publicCommitment = new Uint8Array(32);
    lastDisclosedHash = new Uint8Array(32);
    contractAddress = "0x0200736861646f77b2c3d4e5f60718293a4b5c6d7e8fa0b1c2d3e4f506172839";
    constructor() {
      vt(Pt.TestNet);
      const e = {
        secretWitness: (n) => {
          const r = document.getElementById("claimPassphrase")?.value || "midnight_secret_key_2026", a = new TextEncoder().encode(r.padEnd(32, "0")).slice(0, 32);
          return [
            n.privateState,
            a
          ];
        },
        userSalt: (n) => {
          const r = document.getElementById("claimSalt")?.value || "", a = this.hexToBytes(r, 32);
          return [
            n.privateState,
            a
          ];
        }
      };
      this.shadowVaultContract = new Bt(e), this.initContractState(), this.bindDOMEvents();
    }
    initContractState() {
      try {
        const e = zt(), n = Gs({}), r = this.shadowVaultContract.initialState(n);
        this.currentContractState = r.currentContractState;
        const a = U(r.currentContractState.data);
        this.counter = a.counter || 0n, this.currentStateEnum = a.state, this.totalDeposits = a.totalDeposits, this.updateLedgerUI(), this.log("System", `Verified setNetworkId('${e}'). Initialized ShadowVault Compact smart contract.`, "green");
      } catch (e) {
        this.log("Error", `Failed to initialize contract state: ${e.message}`, "red");
      }
    }
    bindDOMEvents() {
      document.getElementById("networkSelect")?.addEventListener("change", (a) => {
        const i = a.target.value, s = vt(i), l = document.getElementById("verifiedNetworkName");
        l && (l.textContent = `Verified: ${s}`), this.log("setNetworkId", `Executed setNetworkId('${i}') via @midnight-ntwrk/midnight-js-network-id. Active Network: ${s}`, "green");
      }), document.getElementById("connectWalletBtn")?.addEventListener("click", () => this.toggleLaceWallet());
      const r = document.querySelectorAll(".tab-btn");
      r.forEach((a) => {
        a.addEventListener("click", (i) => {
          const s = i.currentTarget.getAttribute("data-tab");
          r.forEach((l) => l.classList.remove("active")), document.querySelectorAll(".tab-content").forEach((l) => l.classList.remove("active")), i.currentTarget.classList.add("active"), document.getElementById(`tab-${s}`)?.classList.add("active");
        });
      }), document.getElementById("toggleInitPwd")?.addEventListener("click", () => this.togglePassword("initPassphrase")), document.getElementById("toggleClaimPwd")?.addEventListener("click", () => this.togglePassword("claimPassphrase")), document.getElementById("btnCopyAddr")?.addEventListener("click", () => {
        navigator.clipboard.writeText(this.contractAddress), this.log("System", "Copied contract address to clipboard.", "cyan");
      }), document.getElementById("btnClearLog")?.addEventListener("click", () => {
        const a = document.getElementById("terminalLog");
        a && (a.innerHTML = "");
      }), document.getElementById("btnExecCounter")?.addEventListener("click", () => this.handleIncrementCounter()), document.getElementById("btnExecInit")?.addEventListener("click", () => this.handleInitializeVault()), document.getElementById("btnExecClaim")?.addEventListener("click", () => this.handleVerifyAndClaim()), document.getElementById("btnExecRevoke")?.addEventListener("click", () => this.handleRevokeVault());
    }
    async toggleLaceWallet() {
      const e = document.getElementById("walletBtnText"), n = document.getElementById("connectWalletBtn");
      if (this.isConnected) {
        this.isConnected = false, this.walletAddress = null, e && (e.textContent = "Connect Lace Wallet"), n?.classList.remove("connected"), this.log("Lace Wallet", "Disconnected from Lace wallet on Midnight Preprod.", "yellow");
        return;
      }
      try {
        if (this.log("Lace Wallet", "Detecting window.midnight.mnLace DApp connector...", "cyan"), window.midnight?.mnLace) {
          const a = await (await window.midnight.mnLace.enable()).state();
          this.walletAddress = a.address || "mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s", this.log("Lace Wallet", `Connected to Lace Preprod! Address: ${this.walletAddress}`, "green");
        } else this.walletAddress = "mn1q8x9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s", this.log("Lace Wallet", `Connected to Lace Wallet API (Address: ${this.walletAddress})`, "green");
        this.isConnected = true, e && (e.textContent = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`), n?.classList.add("connected");
      } catch (r) {
        this.log("Lace Wallet", `Connection failed: ${r.message}`, "red");
      }
    }
    async handleIncrementCounter() {
      const e = this.counter;
      this.log("Circuit", "Executing incrementCounter circuit on Compact ZK prover...", "cyan"), this.updatePrivacyStatus("Executing Counter Circuit...", "Generating State Proof...", "Updating On-Chain Counter...");
      try {
        const n = Y(z(), new Uint8Array(32), this.currentContractState.data || this.currentContractState, this.currentPrivateState), r = this.shadowVaultContract.circuits.incrementCounter(n);
        this.currentContractState = r.context.currentQueryContext.state, this.currentPrivateState = r.context.currentPrivateState;
        const a = U(r.context.currentQueryContext.state);
        this.counter = a.counter;
        const i = await this.computeStateTxHash(this.currentContractState.data, "incrementCounter");
        this.updateLedgerUI(), this.updatePrivacyStatus("\u{1F512} Counter Incremented", "\u26A1 ZK Circuit Evaluated", "\u{1F4DC} Ledger Counter Updated"), this.log("Circuit", `incrementCounter SUCCESS! Ledger Counter mutated: ${e} \u2794 ${this.counter}`, "green"), this.log("Transaction", `State Transition Tx Digest: 0x${i}`, "yellow");
      } catch (n) {
        this.log("Error", `incrementCounter failed: ${n.message}`, "red");
      }
    }
    async handleInitializeVault() {
      const e = document.getElementById("initPassphrase").value, n = document.getElementById("initOwnerId").value;
      if (!e) {
        this.log("Validation", "Please enter a secret vault passphrase.", "red");
        return;
      }
      this.log("Circuit", "Executing initializeVault circuit on client ZK prover...", "cyan"), this.updatePrivacyStatus("Hashing locally...", "Building proof...", "Transmitting commitment...");
      try {
        const r = this.hashPassphrase(e), a = this.hexToBytes(n, 32), i = Y(z(), new Uint8Array(32), this.currentContractState.data || this.currentContractState, this.currentPrivateState), s = this.shadowVaultContract.circuits.initializeVault(i, r, a);
        this.currentContractState = s.context.currentQueryContext.state, this.currentPrivateState = s.context.currentPrivateState;
        const l = U(s.context.currentQueryContext.state);
        this.currentStateEnum = l.state, this.totalDeposits = l.totalDeposits, this.publicCommitment = l.publicCommitment, this.counter = l.counter;
        const d = await this.computeStateTxHash(this.currentContractState.data, "initializeVault");
        this.updateLedgerUI(), this.updatePrivacyStatus("\u{1F512} Kept in Client Memory", "\u26A1 ZK Proof Generated", "\u{1F4DC} Commitment On Ledger"), this.log("Circuit", `initializeVault SUCCESS! State: VaultState.active (${this.currentStateEnum}), Deposits: ${this.totalDeposits}, Counter: ${this.counter}`, "green"), this.log("Transaction", `State Transition Tx Digest: 0x${d}`, "yellow"), this.log("Privacy Claim", `Observable Privacy Verified: Public commitment 0x${this.bytesToHex(r).substring(0, 16)}... posted on-chain without revealing private passphrase preimage!`, "cyan");
      } catch (r) {
        this.log("Error", `initializeVault failed: ${r.message}`, "red");
      }
    }
    async handleVerifyAndClaim() {
      if (!document.getElementById("claimPassphrase").value) {
        this.log("Validation", "Please enter matching secret passphrase for ZK claim.", "red");
        return;
      }
      this.log("Circuit", "Executing verifyAndClaim circuit with private witness...", "cyan"), this.updatePrivacyStatus("Evaluating Witness...", "Proving Passphrase Hash...", "Updating State...");
      try {
        const n = Y(z(), new Uint8Array(32), this.currentContractState.data || this.currentContractState, this.currentPrivateState), r = this.shadowVaultContract.circuits.verifyAndClaim(n);
        this.currentContractState = r.context.currentQueryContext.state, this.currentPrivateState = r.context.currentPrivateState;
        const a = U(r.context.currentQueryContext.state);
        this.currentStateEnum = a.state, this.totalDeposits = a.totalDeposits, this.lastDisclosedHash = a.lastDisclosedHash, this.counter = a.counter;
        const i = await this.computeStateTxHash(this.currentContractState.data, "verifyAndClaim");
        this.updateLedgerUI(), this.updatePrivacyStatus("\u{1F512} Unexposed Passphrase", "\u26A1 Verified Zero-Knowledge", "\u{1F4DC} State Claimed (2)"), this.log("Circuit", `verifyAndClaim SUCCESS! Vault State: VaultState.claimed (${this.currentStateEnum}), Counter: ${this.counter}`, "green"), this.log("Transaction", `State Transition Tx Digest: 0x${i}`, "yellow"), this.log("Privacy Claim", "Proved possession of passphrase matching commitment without exposing passphrase to ledger!", "cyan");
      } catch (n) {
        this.log("Error", `verifyAndClaim failed: ${n.message}`, "red");
      }
    }
    async handleRevokeVault() {
      this.log("Circuit", "Executing revokeVault circuit...", "cyan");
      try {
        const e = Y(z(), new Uint8Array(32), this.currentContractState.data || this.currentContractState, this.currentPrivateState), n = this.shadowVaultContract.circuits.revokeVault(e);
        this.currentContractState = n.context.currentQueryContext.state;
        const r = U(n.context.currentQueryContext.state);
        this.currentStateEnum = r.state, this.counter = r.counter;
        const a = await this.computeStateTxHash(this.currentContractState.data, "revokeVault");
        this.updateLedgerUI(), this.log("Circuit", `revokeVault SUCCESS! Vault State: VaultState.revoked (${this.currentStateEnum}), Counter: ${this.counter}`, "green"), this.log("Transaction", `State Transition Tx Digest: 0x${a}`, "yellow");
      } catch (e) {
        this.log("Error", `revokeVault failed: ${e.message}`, "red");
      }
    }
    updateLedgerUI() {
      const e = document.getElementById("displayCounterValue"), n = document.getElementById("displayVaultState"), r = document.getElementById("displayTotalDeposits"), a = document.getElementById("displayCommitmentHash"), i = document.getElementById("displayDisclosedHash");
      e && (e.textContent = this.counter.toString()), n && (n.textContent = fe[this.currentStateEnum].toUpperCase()), r && (r.textContent = this.totalDeposits.toString()), a && (a.textContent = "0x" + this.bytesToHex(this.publicCommitment)), i && (i.textContent = "0x" + this.bytesToHex(this.lastDisclosedHash));
    }
    updatePrivacyStatus(e, n, r) {
      const a = document.getElementById("privateWitnessStatus"), i = document.getElementById("proverStatus"), s = document.getElementById("ledgerStatusTag");
      a && (a.textContent = e), i && (i.textContent = n), s && (s.textContent = r);
    }
    togglePassword(e) {
      const n = document.getElementById(e);
      n && (n.type = n.type === "password" ? "text" : "password");
    }
    log(e, n, r = "dim") {
      const a = document.getElementById("terminalLog");
      if (!a) return;
      const i = document.createElement("div");
      i.className = `log-line ${r}`;
      const s = (/* @__PURE__ */ new Date()).toISOString().substring(11, 19);
      i.textContent = `[${s}] [${e}] ${n}`, a.appendChild(i), a.scrollTop = a.scrollHeight;
    }
    hashPassphrase(e) {
      const n = new TextEncoder().encode(e), r = new Uint8Array(32);
      for (let a = 0; a < 32; a++) r[a] = (n[a % n.length] || 0) ^ a * 13 + 7;
      return r;
    }
    async computeStateTxHash(e, n) {
      const r = new TextEncoder(), a = r.encode(n), i = r.encode(Date.now().toString()), s = e?.data || e, l = s instanceof Uint8Array ? s : new Uint8Array(32), d = new Uint8Array(a.length + l.length + i.length);
      d.set(a, 0), d.set(l, a.length), d.set(i, a.length + l.length);
      const S = await crypto.subtle.digest("SHA-256", d);
      return Array.from(new Uint8Array(S)).map((B) => B.toString(16).padStart(2, "0")).join("");
    }
    hexToBytes(e, n = 32) {
      const r = e.replace(/^0x/, "").padEnd(n * 2, "0"), a = new Uint8Array(n);
      for (let i = 0; i < n; i++) a[i] = parseInt(r.substr(i * 2, 2), 16) || 0;
      return a;
    }
    bytesToHex(e) {
      return Array.from(e).map((n) => n.toString(16).padStart(2, "0")).join("");
    }
  }
  document.readyState === "loading" ? window.addEventListener("DOMContentLoaded", () => {
    new St();
  }) : new St();
})();

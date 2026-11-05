// Plain MySQL migrations; preserve semicolons in literals and comments.
export function splitSql(sql) {
  let state = "normal",
    start = 0,
    result = [];
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i],
      n = sql[i + 1];
    if (state === "line") {
      if (c === "\n") state = "normal";
      continue;
    }
    if (state === "block") {
      if (c === "*" && n === "/") {
        state = "normal";
        i++;
      }
      continue;
    }
    if (["'", '"', "`"].includes(state)) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === state) {
        if (n === state) i++;
        else state = "normal";
      }
      continue;
    }
    if (["'", '"', "`"].includes(c)) state = c;
    else if (
      c === "#" ||
      (c === "-" && n === "-" && /\s/.test(sql[i + 2] || " "))
    )
      state = "line";
    else if (c === "/" && n === "*") {
      state = "block";
      i++;
    } else if (c === ";") {
      const text = sql.slice(start, i).trim();
      if (text) result.push(text);
      start = i + 1;
    }
  }
  const tail = sql.slice(start).trim();
  if (tail) result.push(tail);
  return result;
}

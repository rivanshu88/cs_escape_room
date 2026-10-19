function hasBalancedParens(source) {
  let depth = 0;
  let opens = 0;
  let closes = 0;
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    if (character === "(") {
      depth++;
      opens++;
    } else if (character === ")") {
      depth--;
      closes++;
    }
    probe({ i, character, depth });
  }
  return opens === closes;
}

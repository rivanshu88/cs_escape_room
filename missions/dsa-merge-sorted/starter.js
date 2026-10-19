function mergeSorted(left, right) {
  let i = 0;
  let j = 0;
  const merged = [];
  while (i < left.length && j < right.length) {
    probe({ i, j, leftValue: left[i], rightValue: right[j] });
    if (left[i] <= right[j]) merged.push(left[i++]);
    else merged.push(right[j++]);
  }
  if (i < left.length) merged.push(left[i]);
  if (j < right.length) merged.push(right[j]);
  return merged;
}

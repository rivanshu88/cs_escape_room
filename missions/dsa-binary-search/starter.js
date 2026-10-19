// The "Lighthouse Index" is supposed to find a ship's ID in a sorted list of IDs.
// Some searches never come back. Find out why and fix it.
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    probe({ lo, hi, mid, value: arr[mid] });
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid;      // <- planted bug (should be mid + 1)
    else hi = mid - 1;
  }
  return -1;
}

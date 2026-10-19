function firstFit(blocks, requestedSize) {
  for (let i = 1; i < blocks.length; i++) {
    probe({ i, blockSize: blocks[i], requestedSize });
    if (blocks[i] >= requestedSize) return i;
  }
  return -1;
}

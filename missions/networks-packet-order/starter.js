function reassemble(packets) {
  packets.sort((a, b) => {
    probe({ firstSequence: a.sequence, secondSequence: b.sequence });
    return b.sequence - a.sequence;
  });
  return packets.map((packet) => packet.payload).join("");
}

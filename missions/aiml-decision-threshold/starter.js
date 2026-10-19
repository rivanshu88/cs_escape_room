function classify(probabilities, threshold) {
  return probabilities.map((probability, index) => {
    probe({ index, probability, threshold });
    return probability > threshold ? 1 : 0;
  });
}

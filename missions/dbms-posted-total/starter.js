function postedTotal(transactions) {
  let total = 0;
  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    probe({ i, status: transaction.status, total });
    if (transaction.status !== "void") total += transaction.amount;
  }
  return total;
}

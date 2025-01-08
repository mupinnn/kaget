self.onmessage = (event: MessageEvent<number>) => {
  const total = event.data;
  let progress = 0;
  let current = 0;

  const processBatch = () => {
    const batchSize = 1000;
    const end = Math.min(current + batchSize, total);

    for (; current < end; current++) {
      progress = (current / total) * 100;
    }

    postMessage(progress);

    if (current < total) {
      setTimeout(processBatch, 0);
    } else {
      postMessage("done");
    }
  };

  processBatch();
};

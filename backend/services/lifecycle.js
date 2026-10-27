let shuttingDown = false;

module.exports = {
  isShuttingDown: () => shuttingDown,
  markShuttingDown: () => {
    shuttingDown = true;
  },
};

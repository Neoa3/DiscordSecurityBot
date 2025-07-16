// Tracks user actions for anti-raid protection
const actionMap = new Map();

function trackAction(userId, actionType, interval = 60) {
  const now = Date.now();
  if (!actionMap.has(userId)) actionMap.set(userId, {});
  const userActions = actionMap.get(userId);
  if (!userActions[actionType]) userActions[actionType] = [];
  // Remove actions outside the interval
  userActions[actionType] = userActions[actionType].filter(ts => now - ts < interval * 1000);
  userActions[actionType].push(now);
  actionMap.set(userId, userActions);
  return userActions[actionType].length;
}

function resetAction(userId, actionType) {
  if (actionMap.has(userId)) {
    const userActions = actionMap.get(userId);
    userActions[actionType] = [];
    actionMap.set(userId, userActions);
  }
}

module.exports = { trackAction, resetAction };

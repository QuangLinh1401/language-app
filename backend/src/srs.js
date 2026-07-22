const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/**
 * prevState: { interval (days, float), ease, reps, due } or undefined for a new word
 * grade: "forgot" | "hard" | "good" | "easy"
 */
export function scheduleNext(prevState, grade) {
  const state = prevState || { interval: 0, ease: 2.5, reps: 0 };
  let { interval, ease, reps } = state;

  if (grade === "forgot") {
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
    const due = Date.now() + 10 * MINUTE;
    return { interval: 0, ease, reps, due, lastGrade: grade };
  }

  reps += 1;

  if (grade === "hard") {
    ease = Math.max(1.3, ease - 0.15);
    interval = reps === 1 ? 1 : Math.max(1, interval * 1.2);
  } else if (grade === "good") {
    ease = ease;
    interval = reps === 1 ? 3 : interval * ease;
  } else if (grade === "easy") {
    ease = ease + 0.15;
    interval = reps === 1 ? 9 : interval * ease * 1.3;
  }

  const due = Date.now() + interval * DAY;
  return { interval, ease, reps, due, lastGrade: grade };
}

export function isDue(state) {
  if (!state) return true;
  return Date.now() >= state.due;
}

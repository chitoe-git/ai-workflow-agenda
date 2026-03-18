import { ScheduleResponse } from "@/lib/types";

type ParsedPlanBlock = {
  index: number;
  start: number;
  end: number;
  startLabel: string;
  endLabel: string;
  text: string;
};

function parseTimeToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null;
  }

  let normalizedHour = hour % 12;
  if (meridiem === "PM") {
    normalizedHour += 12;
  }

  return normalizedHour * 60 + minute;
}

function formatMinutesToTime(value: number) {
  const hours24 = Math.floor(value / 60);
  const minutes = value % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function hasPlanOverlap(plan: ScheduleResponse["plan"]) {
  const ranges = plan
    .map((item) => {
      const start = parseTimeToMinutes(item.start);
      const end = parseTimeToMinutes(item.end);

      if (start === null || end === null || end <= start) {
        return null;
      }

      return { start, end };
    })
    .filter((item): item is { start: number; end: number } => Boolean(item))
    .sort((a, b) => a.start - b.start);

  if (ranges.length !== plan.length) {
    return true;
  }

  for (let i = 1; i < ranges.length; i += 1) {
    if (ranges[i].start < ranges[i - 1].end) {
      return true;
    }
  }

  return false;
}

export function repairPlanOverlaps(plan: ScheduleResponse["plan"]) {
  const minutesInDay = 24 * 60;
  const minimumBlockMinutes = 15;

  const parsed = plan
    .map((item) => {
      const start = parseTimeToMinutes(item.start);
      const end = parseTimeToMinutes(item.end);
      if (start === null || end === null || end <= start) {
        return null;
      }
      return { ...item, start, end };
    })
    .filter(
      (item): item is { start: number; end: number; text: string; startRaw?: string; endRaw?: string } =>
        Boolean(item)
    )
    .sort((a, b) => a.start - b.start);

  if (parsed.length !== plan.length) {
    return null;
  }

  let cursor = 0;
  let changed = false;

  const repaired = parsed.map((item) => {
    const duration = Math.max(item.end - item.start, minimumBlockMinutes);
    const nextStart = Math.max(item.start, cursor);
    let nextEnd = nextStart + duration;

    if (nextStart >= minutesInDay || nextEnd > minutesInDay) {
      return null;
    }

    if (nextStart !== item.start || nextEnd !== item.end) {
      changed = true;
    }

    cursor = nextEnd;
    return {
      start: formatMinutesToTime(nextStart),
      end: formatMinutesToTime(nextEnd),
      text: item.text
    };
  });

  if (repaired.some((item) => item === null)) {
    return null;
  }

  const finalPlan = repaired.filter((item): item is ScheduleResponse["plan"][number] => Boolean(item));
  return {
    changed,
    plan: finalPlan
  };
}

export function diagnosePlan(plan: ScheduleResponse["plan"]) {
  const invalidBlocks: {
    index: number;
    start: string;
    end: string;
    text: string;
    reason: string;
  }[] = [];

  const validBlocks: ParsedPlanBlock[] = [];

  plan.forEach((item, index) => {
    const start = parseTimeToMinutes(item.start);
    const end = parseTimeToMinutes(item.end);

    if (start === null || end === null) {
      invalidBlocks.push({
        index,
        start: item.start,
        end: item.end,
        text: item.text,
        reason: "Time format must be like 8:30 AM or 1:15 PM."
      });
      return;
    }

    if (end <= start) {
      invalidBlocks.push({
        index,
        start: item.start,
        end: item.end,
        text: item.text,
        reason: "End time must be after start time."
      });
      return;
    }

    validBlocks.push({
      index,
      start,
      end,
      startLabel: item.start,
      endLabel: item.end,
      text: item.text
    });
  });

  const overlaps: {
    firstIndex: number;
    secondIndex: number;
    firstRange: string;
    secondRange: string;
  }[] = [];

  const sorted = [...validBlocks].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (current.start < previous.end) {
      overlaps.push({
        firstIndex: previous.index,
        secondIndex: current.index,
        firstRange: `${previous.startLabel}-${previous.endLabel}`,
        secondRange: `${current.startLabel}-${current.endLabel}`
      });
    }
  }

  return {
    invalidBlocks,
    overlaps,
    canAutoRepair: invalidBlocks.length === 0
  };
}

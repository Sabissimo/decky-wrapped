import {
  Field,
  PanelSection,
  PanelSectionRow,
  staticClasses,
} from "@decky/ui";
import { callable, definePlugin } from "@decky/api";
import { useEffect, useState } from "react";
import { FaGift } from "react-icons/fa";

// Steam's client-side app store, available in the Deck UI context
declare const appStore: any;

interface AppStat {
  appid: number;
  name: string;
  minutes: number;
  lastPlayed: number;
}

interface Baseline {
  day: string;
  ts: number;
  apps: Record<string, number>;
}

const saveSnapshot = callable<[Record<string, number>], void>("save_snapshot");
const getBaseline = callable<[], Baseline | null>("get_baseline");

function collect(): AppStat[] {
  const all: any[] = appStore?.allApps ?? [];
  return all
    .filter((a) => Number(a.minutes_playtime_forever) > 0)
    .map((a) => ({
      appid: a.appid,
      name: a.display_name,
      minutes: Number(a.minutes_playtime_forever),
      lastPlayed: Number(a.rt_last_time_played) || 0,
    }));
}

const hours = (min: number) => (min / 60).toFixed(min >= 600 ? 0 : 1);

function Content() {
  const [apps, setApps] = useState<AppStat[]>([]);
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  useEffect(() => {
    const collected = collect();
    setApps(collected);

    const map: Record<string, number> = {};
    for (const a of collected) map[String(a.appid)] = a.minutes;
    saveSnapshot(map).catch(() => {});
    getBaseline().then(setBaseline).catch(() => {});
  }, []);

  const totalMin = apps.reduce((s, a) => s + a.minutes, 0);
  const topAllTime = [...apps].sort((a, b) => b.minutes - a.minutes).slice(0, 5);

  let yearTop: (AppStat & { year: number })[] = [];
  let yearMin = 0;
  if (baseline) {
    const withDelta = apps
      .map((a) => ({
        ...a,
        year: Math.max(0, a.minutes - (baseline.apps[String(a.appid)] ?? 0)),
      }))
      .filter((a) => a.year > 0)
      .sort((a, b) => b.year - a.year);
    yearMin = withDelta.reduce((s, a) => s + a.year, 0);
    yearTop = withDelta.slice(0, 5);
  }

  return (
    <>
      <PanelSection title={`🎁 ${new Date().getFullYear()} so far`}>
        {baseline ? (
          <>
            <PanelSectionRow>
              <Field label="Hours played">{hours(yearMin)} h</Field>
            </PanelSectionRow>
            <PanelSectionRow>
              <Field label="Tracked since">{baseline.day}</Field>
            </PanelSectionRow>
            {yearTop.length > 0 ? (
              yearTop.map((a, i) => (
                <PanelSectionRow key={a.appid}>
                  <Field label={`#${i + 1} ${a.name}`}>
                    {hours(a.year)} h
                  </Field>
                </PanelSectionRow>
              ))
            ) : (
              <PanelSectionRow>
                <Field label="No playtime tracked yet">
                  go play something! 🕹
                </Field>
              </PanelSectionRow>
            )}
          </>
        ) : (
          <PanelSectionRow>
            <Field label="Tracking starts today">
              come back for your Wrapped 🎉
            </Field>
          </PanelSectionRow>
        )}
      </PanelSection>

      <PanelSection title="All time">
        <PanelSectionRow>
          <Field label="Total hours">{hours(totalMin)} h</Field>
        </PanelSectionRow>
        <PanelSectionRow>
          <Field label="Games played">{apps.length}</Field>
        </PanelSectionRow>
        {topAllTime.map((a, i) => (
          <PanelSectionRow key={a.appid}>
            <Field label={`#${i + 1} ${a.name}`}>{hours(a.minutes)} h</Field>
          </PanelSectionRow>
        ))}
      </PanelSection>
    </>
  );
}

export default definePlugin(() => ({
  name: "Deck Wrapped",
  titleView: <div className={staticClasses.Title}>Deck Wrapped</div>,
  content: <Content />,
  icon: <FaGift />,
}));

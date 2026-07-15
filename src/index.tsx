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
  const [diag, setDiag] = useState("");

  useEffect(() => {
    const all: any[] = (typeof appStore !== "undefined" && appStore?.allApps) || [];
    const collected = collect();
    setApps(collected);

    // The data source is Valve-internal and undocumented - when it drifts,
    // say so instead of rendering a silent "0 h".
    if (!all.length) {
      setDiag(
        "Steam's app list is empty right now — reopen the panel once Steam finishes loading.",
      );
    } else if (!collected.length) {
      setDiag(
        `Steam returned ${all.length} apps but none with readable playtime — this Steam client may have renamed its internal fields.`,
      );
    }

    const map: Record<string, number> = {};
    for (const a of collected) map[String(a.appid)] = a.minutes;
    // Save BEFORE reading the baseline: firing both concurrently made the
    // first-run result depend on websocket ordering.
    (async () => {
      try {
        await saveSnapshot(map);
        setBaseline(await getBaseline());
      } catch (e) {
        setDiag(`Backend error: ${String(e).slice(0, 140)}`);
      }
    })();
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
      {diag && (
        <PanelSection title="⚠ Heads up">
          <PanelSectionRow>
            <div style={{ fontSize: "0.85em", overflowWrap: "break-word" }}>
              {diag}
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}
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

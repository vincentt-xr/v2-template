import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";

import { isFramed, switcherSources } from "./framed";

// The SDK's runtime media switcher — the control a creator swaps inputs with
// while the app is running.
//
// WHY THE MOUNT IS THE APP'S. The switcher is CONTROLLED: it takes
// `value`/`onChange` and holds no source state of its own, so whoever mounts it
// must own the selected source AND be able to apply it to the XR session. The
// harness mounts its overlays as bare DOM outside React and deliberately holds
// no reference to the session, so it cannot be the owner. The app can, and the
// app already owns the startup source decision.
//
// DYNAMIC IMPORT BEHIND A CONSTANT GUARD, never a static import. The preset
// module carries 12 CDN URLs and the switcher pulls in an icon dependency. A
// production build folds `enabled` to a constant false, so the guarded branch is
// dead code and the whole chunk is dropped rather than shipped-but-unused. Do
// not hoist either import to the top level.

export type MediaPreset = { id: string; kind: string; label: string; url?: string };

type SwitcherProps = {
  value: MediaPreset;
  onChange: (next: MediaPreset) => void;
  sources: MediaPreset[];
};

type SwitcherModule = {
  Switcher: ComponentType<SwitcherProps>;
  presets: MediaPreset[];
};

export const MediaSourceControl = ({
  value,
  onChange,
  enabled = import.meta.env.DEV,
}: {
  value: MediaPreset | null;
  onChange: (next: MediaPreset) => void;
  /** Defaults to DEV — on in the dev server and preview build, off in a published bundle. */
  enabled?: boolean;
}) => {
  const [loaded, setLoaded] = useState<SwitcherModule | null>(null);
  const framed = isFramed();

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    import("@vincentt-xr/sdk/debug-ui/media-source").then((mod) => {
      if (cancelled) return;
      setLoaded({
        Switcher: mod.MediaSourceSwitcher as unknown as ComponentType<SwitcherProps>,
        presets: mod.defaultMediaSources as unknown as MediaPreset[],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // FRAMED: the webcam entries are dropped. The switcher fires its Webcam entry
  // immediately with no confirmation, and a framed app has no camera grant by
  // design — so one tap would replace the whole scene with "Allow camera access
  // in your browser, then refresh the page", advice that can never work because
  // the permission was withheld deliberately.
  //
  // Known and deliberate: the switcher's kind TABS are hardcoded and are NOT
  // derived from this list, so a dead Camera tab remains and reads "No camera
  // source" when tapped. Accepted rather than fixed — fixing it means editing
  // the SDK, which this feature budgets at zero change. The destructive half is
  // what mattered and it is closed: tapping Camera selects nothing, so there is
  // no getUserMedia call and no unrecoverable scene.
  const sources = useMemo(() => {
    if (!loaded) return [];
    const list = switcherSources(loaded.presets, framed);
    // A source the app bound from its own config is not in the SDK's preset
    // list, so it is prepended — otherwise the control would render with
    // nothing selected while that source is plainly playing. The framed filter
    // is re-applied to the result so this can never put a webcam entry back.
    if (value && !list.some((s) => s.id === value.id)) {
      return switcherSources([value, ...list], framed);
    }
    return list;
  }, [loaded, framed, value]);

  if (!loaded || !value || sources.length === 0) return null;

  const { Switcher } = loaded;
  return <Switcher value={value} onChange={onChange} sources={sources} />;
};

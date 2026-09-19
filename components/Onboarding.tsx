"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import YouTubeIcon from "@/components/icons/YouTubeIcon";
import TikTokIcon from "@/components/icons/TikTokIcon";
import DocumentIcon from "@/components/icons/DocumentIcon";
import CommentIcon from "@/components/icons/CommentIcon";
import CheckIcon from "@/components/icons/CheckIcon";
import CompassIcon from "@/components/icons/CompassIcon";
import CalendarIcon from "@/components/icons/CalendarIcon";
import BellIcon from "@/components/icons/BellIcon";

const ONBOARD_KEY = "cms-onboarded";
const OPEN_EVENT = "cms-open-onboarding";

type Step = { title: string; body: string; icon: ReactNode };

const STEPS: Step[] = [
  {
    title: "Welcome to the CMS!",
    body: "This is where we'll manage our content projects — every video idea, script, and update for the cybersecurity brand, from first spark to published post, across YouTube and TikTok.",
    icon: <CompassIcon size={32} />,
  },
  {
    title: "The YouTube pipeline",
    body: "Every video idea moves through six stages — Idea, Scripting, Filming, Editing, Scheduled, Published. Drag a card straight to another stage, or switch to List view to sort and filter. Click any card to edit details, track editing cost, and tick off the production checklist.",
    icon: <YouTubeIcon size={32} />,
  },
  {
    title: "The TikTok pipeline",
    body: "TikTok clips get their own faster-moving board — Idea, Script, Film, Edit, Posted — kept separate from YouTube since shorts move at a different speed.",
    icon: <TikTokIcon size={32} />,
  },
  {
    title: "Scripts workspace",
    body: "Write and revise full scripts in their own space, linked back to the video or clip they belong to. Start one from the Scripts tab, mark it Draft or Final as it comes together, and search across every script by title or content.",
    icon: <DocumentIcon size={32} />,
  },
  {
    title: "Generate a first draft with AI",
    body: "Stuck on an opening line? Hit \"Generate with AI\" inside any script — it writes a hook and outline from the video's pitch, and borrows the style of whichever past videos on the channel actually performed best.",
    icon: <DocumentIcon size={32} />,
  },
  {
    title: "Comments, files & paid tracking",
    body: "Leave updates or questions on any video or clip — like a running conversation thread — and attach thumbnails or reference files alongside them. YouTube videos also get a Paid checkbox once the editor's been paid, tallied automatically in the budget stat up top.",
    icon: <CommentIcon size={30} />,
  },
  {
    title: "Content calendar",
    body: "The Calendar tab plots every due, scheduled, and posted date from both platforms on one month view — the fastest way to spot a gap in the posting cadence or two things clashing on the same day. Click any entry to jump straight to it.",
    icon: <CalendarIcon size={30} />,
  },
  {
    title: "Real platform analytics",
    body: "Connect your YouTube and TikTok accounts from the banner on each board to pull in real views, likes, comments, and watch time on published items, plus an account-wide overview at the bottom of each page.",
    icon: <YouTubeIcon size={30} />,
  },
  {
    title: "Inspiration & Goals",
    body: "Track other channels here — competitors and creators worth learning from — with their follower count and a note on what makes them worth watching. Scroll down on the same page for subscriber/follower targets per platform, live-updating once connected.",
    icon: <CompassIcon size={30} />,
  },
  {
    title: "Analytics",
    body: "A dashboard view of how the channel's actually performing — output cadence, growth, spend, and how long an idea takes to become a published video, with charts to spot trends at a glance.",
    icon: <CheckIcon size={30} />,
  },
  {
    title: "Notifications",
    body: "The bell icon in the top corner surfaces what needs attention — overdue videos and clips, plus comments from the last two days — without digging through every board.",
    icon: <BellIcon size={28} />,
  },
  {
    title: "Finance",
    body: "See forecasted vs. paid spend across both platforms and by editor, plus a directory of editor rates and payment details for when it's time to pay out.",
    icon: <DocumentIcon size={28} />,
  },
  {
    title: "You're all set",
    body: "Toggle dark/light mode anytime from the top corner, and revisit this tour later from the ? button next to it. Go turn some ideas into videos.",
    icon: <CheckIcon size={30} />,
  },
];

export default function Onboarding() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (pathname === "/login") return;
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) {
        // First render must match the server (hidden); only after mount can we safely
        // read localStorage to decide whether a new browser/collaborator needs the tour.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // ignore — per-browser convenience only
    }
  }, [pathname]);

  useEffect(() => {
    function handleOpen() {
      setStep(0);
      setVisible(true);
    }
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  function finish() {
    setVisible(false);
    try {
      localStorage.setItem(ONBOARD_KEY, "true");
    } catch {
      // ignore
    }
  }

  if (!visible || pathname === "/login") return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="modal-backdrop onboarding-backdrop">
      <div className="modal onboarding-card">
        <button type="button" className="onboarding-close" onClick={finish} aria-label="Skip tour">
          ×
        </button>
        <div className="dlg">
          <span className="onboarding-icon">{current.icon}</span>
          <h3>{current.title}</h3>
          <p className="onboarding-body">{current.body}</p>

          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <span key={i} className={`onboarding-dot${i === step ? " active" : ""}`} />
            ))}
          </div>

          <div className="actions">
            {step > 0 ? (
              <button type="button" className="btn" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            ) : (
              <button type="button" className="btn" onClick={finish}>
                Skip tour
              </button>
            )}
            <span className="grow" />
            <button
              type="button"
              className="btn primary"
              onClick={isLast ? finish : () => setStep((s) => s + 1)}
            >
              {isLast ? "Get started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function openOnboarding() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

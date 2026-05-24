import { Logo } from "./Logo";

/**
 * The loading overlay shown by XRScene until the XR session is ready.
 * `shouldFadeOut` is driven by the SDK's `useXRReady` (via XRScene).
 */
export const Loading = ({ shouldFadeOut }: { shouldFadeOut: boolean }) => (
  <div
    className={`w-full h-full bg-[var(--color-bg-app)] ${
      shouldFadeOut ? "animate-fadeOut [animation-delay:0.3s]" : ""
    }`}
  >
    <div
      className={`flex flex-col items-center min-h-screen font-poppins text-[var(--color-fg-app)] ${
        shouldFadeOut ? "animate-fadeOut" : ""
      }`}
    >
      <div className="mt-16 text-center">
        <p className="text-2xl font-light">powered by Vincentt.studio</p>
      </div>
      <div className="flex flex-col items-center w-full flex-1">
        <div className="mt-36">
          <Logo size={144} />
        </div>
        <div className="flex space-x-3 mt-16">
          <div className="h-4 w-4 rounded-full bg-[var(--color-accent)] animate-bounceLoop [animation-delay:0s]" />
          <div className="h-4 w-4 rounded-full bg-[var(--color-accent)] animate-bounceLoop [animation-delay:0.4s]" />
          <div className="h-4 w-4 rounded-full bg-[var(--color-accent)] animate-bounceLoop [animation-delay:0.8s]" />
          <div className="h-4 w-4 rounded-full bg-[var(--color-accent)] animate-bounceLoop [animation-delay:1.2s]" />
        </div>
      </div>
    </div>
  </div>
);
